-- HerdMaster Pro - Veterinary Module Schema
-- Treatment protocols, drugs, and withdrawal tracking

-- ============================================================================
-- DRUGS TABLE - Drug/medication catalog
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Drug information
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    active_ingredient VARCHAR(200),
    manufacturer VARCHAR(100),

    -- Withdrawal periods (in days)
    withdrawal_milk_days INTEGER, -- Days before milk can be shipped
    withdrawal_meat_days INTEGER, -- Days before meat can be sold

    -- Dosage
    dosage_per_kg DECIMAL(8,3), -- Standard dose per kg body weight
    dosage_unit VARCHAR(20), -- mg, ml, IU, etc.
    route VARCHAR(50), -- IM, IV, SC, oral, intramammary, topical

    -- Packaging
    package_size DECIMAL(10,2),
    package_unit VARCHAR(20), -- ml, tablets, doses

    -- Cost
    cost_per_package DECIMAL(10,2),
    cost_per_dose DECIMAL(10,2),

    -- Prescription
    requires_prescription BOOLEAN DEFAULT true,
    controlled_substance BOOLEAN DEFAULT false,

    -- Storage
    storage_requirements TEXT, -- Refrigerate, room temp, etc.
    shelf_life_months INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT drugs_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_drugs_tenant ON public.drugs(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drugs_active ON public.drugs(tenant_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drugs_name ON public.drugs(name) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's drugs"
    ON public.drugs FOR SELECT
    USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can insert drugs for their tenant"
    ON public.drugs FOR INSERT
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can update their tenant's drugs"
    ON public.drugs FOR UPDATE
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can delete their tenant's drugs"
    ON public.drugs FOR DELETE
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- TREATMENT PROTOCOLS TABLE - Standard treatment protocols
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.treatment_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Protocol information
    name VARCHAR(200) NOT NULL,
    disease_code VARCHAR(50), -- 'MAST_CLINICAL', 'METR', 'LAME', 'RESP', etc.
    description TEXT,

    -- Protocol steps (array of treatment steps)
    protocol_steps JSONB, -- [{"day": 1, "drug_id": "uuid", "dose": 10, "route": "IM"}, ...]

    -- Withdrawal periods (calculated from drugs in protocol)
    withdrawal_milk_days INTEGER,
    withdrawal_meat_days INTEGER,

    -- Cost estimate
    estimated_cost DECIMAL(10,2),

    -- Efficacy tracking
    success_rate DECIMAL(5,2), -- % of cases that resolved
    avg_recovery_days INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Default protocol for disease

    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT treatment_protocols_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treatment_protocols_tenant ON public.treatment_protocols(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_protocols_disease ON public.treatment_protocols(disease_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_protocols_default ON public.treatment_protocols(tenant_id, disease_code, is_default) WHERE deleted_at IS NULL AND is_default = true;

-- RLS Policies
ALTER TABLE public.treatment_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's treatment protocols"
    ON public.treatment_protocols FOR SELECT
    USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can insert treatment protocols for their tenant"
    ON public.treatment_protocols FOR INSERT
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can update their tenant's treatment protocols"
    ON public.treatment_protocols FOR UPDATE
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can delete their tenant's treatment protocols"
    ON public.treatment_protocols FOR DELETE
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate withdrawal end date for an animal
CREATE OR REPLACE FUNCTION public.get_withdrawal_end_date(p_animal_id UUID)
RETURNS DATE AS $$
    SELECT MAX(
        (e.details->>'withdrawal_date')::DATE
    )
    FROM public.events e
    WHERE e.animal_id = p_animal_id
      AND e.event_type = 'treatment'
      AND e.details->>'withdrawal_date' IS NOT NULL
      AND (e.details->>'withdrawal_date')::DATE >= CURRENT_DATE
      AND e.deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;

-- Function to get animals with active withdrawal
CREATE OR REPLACE FUNCTION public.get_animals_with_active_withdrawal(p_tenant_id UUID)
RETURNS TABLE (
    animal_id UUID,
    withdrawal_end_date DATE,
    days_remaining INTEGER
) AS $$
    SELECT DISTINCT
        e.animal_id,
        MAX((e.details->>'withdrawal_date')::DATE) as withdrawal_end_date,
        MAX((e.details->>'withdrawal_date')::DATE) - CURRENT_DATE as days_remaining
    FROM public.events e
    WHERE e.tenant_id = p_tenant_id
      AND e.event_type = 'treatment'
      AND e.details->>'withdrawal_date' IS NOT NULL
      AND (e.details->>'withdrawal_date')::DATE >= CURRENT_DATE
      AND e.deleted_at IS NULL
    GROUP BY e.animal_id;
$$ LANGUAGE SQL STABLE;

-- Function to get default protocol for a disease
CREATE OR REPLACE FUNCTION public.get_default_protocol(
    p_tenant_id UUID,
    p_disease_code VARCHAR(50)
)
RETURNS UUID AS $$
    SELECT id
    FROM public.treatment_protocols
    WHERE tenant_id = p_tenant_id
      AND disease_code = p_disease_code
      AND is_default = true
      AND is_active = true
      AND deleted_at IS NULL
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TRIGGER - Update timestamp
-- ============================================================================

CREATE TRIGGER update_drugs_updated_at
    BEFORE UPDATE ON public.drugs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_protocols_updated_at
    BEFORE UPDATE ON public.treatment_protocols
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Veterinary module schema created successfully!' AS status;
