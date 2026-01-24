-- HerdMaster Pro - Alerts & Notifications Schema
-- Alert rules, notifications, and notification center

-- ============================================================================
-- ALERT RULES TABLE - Configurable alert rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Rule identification
    rule_type VARCHAR(50) NOT NULL, -- 'calving_due', 'preg_check_overdue', 'high_scc', etc.
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Rule configuration
    condition JSONB, -- {"threshold": 7, "operator": "<=", "field": "days_to_calving"}
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'

    -- Actions
    notification_channels JSONB, -- ["app", "email", "sms"]
    target_roles JSONB, -- ["owner", "manager", "herdsman"]

    -- Schedule
    check_frequency VARCHAR(20) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly'
    check_time TIME, -- Time of day to check (for daily/weekly)

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT alert_rules_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT alert_rules_severity_check CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant ON public.alert_rules(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON public.alert_rules(tenant_id, rule_type) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON public.alert_rules(is_active) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's alert rules"
    ON public.alert_rules FOR SELECT
    USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can insert alert rules for their tenant"
    ON public.alert_rules FOR INSERT
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can update their tenant's alert rules"
    ON public.alert_rules FOR UPDATE
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can delete their tenant's alert rules"
    ON public.alert_rules FOR DELETE
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- NOTIFICATIONS TABLE - Individual notifications/alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Notification metadata
    alert_type VARCHAR(50) NOT NULL, -- 'calving_due', 'preg_check_overdue', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',

    -- Related entities
    animal_id UUID, -- If notification is about a specific animal
    related_entity_type VARCHAR(50), -- 'event', 'milk_test', 'treatment', etc.
    related_entity_id UUID,

    -- Action URL
    action_url VARCHAR(500), -- Deep link to relevant page

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMPTZ,

    -- Delivery
    delivered_channels JSONB, -- ["app", "email"] - channels where it was delivered
    delivery_status JSONB, -- {"app": "sent", "email": "pending", "sms": "failed"}

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Auto-delete old notifications

    -- Constraints
    CONSTRAINT notifications_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT notifications_animal_fk FOREIGN KEY (animal_id) REFERENCES public.animals(id) ON DELETE CASCADE,
    CONSTRAINT notifications_severity_check CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created ON public.notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_animal ON public.notifications(animal_id) WHERE animal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(tenant_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(tenant_id, alert_type, created_at DESC);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's notifications"
    ON public.notifications FOR SELECT
    USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can insert notifications for their tenant"
    ON public.notifications FOR INSERT
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can update their tenant's notifications"
    ON public.notifications FOR UPDATE
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can delete their tenant's notifications"
    ON public.notifications FOR DELETE
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true,
        read_at = NOW()
    WHERE id = p_notification_id
      AND is_read = false;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a tenant
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET is_read = true,
        read_at = NOW()
    WHERE tenant_id = p_tenant_id
      AND is_read = false;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_tenant_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE tenant_id = p_tenant_id
      AND is_read = false
      AND is_dismissed = false;
$$ LANGUAGE SQL STABLE;

-- Function to generate calving due alerts
CREATE OR REPLACE FUNCTION public.generate_calving_due_alerts(p_tenant_id UUID, p_days_threshold INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    v_animal RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_animal IN
        SELECT
            a.id,
            a.ear_tag,
            a.name,
            a.expected_calving_date,
            (a.expected_calving_date - CURRENT_DATE) as days_to_calving
        FROM public.animals a
        WHERE a.tenant_id = p_tenant_id
          AND a.reproductive_status = 'pregnant'
          AND a.expected_calving_date IS NOT NULL
          AND a.expected_calving_date BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_threshold
          AND a.deleted_at IS NULL
          -- Don't create duplicate notifications for the same day
          AND NOT EXISTS (
              SELECT 1 FROM public.notifications n
              WHERE n.animal_id = a.id
                AND n.alert_type = 'calving_due'
                AND n.created_at::DATE = CURRENT_DATE
          )
    LOOP
        INSERT INTO public.notifications (
            tenant_id, alert_type, title, message, severity,
            animal_id, action_url
        ) VALUES (
            p_tenant_id,
            'calving_due',
            'Calving Due: ' || v_animal.ear_tag,
            CASE
                WHEN v_animal.days_to_calving = 0 THEN 'Calving expected TODAY'
                WHEN v_animal.days_to_calving = 1 THEN 'Calving expected in 1 day'
                ELSE 'Calving expected in ' || v_animal.days_to_calving || ' days'
            END || ' (' || TO_CHAR(v_animal.expected_calving_date, 'Mon DD') || ')',
            CASE
                WHEN v_animal.days_to_calving <= 2 THEN 'critical'
                WHEN v_animal.days_to_calving <= 5 THEN 'warning'
                ELSE 'info'
            END,
            v_animal.id,
            '/animals/' || v_animal.id
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate pregnancy check overdue alerts
CREATE OR REPLACE FUNCTION public.generate_preg_check_overdue_alerts(p_tenant_id UUID, p_days_threshold INTEGER DEFAULT 40)
RETURNS INTEGER AS $$
DECLARE
    v_animal RECORD;
    v_count INTEGER := 0;
    v_days_since_breeding INTEGER;
BEGIN
    FOR v_animal IN
        SELECT
            a.id,
            a.ear_tag,
            a.name,
            a.last_breeding_date,
            (CURRENT_DATE - a.last_breeding_date) as days_since_breeding
        FROM public.animals a
        WHERE a.tenant_id = p_tenant_id
          AND a.reproductive_status = 'bred'
          AND a.last_breeding_date IS NOT NULL
          AND (CURRENT_DATE - a.last_breeding_date) >= p_days_threshold
          AND a.deleted_at IS NULL
          -- Don't create duplicate notifications
          AND NOT EXISTS (
              SELECT 1 FROM public.notifications n
              WHERE n.animal_id = a.id
                AND n.alert_type = 'preg_check_overdue'
                AND n.created_at >= CURRENT_DATE - 7 -- Don't spam, once per week
          )
    LOOP
        INSERT INTO public.notifications (
            tenant_id, alert_type, title, message, severity,
            animal_id, action_url
        ) VALUES (
            p_tenant_id,
            'preg_check_overdue',
            'Pregnancy Check Overdue: ' || v_animal.ear_tag,
            'Bred ' || (CURRENT_DATE - v_animal.last_breeding_date) || ' days ago. Schedule pregnancy check.',
            'warning',
            v_animal.id,
            '/animals/' || v_animal.id
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate high SCC alerts
CREATE OR REPLACE FUNCTION public.generate_high_scc_alerts(p_tenant_id UUID, p_threshold INTEGER DEFAULT 400000)
RETURNS INTEGER AS $$
DECLARE
    v_animal RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_animal IN
        SELECT DISTINCT
            mt.animal_id,
            a.ear_tag,
            a.name,
            mt.scc,
            mt.test_date,
            (SELECT COUNT(*)
             FROM public.milk_tests mt2
             WHERE mt2.animal_id = mt.animal_id
               AND mt2.scc > p_threshold
               AND mt2.test_date >= CURRENT_DATE - 90
            ) as high_scc_count
        FROM public.milk_tests mt
        JOIN public.animals a ON a.id = mt.animal_id
        WHERE mt.tenant_id = p_tenant_id
          AND mt.scc > p_threshold
          AND mt.test_date >= CURRENT_DATE - 30
          AND mt.deleted_at IS NULL
          AND a.deleted_at IS NULL
          -- Don't create duplicate notifications
          AND NOT EXISTS (
              SELECT 1 FROM public.notifications n
              WHERE n.animal_id = mt.animal_id
                AND n.alert_type = 'high_scc'
                AND n.created_at >= CURRENT_DATE - 30
          )
    LOOP
        INSERT INTO public.notifications (
            tenant_id, alert_type, title, message, severity,
            animal_id, action_url
        ) VALUES (
            p_tenant_id,
            'high_scc',
            'High SCC Alert: ' || v_animal.ear_tag,
            'SCC: ' || (v_animal.scc / 1000)::INTEGER || 'K on ' || TO_CHAR(v_animal.test_date, 'Mon DD') ||
            '. ' || v_animal.high_scc_count || ' high test(s) in last 90 days. Check for mastitis.',
            CASE
                WHEN v_animal.high_scc_count >= 2 THEN 'critical'
                ELSE 'warning'
            END,
            v_animal.id,
            '/animals/' || v_animal.id
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate all daily alerts
CREATE OR REPLACE FUNCTION public.generate_daily_alerts(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_calving_count INTEGER;
    v_preg_check_count INTEGER;
    v_high_scc_count INTEGER;
BEGIN
    v_calving_count := public.generate_calving_due_alerts(p_tenant_id, 7);
    v_preg_check_count := public.generate_preg_check_overdue_alerts(p_tenant_id, 40);
    v_high_scc_count := public.generate_high_scc_alerts(p_tenant_id, 400000);

    RETURN jsonb_build_object(
        'calving_due', v_calving_count,
        'preg_check_overdue', v_preg_check_count,
        'high_scc', v_high_scc_count,
        'total', v_calving_count + v_preg_check_count + v_high_scc_count,
        'generated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER - Update timestamp
-- ============================================================================

CREATE TRIGGER update_alert_rules_updated_at
    BEFORE UPDATE ON public.alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Alerts & Notifications schema created successfully!' AS status;
