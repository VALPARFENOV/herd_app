-- HerdMaster Pro - Data Import Wizard Schema
-- Tables for tracking import sessions, field mappings, and errors

-- ============================================================================
-- IMPORT SESSIONS
-- ============================================================================

CREATE TABLE public.import_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),

    -- Source info
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('excel', 'csv', 'dairycomp')),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER, -- in bytes

    -- Target
    target_entity VARCHAR(50) NOT NULL CHECK (target_entity IN ('animals', 'events', 'lactations', 'milk_data')),

    -- Progress tracking
    total_rows INTEGER DEFAULT 0,
    imported_rows INTEGER DEFAULT 0,
    skipped_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,

    -- Field mapping (saved for reference)
    field_mapping JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'analyzing', 'mapped', 'validating', 'validated', 'importing', 'completed', 'failed', 'cancelled')),

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_sessions_tenant ON public.import_sessions(tenant_id);
CREATE INDEX idx_import_sessions_status ON public.import_sessions(status);
CREATE INDEX idx_import_sessions_created ON public.import_sessions(created_at DESC);

-- ============================================================================
-- IMPORT TEMPLATES (saved field mappings)
-- ============================================================================

CREATE TABLE public.import_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for system templates

    name VARCHAR(100) NOT NULL,
    description TEXT,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('excel', 'csv', 'dairycomp')),
    target_entity VARCHAR(50) NOT NULL CHECK (target_entity IN ('animals', 'events', 'lactations', 'milk_data')),

    -- The mapping configuration
    field_mapping JSONB NOT NULL DEFAULT '{}',
    -- Expected columns (for validation)
    expected_columns JSONB DEFAULT '[]',

    is_system BOOLEAN DEFAULT false, -- true for pre-built templates (DairyComp, etc.)
    is_active BOOLEAN DEFAULT true,

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, name, target_entity)
);

CREATE INDEX idx_import_templates_tenant ON public.import_templates(tenant_id);
CREATE INDEX idx_import_templates_entity ON public.import_templates(target_entity);

-- ============================================================================
-- IMPORT ERRORS (detailed error tracking)
-- ============================================================================

CREATE TABLE public.import_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.import_sessions(id) ON DELETE CASCADE,

    row_number INTEGER NOT NULL,
    column_name VARCHAR(100),
    original_value TEXT,

    error_type VARCHAR(50) NOT NULL CHECK (error_type IN (
        'required_field', 'invalid_format', 'invalid_date', 'invalid_number',
        'duplicate', 'reference_not_found', 'logic_error', 'unknown'
    )),
    error_message TEXT NOT NULL,

    -- Whether this error can be skipped (warning vs error)
    is_warning BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_errors_session ON public.import_errors(session_id);
CREATE INDEX idx_import_errors_type ON public.import_errors(session_id, error_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_import_sessions_updated_at BEFORE UPDATE ON public.import_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_templates_updated_at BEFORE UPDATE ON public.import_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;

-- Import sessions: tenant isolation
CREATE POLICY import_sessions_tenant_isolation ON public.import_sessions
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- Import templates: tenant isolation + system templates visible to all
CREATE POLICY import_templates_read ON public.import_templates
    FOR SELECT USING (tenant_id = auth.tenant_id() OR is_system = true);

CREATE POLICY import_templates_write ON public.import_templates
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- Import errors: through session relationship
CREATE POLICY import_errors_tenant_isolation ON public.import_errors
    FOR ALL USING (
        session_id IN (
            SELECT id FROM public.import_sessions WHERE tenant_id = auth.tenant_id()
        )
    );

-- ============================================================================
-- SYSTEM TEMPLATES (pre-built mappings)
-- ============================================================================

-- DairyComp 305 export format template
INSERT INTO public.import_templates (id, tenant_id, name, description, source_type, target_entity, field_mapping, is_system)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    NULL,
    'DairyComp 305 Export',
    'Standard DairyComp 305 cow list export format',
    'dairycomp',
    'animals',
    '{
        "ID": "ear_tag",
        "NAME": "name",
        "BDAT": "birth_date",
        "BREED": "breed",
        "LACT": "lactation_number",
        "FDAT": "last_calving_date",
        "STAT": "current_status",
        "PEN": "pen_name",
        "SIRE": "sire_registration",
        "DAM": "dam_registration"
    }'::jsonb,
    true
);

-- Standard Excel template
INSERT INTO public.import_templates (id, tenant_id, name, description, source_type, target_entity, field_mapping, expected_columns, is_system)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    NULL,
    'Standard Animal Import',
    'Basic animal import with common field names',
    'excel',
    'animals',
    '{
        "ear_tag": "ear_tag",
        "name": "name",
        "birth_date": "birth_date",
        "breed": "breed",
        "sex": "sex",
        "status": "current_status",
        "lactation": "lactation_number",
        "pen": "pen_name"
    }'::jsonb,
    '["ear_tag", "birth_date", "breed"]'::jsonb,
    true
);
