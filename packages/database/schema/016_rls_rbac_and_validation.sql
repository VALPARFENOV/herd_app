-- ============================================================================
-- Migration 016: Role-Based Access Control + Validation Constraints
-- ============================================================================
-- Fixes critical security issues found during QA:
-- 1. RLS policies only check tenant_id, not user role (viewer can write/delete)
-- 2. PostgREST allows hard DELETE (bypassing soft-delete pattern)
-- 3. Missing CHECK constraints on date and numeric fields
-- ============================================================================

-- ============================================================================
-- PART 1: Helper function for write access check
-- ============================================================================

-- Roles that can write (INSERT/UPDATE/DELETE) data
CREATE OR REPLACE FUNCTION auth.can_write()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('owner', 'manager', 'veterinarian', 'zootechnician', 'accountant', 'worker')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Roles that can delete data (more restrictive)
CREATE OR REPLACE FUNCTION auth.can_delete()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('owner', 'manager')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION auth.can_write() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.can_delete() TO authenticated;

-- ============================================================================
-- PART 2: Replace "FOR ALL" policies with role-based CRUD policies
-- ============================================================================

-- --------------------------------------------------------------------------
-- ANIMALS: Replace single ALL policy with separate SELECT/INSERT/UPDATE/DELETE
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS animals_tenant_isolation ON public.animals;

CREATE POLICY animals_select ON public.animals
    FOR SELECT USING (tenant_id = auth.tenant_id() AND deleted_at IS NULL);

CREATE POLICY animals_insert ON public.animals
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY animals_update ON public.animals
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND deleted_at IS NULL AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

-- Only owner/manager can delete; soft-delete enforced by trigger below
CREATE POLICY animals_delete ON public.animals
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- EVENTS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS events_tenant_isolation ON public.events;

CREATE POLICY events_select ON public.events
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY events_insert ON public.events
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY events_update ON public.events
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY events_delete ON public.events
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- LACTATIONS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS lactations_tenant_isolation ON public.lactations;

CREATE POLICY lactations_select ON public.lactations
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY lactations_insert ON public.lactations
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY lactations_update ON public.lactations
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY lactations_delete ON public.lactations
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- MILK_READINGS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS milk_readings_tenant_isolation ON public.milk_readings;

CREATE POLICY milk_readings_select ON public.milk_readings
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY milk_readings_insert ON public.milk_readings
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY milk_readings_update ON public.milk_readings
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY milk_readings_delete ON public.milk_readings
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- HOOF_INSPECTIONS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS hoof_inspections_tenant_isolation ON public.hoof_inspections;

CREATE POLICY hoof_inspections_select ON public.hoof_inspections
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY hoof_inspections_insert ON public.hoof_inspections
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY hoof_inspections_update ON public.hoof_inspections
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY hoof_inspections_delete ON public.hoof_inspections
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- UDDER_QUARTER_TESTS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS udder_tests_tenant_isolation ON public.udder_quarter_tests;

CREATE POLICY udder_tests_select ON public.udder_quarter_tests
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY udder_tests_insert ON public.udder_quarter_tests
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY udder_tests_update ON public.udder_quarter_tests
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY udder_tests_delete ON public.udder_quarter_tests
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- SERVICE_PROVIDERS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS service_providers_tenant_isolation ON public.service_providers;

CREATE POLICY service_providers_select ON public.service_providers
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY service_providers_insert ON public.service_providers
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY service_providers_update ON public.service_providers
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY service_providers_delete ON public.service_providers
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- SERVICE_VISITS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS service_visits_tenant_isolation ON public.service_visits;

CREATE POLICY service_visits_select ON public.service_visits
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY service_visits_insert ON public.service_visits
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY service_visits_update ON public.service_visits
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY service_visits_delete ON public.service_visits
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- CHEMICAL_TREATMENTS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS chemical_treatments_tenant_isolation ON public.chemical_treatments;

CREATE POLICY chemical_treatments_select ON public.chemical_treatments
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY chemical_treatments_insert ON public.chemical_treatments
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY chemical_treatments_update ON public.chemical_treatments
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY chemical_treatments_delete ON public.chemical_treatments
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- BARNS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS barns_tenant_isolation ON public.barns;

CREATE POLICY barns_select ON public.barns
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY barns_insert ON public.barns
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY barns_update ON public.barns
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY barns_delete ON public.barns
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- PENS: Replace single ALL policy
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS pens_tenant_isolation ON public.pens;

