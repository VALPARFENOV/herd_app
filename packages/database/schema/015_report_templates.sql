-- HerdMaster Pro - Custom Report Builder
-- Report templates, scheduled reports, and execution history
-- Phase 4: Custom Reports and Report Builder

-- ============================================================================
-- REPORT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Template metadata
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'breeding', 'production', 'health', 'economics', 'custom'

    -- Template configuration (JSONB for flexibility)
    template_data JSONB NOT NULL,
    /*
    Example structure:
    {
      "fields": ["ID", "PEN", "LACT", "DIM", "MILK", "SCC"],
      "filters": [
        {"field": "RC", "operator": "=", "value": 5},
        {"field": "DIM", "operator": ">", "value": 60}
      ],
      "groupBy": ["PEN"],
      "sortBy": [{"field": "MILK", "direction": "desc"}],
      "calculations": [
        {"name": "Avg Milk", "formula": "AVG(MILK)", "description": "Average milk per pen"}
      ],
      "visualization": {
        "type": "table",
        "chartType": "bar",
        "chartConfig": {}
      }
    }
    */

    -- Sharing and visibility
    is_public BOOLEAN DEFAULT false, -- Share with other tenants (admin-curated templates)
    is_system BOOLEAN DEFAULT false, -- Pre-built system templates

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_report_templates_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- SCHEDULED REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL,

    -- Schedule configuration
    schedule_config JSONB NOT NULL,
    /*
    Example structure:
    {
      "frequency": "weekly",
      "dayOfWeek": 1,
      "time": "08:00",
      "recipients": ["manager@farm.com", "owner@farm.com"],
      "format": "pdf",
      "enabled": true
    }
    */

    -- Execution tracking
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_scheduled_reports_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_scheduled_reports_template
        FOREIGN KEY (template_id) REFERENCES public.report_templates(id) ON DELETE CASCADE
);

-- ============================================================================
-- REPORT RUNS TABLE (Execution History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    scheduled_report_id UUID,
    template_id UUID NOT NULL,

    -- Execution details
    run_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) NOT NULL, -- 'pending', 'running', 'success', 'failed'

    -- Results
    row_count INTEGER,
    execution_time_ms INTEGER,
    output_url TEXT, -- S3/MinIO URL for generated file
    output_format VARCHAR(10), -- 'pdf', 'excel', 'csv'

    -- Error tracking
    error_message TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_report_runs_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_runs_scheduled
        FOREIGN KEY (scheduled_report_id) REFERENCES public.scheduled_reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_runs_template
        FOREIGN KEY (template_id) REFERENCES public.report_templates(id) ON DELETE CASCADE,
    CONSTRAINT chk_report_status
        CHECK (status IN ('pending', 'running', 'success', 'failed'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Report templates indexes
CREATE INDEX idx_report_templates_tenant
    ON public.report_templates(tenant_id, category)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_report_templates_public
    ON public.report_templates(is_public)
    WHERE is_public = true AND deleted_at IS NULL;

CREATE INDEX idx_report_templates_system
    ON public.report_templates(is_system)
    WHERE is_system = true AND deleted_at IS NULL;

-- Scheduled reports indexes
CREATE INDEX idx_scheduled_reports_tenant
    ON public.scheduled_reports(tenant_id, is_active)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_scheduled_reports_next_run
    ON public.scheduled_reports(next_run_at)
    WHERE is_active = true AND deleted_at IS NULL;

-- Report runs indexes
CREATE INDEX idx_report_runs_tenant_date
    ON public.report_runs(tenant_id, run_at DESC);

CREATE INDEX idx_report_runs_scheduled
    ON public.report_runs(scheduled_report_id, run_at DESC);

CREATE INDEX idx_report_runs_status
    ON public.report_runs(status, run_at DESC)
    WHERE status IN ('pending', 'running');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;

-- Report templates policies
CREATE POLICY report_templates_tenant_isolation ON public.report_templates
    FOR ALL
    USING (tenant_id = auth.tenant_id() OR is_public = true OR is_system = true);

-- Scheduled reports policies
CREATE POLICY scheduled_reports_tenant_isolation ON public.scheduled_reports
    FOR ALL
    USING (tenant_id = auth.tenant_id());

-- Report runs policies
CREATE POLICY report_runs_tenant_isolation ON public.report_runs
    FOR ALL
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_reports TO authenticated;
GRANT SELECT, INSERT ON public.report_runs TO authenticated;

GRANT ALL ON public.report_templates TO service_role;
GRANT ALL ON public.scheduled_reports TO service_role;
GRANT ALL ON public.report_runs TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.report_templates IS
'Custom report templates with field selection, filters, grouping, and visualization config';

COMMENT ON TABLE public.scheduled_reports IS
'Scheduled report execution configuration (daily/weekly/monthly with email delivery)';

COMMENT ON TABLE public.report_runs IS
'Report execution history with status, output files, and error tracking';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate next run time for scheduled report
CREATE OR REPLACE FUNCTION public.calculate_next_run(
    p_schedule_config JSONB
) RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_frequency TEXT;
    v_time TEXT;
    v_next_run TIMESTAMPTZ;
    v_day_of_week INTEGER;
    v_day_of_month INTEGER;
BEGIN
    v_frequency := p_schedule_config->>'frequency';
    v_time := COALESCE(p_schedule_config->>'time', '08:00');

    CASE v_frequency
        WHEN 'daily' THEN
            v_next_run := (CURRENT_DATE + INTERVAL '1 day' + v_time::TIME);

        WHEN 'weekly' THEN
            v_day_of_week := COALESCE((p_schedule_config->>'dayOfWeek')::INTEGER, 1); -- Default Monday
            v_next_run := (
                DATE_TRUNC('week', CURRENT_DATE) +
                (v_day_of_week || ' days')::INTERVAL +
                v_time::TIME
            );
            IF v_next_run <= NOW() THEN
                v_next_run := v_next_run + INTERVAL '1 week';
            END IF;

        WHEN 'monthly' THEN
            v_day_of_month := COALESCE((p_schedule_config->>'dayOfMonth')::INTEGER, 1); -- Default 1st
            v_next_run := (
                DATE_TRUNC('month', CURRENT_DATE) +
                ((v_day_of_month - 1) || ' days')::INTERVAL +
                v_time::TIME
            );
            IF v_next_run <= NOW() THEN
                v_next_run := v_next_run + INTERVAL '1 month';
            END IF;

        ELSE
            v_next_run := NOW() + INTERVAL '1 day';
    END CASE;

    RETURN v_next_run;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_next_run IS
'Calculate next execution time for scheduled report based on frequency';

-- Trigger to update next_run_at when schedule_config changes
CREATE OR REPLACE FUNCTION public.update_scheduled_report_next_run()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.schedule_config IS DISTINCT FROM OLD.schedule_config) THEN
        NEW.next_run_at := public.calculate_next_run(NEW.schedule_config);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_run
    BEFORE INSERT OR UPDATE ON public.scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_scheduled_report_next_run();

-- ============================================================================
-- SEED DATA: System Report Templates
-- ============================================================================

-- Insert pre-built report templates
INSERT INTO public.report_templates (id, tenant_id, name, description, category, template_data, is_system, is_public, created_at)
SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::UUID, -- System tenant
    'To Breed Today',
    'Cows ready for AI (RC=3, DIM>60)',
    'breeding',
    '{
        "fields": ["ID", "PEN", "LACT", "DIM", "DSLH"],
        "filters": [
            {"field": "RC", "operator": "=", "value": 3},
            {"field": "DIM", "operator": ">", "value": 60}
        ],
        "sortBy": [{"field": "DIM", "direction": "desc"}],
        "visualization": {"type": "table"}
    }'::JSONB,
    true,
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.report_templates WHERE name = 'To Breed Today' AND is_system = true
);

