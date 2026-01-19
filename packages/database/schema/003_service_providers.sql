-- HerdMaster Pro - Service Providers & Health Data Schema
-- Detailed tracking for hoof trimmers, mastitis services, laboratories

-- ============================================================================
-- SERVICE PROVIDERS REGISTRY
-- ============================================================================

CREATE TABLE public.service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL
        CHECK (provider_type IN ('hoof_trimmer', 'mastitis_service', 'chemical_treatment', 'laboratory', 'veterinary', 'other')),

    -- Contact information
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,

    -- Integration settings
    integration_type VARCHAR(50) DEFAULT 'manual'
        CHECK (integration_type IN ('manual', 'csv_import', 'api')),
    integration_config JSONB DEFAULT '{}', -- API keys, endpoints, etc.

    is_active BOOLEAN DEFAULT true,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_service_providers_tenant ON public.service_providers(tenant_id);
CREATE INDEX idx_service_providers_type ON public.service_providers(tenant_id, provider_type);

-- ============================================================================
-- SERVICE VISITS (when providers visit the farm)
-- ============================================================================

CREATE TABLE public.service_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,

    visit_date DATE NOT NULL,
    technician_name VARCHAR(255),

    -- Summary
    animals_processed INTEGER DEFAULT 0,
    total_cost DECIMAL(10,2),

    notes TEXT,

    -- Import tracking
    import_source VARCHAR(100), -- 'manual', 'hoofscan', 'csv', etc.
    import_file_name VARCHAR(255),
    imported_at TIMESTAMPTZ,

    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_visits_tenant ON public.service_visits(tenant_id);
CREATE INDEX idx_service_visits_provider ON public.service_visits(provider_id);
CREATE INDEX idx_service_visits_date ON public.service_visits(tenant_id, visit_date DESC);

-- ============================================================================
-- HOOF INSPECTIONS
-- ============================================================================

CREATE TABLE public.hoof_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.service_visits(id) ON DELETE SET NULL,

    inspection_date DATE NOT NULL,
    inspector_name VARCHAR(255),

    -- Overall assessment
    locomotion_score INTEGER CHECK (locomotion_score BETWEEN 1 AND 5), -- 1=normal, 5=severe lameness
    overall_notes TEXT,

    -- Flags for quick filtering
    has_lesions BOOLEAN DEFAULT false,
    needs_followup BOOLEAN DEFAULT false,
    followup_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hoof_inspections_tenant ON public.hoof_inspections(tenant_id);
CREATE INDEX idx_hoof_inspections_animal ON public.hoof_inspections(animal_id);
CREATE INDEX idx_hoof_inspections_date ON public.hoof_inspections(tenant_id, inspection_date DESC);
CREATE INDEX idx_hoof_inspections_visit ON public.hoof_inspections(visit_id);

-- ============================================================================
-- HOOF ZONE FINDINGS (detailed per-zone data)
-- 11 zones per claw according to ICAR standard
-- ============================================================================

-- Zone reference:
-- 1 = Heel/bulb (пятка)
-- 2 = Sole junction zone (переход подошвы)
-- 3 = Apex of sole (носок подошвы)
-- 4 = White line at apex (белая линия - носок)
-- 5 = White line abaxial (белая линия - внешняя)
-- 6 = White line axial (белая линия - внутренняя)
-- 7 = Wall at apex (стенка - носок)
-- 8 = Wall abaxial (стенка - внешняя)
-- 9 = Wall axial (стенка - внутренняя)
-- 10 = Interdigital space (межпальцевая щель)
-- 11 = Coronary band (венчик)

