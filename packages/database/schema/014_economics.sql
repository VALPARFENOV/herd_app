-- HerdMaster Pro - Economics Module
-- Tables for ECON and COWVAL functionality
-- Phase 4: Economics, Valuation, and Custom Reports

-- ============================================================================
-- ECONOMIC SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.economic_settings (
    tenant_id UUID PRIMARY KEY,

    -- Milk pricing
    milk_price_per_kg DECIMAL(10,2) DEFAULT 0.40, -- Base milk price
    fat_bonus_per_percent DECIMAL(10,4) DEFAULT 0.015, -- Extra per 0.1% fat above 3.5%
    protein_bonus_per_percent DECIMAL(10,4) DEFAULT 0.02, -- Extra per 0.1% protein above 3.2%
    scc_penalty_threshold INTEGER DEFAULT 200000, -- SCC threshold for penalty
    scc_penalty_per_unit DECIMAL(10,6) DEFAULT 0.00001, -- Penalty per unit above threshold

    -- Operating costs
    feed_cost_per_day DECIMAL(10,2) DEFAULT 8.50, -- Per cow per day
    bedding_cost_per_day DECIMAL(10,2) DEFAULT 0.50,
    labor_cost_per_cow_per_month DECIMAL(10,2) DEFAULT 25.00,
    vet_cost_per_treatment DECIMAL(10,2) DEFAULT 50.00,
    breeding_cost_per_service DECIMAL(10,2) DEFAULT 30.00,

    -- Capital costs
    heifer_purchase_cost DECIMAL(10,2) DEFAULT 2000.00, -- Cost to replace cow
    cull_cow_value DECIMAL(10,2) DEFAULT 800.00, -- Value when culled
    calf_value_male DECIMAL(10,2) DEFAULT 100.00,
    calf_value_female DECIMAL(10,2) DEFAULT 400.00,

    -- Depreciation
    depreciation_per_cow_per_year DECIMAL(10,2) DEFAULT 200.00,

    -- Metadata
    currency_code VARCHAR(3) DEFAULT 'USD',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,

    CONSTRAINT fk_economic_settings_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- COST ENTRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cost_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Cost details
    entry_date DATE NOT NULL,
    cost_type VARCHAR(50) NOT NULL, -- 'feed', 'vet', 'breeding', 'labor', 'maintenance', 'other'
    category VARCHAR(50), -- Subcategory (e.g., 'vaccines', 'antibiotics' for vet)
    amount DECIMAL(10,2) NOT NULL,

    -- Association
    animal_id UUID, -- Optional - specific animal
    pen_id UUID, -- Optional - pen-level cost

    -- Description
    description TEXT,
    reference_number VARCHAR(100), -- Invoice/receipt number

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_cost_entries_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_cost_entries_animal
        FOREIGN KEY (animal_id) REFERENCES public.animals(id) ON DELETE SET NULL,
    CONSTRAINT fk_cost_entries_pen
        FOREIGN KEY (pen_id) REFERENCES public.pens(id) ON DELETE SET NULL,
    CONSTRAINT chk_cost_amount_positive
        CHECK (amount >= 0)
);

-- ============================================================================
-- MILK SALES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.milk_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Sale details
    sale_date DATE NOT NULL,
    volume_kg DECIMAL(10,2) NOT NULL,

    -- Quality metrics
    avg_fat_percent DECIMAL(5,2),
    avg_protein_percent DECIMAL(5,2),
    avg_scc INTEGER,
    avg_lactose_percent DECIMAL(5,2),

    -- Pricing
    base_price_per_kg DECIMAL(10,4),
    quality_adjustment DECIMAL(10,4) DEFAULT 0, -- Bonus/penalty
    total_price_per_kg DECIMAL(10,4),
    total_revenue DECIMAL(12,2),

    -- Delivery info
    buyer_name VARCHAR(200),
    delivery_number VARCHAR(100),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_milk_sales_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_volume_positive
        CHECK (volume_kg > 0)
);

-- ============================================================================
-- COW VALUATIONS TABLE (for COWVAL cache)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cow_valuations (
    animal_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,

    -- Valuation components
    production_value DECIMAL(10,2), -- Based on 305ME and milk price
    pregnancy_value DECIMAL(10,2), -- Gestation progress value
    genetic_value DECIMAL(10,2), -- Genomic/pedigree value (placeholder)
    age_adjustment DECIMAL(5,3), -- Multiplier based on age/lactation

    -- Total valuation
    total_value DECIMAL(10,2),
    relative_value DECIMAL(5,2), -- Percentage vs baseline heifer cost

    -- Valuation date
    valuation_date DATE DEFAULT CURRENT_DATE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_cow_valuations_animal
        FOREIGN KEY (animal_id) REFERENCES public.animals(id) ON DELETE CASCADE,
    CONSTRAINT fk_cow_valuations_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Cost entries indexes
CREATE INDEX idx_cost_entries_tenant_date
    ON public.cost_entries(tenant_id, entry_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_cost_entries_type
    ON public.cost_entries(tenant_id, cost_type, entry_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_cost_entries_animal
    ON public.cost_entries(animal_id, entry_date)
    WHERE animal_id IS NOT NULL AND deleted_at IS NULL;

-- Milk sales indexes
CREATE INDEX idx_milk_sales_tenant_date
    ON public.milk_sales(tenant_id, sale_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_milk_sales_date
    ON public.milk_sales(sale_date)
    WHERE deleted_at IS NULL;

-- Cow valuations indexes
CREATE INDEX idx_cow_valuations_tenant
    ON public.cow_valuations(tenant_id, total_value DESC);

CREATE INDEX idx_cow_valuations_relative
    ON public.cow_valuations(tenant_id, relative_value DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.economic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milk_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cow_valuations ENABLE ROW LEVEL SECURITY;

-- Economic settings policies
CREATE POLICY economic_settings_tenant_isolation ON public.economic_settings
    FOR ALL
    USING (tenant_id = auth.tenant_id());

-- Cost entries policies
CREATE POLICY cost_entries_tenant_isolation ON public.cost_entries
    FOR ALL
    USING (tenant_id = auth.tenant_id());

-- Milk sales policies
CREATE POLICY milk_sales_tenant_isolation ON public.milk_sales
    FOR ALL
    USING (tenant_id = auth.tenant_id());

-- Cow valuations policies
CREATE POLICY cow_valuations_tenant_isolation ON public.cow_valuations
    FOR ALL
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.economic_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milk_sales TO authenticated;
GRANT SELECT ON public.cow_valuations TO authenticated;

GRANT ALL ON public.economic_settings TO service_role;
GRANT ALL ON public.cost_entries TO service_role;
GRANT ALL ON public.milk_sales TO service_role;
GRANT ALL ON public.cow_valuations TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.economic_settings IS
'Per-tenant economic parameters: milk prices, operating costs, capital costs';

COMMENT ON TABLE public.cost_entries IS
'Individual cost entries for economic tracking and IOFC calculation';

COMMENT ON TABLE public.milk_sales IS
'Milk sales records with quality metrics and pricing for revenue tracking';

COMMENT ON TABLE public.cow_valuations IS
'Cached cow valuations for COWVAL command - updated periodically';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to initialize economic settings for new tenant
CREATE OR REPLACE FUNCTION public.initialize_economic_settings(
    p_tenant_id UUID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.economic_settings (tenant_id)
    VALUES (p_tenant_id)
    ON CONFLICT (tenant_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.initialize_economic_settings IS
'Initializes default economic settings for a new tenant';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    'Economics tables created' AS status,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN
        ('economic_settings', 'cost_entries', 'milk_sales', 'cow_valuations')) AS table_count;