CREATE POLICY pens_select ON public.pens
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY pens_insert ON public.pens
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY pens_update ON public.pens
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY pens_delete ON public.pens
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- ECONOMIC TABLES: Replace single ALL policies
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS economic_settings_tenant_isolation ON public.economic_settings;
DROP POLICY IF EXISTS cost_entries_tenant_isolation ON public.cost_entries;
DROP POLICY IF EXISTS milk_sales_tenant_isolation ON public.milk_sales;
DROP POLICY IF EXISTS cow_valuations_tenant_isolation ON public.cow_valuations;

-- economic_settings
CREATE POLICY economic_settings_select ON public.economic_settings
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY economic_settings_insert ON public.economic_settings
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY economic_settings_update ON public.economic_settings
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY economic_settings_delete ON public.economic_settings
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- cost_entries
CREATE POLICY cost_entries_select ON public.cost_entries
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY cost_entries_insert ON public.cost_entries
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY cost_entries_update ON public.cost_entries
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY cost_entries_delete ON public.cost_entries
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- milk_sales
CREATE POLICY milk_sales_select ON public.milk_sales
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY milk_sales_insert ON public.milk_sales
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY milk_sales_update ON public.milk_sales
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY milk_sales_delete ON public.milk_sales
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- cow_valuations
CREATE POLICY cow_valuations_select ON public.cow_valuations
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY cow_valuations_insert ON public.cow_valuations
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY cow_valuations_update ON public.cow_valuations
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY cow_valuations_delete ON public.cow_valuations
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- REPORT_TEMPLATES: Replace ALL policy (keep public/system override)
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS report_templates_tenant_isolation ON public.report_templates;

CREATE POLICY report_templates_select ON public.report_templates
    FOR SELECT USING (tenant_id = auth.tenant_id() OR is_public = true OR is_system = true);

CREATE POLICY report_templates_insert ON public.report_templates
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());

CREATE POLICY report_templates_update ON public.report_templates
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY report_templates_delete ON public.report_templates
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- SCHEDULED_REPORTS and REPORT_RUNS: Replace ALL policies
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS scheduled_reports_tenant_isolation ON public.scheduled_reports;
DROP POLICY IF EXISTS report_runs_tenant_isolation ON public.report_runs;

CREATE POLICY scheduled_reports_select ON public.scheduled_reports
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY scheduled_reports_insert ON public.scheduled_reports
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY scheduled_reports_update ON public.scheduled_reports
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY scheduled_reports_delete ON public.scheduled_reports
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

CREATE POLICY report_runs_select ON public.report_runs
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY report_runs_insert ON public.report_runs
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY report_runs_update ON public.report_runs
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY report_runs_delete ON public.report_runs
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- --------------------------------------------------------------------------
-- Tables that already have separate CRUD policies (006_bulls, 007_vet,
-- 008_milk_quality, 009_alerts): Add auth.can_write() check to INSERT/UPDATE
-- and auth.can_delete() to DELETE policies.
-- --------------------------------------------------------------------------

-- BULLS
DROP POLICY IF EXISTS "Users can insert bulls for their tenant" ON public.bulls;
DROP POLICY IF EXISTS "Users can update their tenant's bulls" ON public.bulls;
DROP POLICY IF EXISTS "Users can soft delete their tenant's bulls" ON public.bulls;

CREATE POLICY "Users can insert bulls for their tenant" ON public.bulls
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY "Users can update their tenant's bulls" ON public.bulls
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can soft delete their tenant's bulls" ON public.bulls
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- SEMEN_INVENTORY
DROP POLICY IF EXISTS "Users can insert semen inventory for their tenant" ON public.semen_inventory;
DROP POLICY IF EXISTS "Users can update their tenant's semen inventory" ON public.semen_inventory;
DROP POLICY IF EXISTS "Users can delete their tenant's semen inventory" ON public.semen_inventory;

CREATE POLICY "Users can insert semen inventory for their tenant" ON public.semen_inventory
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY "Users can update their tenant's semen inventory" ON public.semen_inventory
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's semen inventory" ON public.semen_inventory
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- DRUGS
DROP POLICY IF EXISTS "Users can insert drugs for their tenant" ON public.drugs;
DROP POLICY IF EXISTS "Users can update their tenant's drugs" ON public.drugs;
DROP POLICY IF EXISTS "Users can delete their tenant's drugs" ON public.drugs;

CREATE POLICY "Users can insert drugs for their tenant" ON public.drugs
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY "Users can update their tenant's drugs" ON public.drugs
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's drugs" ON public.drugs
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- TREATMENT_PROTOCOLS
DROP POLICY IF EXISTS "Users can insert treatment protocols for their tenant" ON public.treatment_protocols;
DROP POLICY IF EXISTS "Users can update their tenant's treatment protocols" ON public.treatment_protocols;
DROP POLICY IF EXISTS "Users can delete their tenant's treatment protocols" ON public.treatment_protocols;