CREATE TABLE public.hoof_zone_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.hoof_inspections(id) ON DELETE CASCADE,

    -- Location: 4 legs × 2 claws × 11 zones = 88 possible entries per inspection
    leg VARCHAR(2) NOT NULL CHECK (leg IN ('LF', 'LR', 'RF', 'RR')), -- Left/Right Front/Rear
    claw VARCHAR(10) NOT NULL CHECK (claw IN ('inner', 'outer')), -- medial/lateral (inner=medial, outer=lateral)
    zone INTEGER NOT NULL CHECK (zone BETWEEN 1 AND 11),

    -- Lesion details
    lesion_type VARCHAR(50), -- DD, SU, WLD, TU, IDD, HHE, etc.
    lesion_code VARCHAR(20), -- M0-M4.1 for DD, or other standard codes
    severity INTEGER DEFAULT 0 CHECK (severity BETWEEN 0 AND 3), -- 0=none, 1=mild, 2=moderate, 3=severe

    -- Treatment applied
    treatment_type VARCHAR(100), -- 'trim', 'block', 'wrap', 'topical', 'systemic'
    treatment_product VARCHAR(255),

    -- Tracking
    is_new BOOLEAN DEFAULT true, -- new vs recurring lesion
    is_healed BOOLEAN DEFAULT false,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(inspection_id, leg, claw, zone)
);

CREATE INDEX idx_hoof_findings_inspection ON public.hoof_zone_findings(inspection_id);
CREATE INDEX idx_hoof_findings_lesion ON public.hoof_zone_findings(lesion_type) WHERE lesion_type IS NOT NULL;

-- Common lesion types reference (for UI dropdowns):
COMMENT ON COLUMN public.hoof_zone_findings.lesion_type IS
'Common codes: DD=Digital Dermatitis, SU=Sole Ulcer, WLD=White Line Disease, TU=Toe Ulcer,
IDD=Interdigital Dermatitis, HHE=Heel Horn Erosion, TH=Thin Sole, OG=Overgrown,
VER=Verrucose/Hairy Warts, COR=Corkscrew, FT=Foreign Object';

-- ============================================================================
-- UDDER QUARTER TESTS (SCC, CMT, cultures per quarter)
-- ============================================================================

CREATE TABLE public.udder_quarter_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.service_visits(id) ON DELETE SET NULL,

    test_date DATE NOT NULL,
    test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('scc', 'cmt', 'culture', 'pcr')),

    -- Quarter: LF=Left Front, LR=Left Rear, RF=Right Front, RR=Right Rear
    quarter VARCHAR(2) NOT NULL CHECK (quarter IN ('LF', 'LR', 'RF', 'RR')),

    -- Results (flexible based on test type)
    result_value DECIMAL(15,2), -- numeric result (e.g., SCC count)
    result_text VARCHAR(50), -- text result (e.g., CMT score: '-', '+', '++', '+++')
    result_interpretation VARCHAR(50), -- 'normal', 'subclinical', 'clinical', 'infected'

    -- For bacterial cultures
    pathogen VARCHAR(100), -- e.g., 'S. aureus', 'Strep. uberis', 'E. coli', 'CNS'
    colony_count VARCHAR(50), -- 'light', 'moderate', 'heavy', or actual count

    -- Antibiotic sensitivity (JSON for flexibility)
    antibiotic_sensitivity JSONB DEFAULT '{}',
    -- Example: {"penicillin": "S", "ceftiofur": "S", "tetracycline": "R", "erythromycin": "I"}
    -- S=Sensitive, I=Intermediate, R=Resistant

    notes TEXT,

    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_udder_tests_tenant ON public.udder_quarter_tests(tenant_id);
CREATE INDEX idx_udder_tests_animal ON public.udder_quarter_tests(animal_id);
CREATE INDEX idx_udder_tests_date ON public.udder_quarter_tests(tenant_id, test_date DESC);
CREATE INDEX idx_udder_tests_type ON public.udder_quarter_tests(tenant_id, test_type);
CREATE INDEX idx_udder_tests_pathogen ON public.udder_quarter_tests(pathogen) WHERE pathogen IS NOT NULL;

-- ============================================================================
-- CHEMICAL TREATMENTS (farm-wide or group treatments)
-- ============================================================================

CREATE TABLE public.chemical_treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.service_visits(id) ON DELETE SET NULL,

    treatment_date DATE NOT NULL,
    treatment_type VARCHAR(100) NOT NULL, -- 'footbath', 'spray', 'pour-on', 'injection'

    -- Product details
    product_name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255),
    concentration VARCHAR(100),
    dosage VARCHAR(100),

    -- Scope
    scope VARCHAR(50) DEFAULT 'group' CHECK (scope IN ('individual', 'group', 'herd')),
    target_group VARCHAR(255), -- e.g., 'Pen 1A', 'Dry cows', 'All milking'
    animals_treated INTEGER,

    -- Withdrawal (for milk/meat)
    milk_withdrawal_hours INTEGER,
    meat_withdrawal_days INTEGER,
    withdrawal_end_date DATE,

    applied_by VARCHAR(255),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chemical_treatments_tenant ON public.chemical_treatments(tenant_id);
