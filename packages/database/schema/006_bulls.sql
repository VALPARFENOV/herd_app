-- HerdMaster Pro - Bulls & Semen Inventory Schema
-- Manages bull catalog and semen inventory tracking

-- ============================================================================
-- BULLS TABLE - Bull catalog with genomic data
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bulls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Identification
    registration_number VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(50), -- Common name for quick reference
    breed VARCHAR(50) NOT NULL,
    naab_code VARCHAR(20), -- NAAB (National Association of Animal Breeders) code
    stud_code VARCHAR(50), -- Stud/AI company code

    -- Genomic Data (PTAs - Predicted Transmitting Abilities)
    genomic_data JSONB, -- {"milk": 1200, "fat": 45, "protein": 38, "pl": 5.2, "scs": 2.85, "dpr": 1.5}
    net_merit_dollars DECIMAL(8,2), -- NM$ - Overall genetic index

    -- Physical traits
    sire_calving_ease DECIMAL(4,1), -- % difficult calvings as sire
    daughter_calving_ease DECIMAL(4,1), -- % difficult calvings in daughters

    -- Economic
    semen_cost_per_straw DECIMAL(10,2),

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_sexed BOOLEAN DEFAULT false, -- Sexed semen available
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT bulls_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bulls_tenant ON public.bulls(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bulls_active ON public.bulls(tenant_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bulls_naab ON public.bulls(naab_code) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE public.bulls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's bulls"
    ON public.bulls FOR SELECT
    USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can insert bulls for their tenant"
    ON public.bulls FOR INSERT
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can update their tenant's bulls"
    ON public.bulls FOR UPDATE
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can soft delete their tenant's bulls"
    ON public.bulls FOR DELETE
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- SEMEN INVENTORY TABLE - Track semen straws inventory
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.semen_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    bull_id UUID NOT NULL,

    -- Batch information
    batch_number VARCHAR(50),
    lot_number VARCHAR(50),

    -- Inventory
    straws_received INTEGER NOT NULL DEFAULT 0,
    straws_used INTEGER NOT NULL DEFAULT 0,
    straws_available INTEGER GENERATED ALWAYS AS (straws_received - straws_used) STORED,

    -- Dates
    received_date DATE NOT NULL,
    expiry_date DATE,

    -- Cost tracking
    cost_per_straw DECIMAL(10,2),
    total_cost DECIMAL(10,2),

    -- Storage location
    tank_number VARCHAR(20),
    canister_number VARCHAR(20),

    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT semen_inventory_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT semen_inventory_bull_fk FOREIGN KEY (bull_id) REFERENCES public.bulls(id) ON DELETE CASCADE,
    CONSTRAINT semen_inventory_straws_check CHECK (straws_received >= 0 AND straws_used >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_semen_inventory_tenant ON public.semen_inventory(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_semen_inventory_bull ON public.semen_inventory(bull_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_semen_inventory_expiry ON public.semen_inventory(expiry_date) WHERE deleted_at IS NULL AND expiry_date IS NOT NULL;

-- RLS Policies
ALTER TABLE public.semen_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's semen inventory"
    ON public.semen_inventory FOR SELECT
    USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can insert semen inventory for their tenant"
    ON public.semen_inventory FOR INSERT
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can update their tenant's semen inventory"
    ON public.semen_inventory FOR UPDATE
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can delete their tenant's semen inventory"
    ON public.semen_inventory FOR DELETE
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get total available straws for a bull
CREATE OR REPLACE FUNCTION public.get_bull_available_straws(p_bull_id UUID)
RETURNS INTEGER AS $$
    SELECT COALESCE(SUM(straws_available), 0)::INTEGER
    FROM public.semen_inventory
    WHERE bull_id = p_bull_id
      AND deleted_at IS NULL
      AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE);
$$ LANGUAGE SQL STABLE;

-- Function to deduct straws from inventory (called after breeding event)
CREATE OR REPLACE FUNCTION public.deduct_semen_straw(
    p_bull_id UUID,
    p_tenant_id UUID,
    p_straws INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_batch_id UUID;
    v_available INTEGER;
BEGIN
    -- Find oldest non-expired batch with available straws (FIFO)
    SELECT id, straws_available INTO v_batch_id, v_available
    FROM public.semen_inventory
    WHERE bull_id = p_bull_id
      AND tenant_id = p_tenant_id
      AND straws_available >= p_straws
      AND deleted_at IS NULL
      AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
    ORDER BY received_date ASC
    LIMIT 1;

    IF v_batch_id IS NULL THEN
        RETURN FALSE; -- No available straws
    END IF;

    -- Deduct straws
    UPDATE public.semen_inventory
    SET straws_used = straws_used + p_straws,
        updated_at = NOW()
    WHERE id = v_batch_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER - Update timestamp
-- ============================================================================

CREATE TRIGGER update_bulls_updated_at
    BEFORE UPDATE ON public.bulls
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_semen_inventory_updated_at
    BEFORE UPDATE ON public.semen_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Bulls and semen inventory schema created successfully!' AS status;