CREATE POLICY "Users can insert treatment protocols for their tenant" ON public.treatment_protocols
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY "Users can update their tenant's treatment protocols" ON public.treatment_protocols
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's treatment protocols" ON public.treatment_protocols
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- MILK_TESTS
DROP POLICY IF EXISTS "Users can insert milk tests for their tenant" ON public.milk_tests;
DROP POLICY IF EXISTS "Users can update their tenant's milk tests" ON public.milk_tests;
DROP POLICY IF EXISTS "Users can delete their tenant's milk tests" ON public.milk_tests;

CREATE POLICY "Users can insert milk tests for their tenant" ON public.milk_tests
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY "Users can update their tenant's milk tests" ON public.milk_tests
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's milk tests" ON public.milk_tests
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- BULK_TANK_READINGS
DROP POLICY IF EXISTS "Users can insert bulk tank readings for their tenant" ON public.bulk_tank_readings;
DROP POLICY IF EXISTS "Users can update their tenant's bulk tank readings" ON public.bulk_tank_readings;
DROP POLICY IF EXISTS "Users can delete their tenant's bulk tank readings" ON public.bulk_tank_readings;

CREATE POLICY "Users can insert bulk tank readings for their tenant" ON public.bulk_tank_readings
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY "Users can update their tenant's bulk tank readings" ON public.bulk_tank_readings
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's bulk tank readings" ON public.bulk_tank_readings
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- ALERT_RULES
DROP POLICY IF EXISTS "Users can insert alert rules for their tenant" ON public.alert_rules;
DROP POLICY IF EXISTS "Users can update their tenant's alert rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Users can delete their tenant's alert rules" ON public.alert_rules;

CREATE POLICY "Users can insert alert rules for their tenant" ON public.alert_rules
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY "Users can update their tenant's alert rules" ON public.alert_rules
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's alert rules" ON public.alert_rules
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can insert notifications for their tenant" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their tenant's notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their tenant's notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications for their tenant" ON public.notifications
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id() AND auth.can_write());
CREATE POLICY "Users can update their tenant's notifications" ON public.notifications
    FOR UPDATE USING (tenant_id = auth.tenant_id() AND auth.can_write())
    WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's notifications" ON public.notifications
    FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.can_delete());

-- ============================================================================
-- PART 3: Prevent hard DELETE on animals (convert to soft delete)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.soft_delete_animal()
RETURNS TRIGGER AS $$
BEGIN
    -- Instead of hard deleting, set deleted_at timestamp
    UPDATE public.animals
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = OLD.id;
    -- Cancel the DELETE operation
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER animals_soft_delete_trigger
    BEFORE DELETE ON public.animals
    FOR EACH ROW
    EXECUTE FUNCTION public.soft_delete_animal();

-- ============================================================================
-- PART 4: Validation CHECK constraints
-- ============================================================================

-- Future date prevention
ALTER TABLE public.animals
    ADD CONSTRAINT chk_animals_birth_date_not_future
    CHECK (birth_date <= CURRENT_DATE);

ALTER TABLE public.events
    ADD CONSTRAINT chk_events_date_not_future
    CHECK (event_date <= CURRENT_DATE + INTERVAL '1 day');

ALTER TABLE public.hoof_inspections
    ADD CONSTRAINT chk_hoof_inspection_date_not_future
    CHECK (inspection_date <= CURRENT_DATE + INTERVAL '1 day');

-- Numeric upper bounds
-- World record daily milk yield is ~80 kg; allow 100 for safety
ALTER TABLE public.milk_readings
    ADD CONSTRAINT chk_milk_kg_upper_bound
    CHECK (milk_kg <= 100);

-- Udder test result_value should be non-negative (SCC can reach millions)
ALTER TABLE public.udder_quarter_tests
    ADD CONSTRAINT chk_result_value_range
    CHECK (result_value >= 0 AND result_value <= 9999999);

-- Session ID enum
ALTER TABLE public.milk_readings
    ADD CONSTRAINT chk_session_id_enum
    CHECK (session_id IN ('morning', 'afternoon', 'evening', 'night'));

-- Event type enum
ALTER TABLE public.events
    ADD CONSTRAINT chk_event_type_enum
    CHECK (event_type IN (
        'heat', 'insemination', 'pregnancy_check', 'calving',
        'dry_off', 'treatment', 'vaccination', 'breeding', 'other'
    ));