CREATE INDEX idx_chemical_treatments_date ON public.chemical_treatments(tenant_id, treatment_date DESC);

-- ============================================================================
-- ANIMAL-LEVEL CHEMICAL TREATMENTS (join table for individual tracking)
-- ============================================================================

CREATE TABLE public.animal_chemical_treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_id UUID NOT NULL REFERENCES public.chemical_treatments(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,

    -- Individual notes/observations
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(treatment_id, animal_id)
);

CREATE INDEX idx_animal_chem_treatment ON public.animal_chemical_treatments(treatment_id);
CREATE INDEX idx_animal_chem_animal ON public.animal_chemical_treatments(animal_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoof_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoof_zone_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.udder_quarter_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemical_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_chemical_treatments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY service_providers_tenant_isolation ON public.service_providers
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY service_visits_tenant_isolation ON public.service_visits
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY hoof_inspections_tenant_isolation ON public.hoof_inspections
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- hoof_zone_findings inherits through inspection
CREATE POLICY hoof_findings_tenant_isolation ON public.hoof_zone_findings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.hoof_inspections hi
            WHERE hi.id = hoof_zone_findings.inspection_id
            AND hi.tenant_id = auth.tenant_id()
        )
    );

CREATE POLICY udder_tests_tenant_isolation ON public.udder_quarter_tests
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY chemical_treatments_tenant_isolation ON public.chemical_treatments
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- animal_chemical_treatments inherits through treatment
CREATE POLICY animal_chem_tenant_isolation ON public.animal_chemical_treatments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chemical_treatments ct
            WHERE ct.id = animal_chemical_treatments.treatment_id
            AND ct.tenant_id = auth.tenant_id()
        )
    );

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON public.service_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_visits_updated_at BEFORE UPDATE ON public.service_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hoof_inspections_updated_at BEFORE UPDATE ON public.hoof_inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_udder_tests_updated_at BEFORE UPDATE ON public.udder_quarter_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chemical_treatments_updated_at BEFORE UPDATE ON public.chemical_treatments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS for common queries
-- ============================================================================

-- Latest hoof status per animal
CREATE OR REPLACE VIEW public.v_animal_hoof_status AS
SELECT DISTINCT ON (hi.animal_id)
    hi.animal_id,
    hi.inspection_date,
    hi.locomotion_score,
    hi.has_lesions,
    hi.needs_followup,
    (
        SELECT COUNT(*)
        FROM public.hoof_zone_findings hzf
        WHERE hzf.inspection_id = hi.id AND hzf.severity > 0
    ) as active_lesion_count
FROM public.hoof_inspections hi
ORDER BY hi.animal_id, hi.inspection_date DESC;

-- Latest udder status per animal (average SCC across quarters)
CREATE OR REPLACE VIEW public.v_animal_udder_status AS
SELECT
    animal_id,
    MAX(test_date) as last_test_date,
    AVG(CASE WHEN test_type = 'scc' THEN result_value END) as avg_scc,
    COUNT(DISTINCT quarter) FILTER (WHERE test_type = 'culture' AND pathogen IS NOT NULL) as infected_quarters
FROM public.udder_quarter_tests
WHERE test_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY animal_id;

-- ============================================================================
-- SAMPLE DATA REFERENCE (for development)
-- ============================================================================

COMMENT ON TABLE public.service_providers IS 'External service companies (hoof trimmers, mastitis services, labs)';
COMMENT ON TABLE public.service_visits IS 'Records of when service providers visited the farm';
COMMENT ON TABLE public.hoof_inspections IS 'Individual animal hoof inspections';
COMMENT ON TABLE public.hoof_zone_findings IS 'Detailed findings per zone (11 zones × 2 claws × 4 legs)';
COMMENT ON TABLE public.udder_quarter_tests IS 'SCC, CMT, culture tests per udder quarter';
COMMENT ON TABLE public.chemical_treatments IS 'Chemical treatments (footbaths, sprays, etc.)';