INSERT INTO public.report_templates (id, tenant_id, name, description, category, template_data, is_system, is_public, created_at)
SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    'Pregnancy Check List',
    'Bred cows 35-45 days post-breeding',
    'breeding',
    '{
        "fields": ["ID", "PEN", "LACT", "DSLB", "TBRD"],
        "filters": [
            {"field": "RC", "operator": "=", "value": 4},
            {"field": "DSLB", "operator": ">=", "value": 35},
            {"field": "DSLB", "operator": "<=", "value": 45}
        ],
        "sortBy": [{"field": "DSLB", "direction": "asc"}],
        "visualization": {"type": "table"}
    }'::JSONB,
    true,
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.report_templates WHERE name = 'Pregnancy Check List' AND is_system = true
);

INSERT INTO public.report_templates (id, tenant_id, name, description, category, template_data, is_system, is_public, created_at)
SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    'High SCC Alert',
    'Mastitis risk cows (SCC>200k)',
    'health',
    '{
        "fields": ["ID", "PEN", "SCC", "LGSCC", "DIM"],
        "filters": [
            {"field": "SCC", "operator": ">", "value": 200000}
        ],
        "sortBy": [{"field": "SCC", "direction": "desc"}],
        "visualization": {"type": "table"}
    }'::JSONB,
    true,
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.report_templates WHERE name = 'High SCC Alert' AND is_system = true
);

INSERT INTO public.report_templates (id, tenant_id, name, description, category, template_data, is_system, is_public, created_at)
SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    'Top Producers',
    'Highest milk cows by 305ME',
    'production',
    '{
        "fields": ["ID", "LACT", "305ME", "DIM", "MILK"],
        "filters": [
            {"field": "LACT", "operator": ">", "value": 0}
        ],
        "sortBy": [{"field": "305ME", "direction": "desc"}],
        "visualization": {"type": "both", "chartType": "bar"}
    }'::JSONB,
    true,
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.report_templates WHERE name = 'Top Producers' AND is_system = true
);

INSERT INTO public.report_templates (id, tenant_id, name, description, category, template_data, is_system, is_public, created_at)
SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    'Cull Candidates',
    'Low value cows - potential culls',
    'economics',
    '{
        "fields": ["ID", "LACT", "MILK", "SCC", "RELV"],
        "filters": [
            {"field": "LACT", "operator": ">=", "value": 4},
            {"field": "MILK", "operator": "<", "value": 25}
        ],
        "sortBy": [{"field": "RELV", "direction": "asc"}],
        "visualization": {"type": "table"}
    }'::JSONB,
    true,
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.report_templates WHERE name = 'Cull Candidates' AND is_system = true
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    'Report templates tables created' AS status,
    (SELECT COUNT(*) FROM public.report_templates WHERE is_system = true) AS system_templates;
