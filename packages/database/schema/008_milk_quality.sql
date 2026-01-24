-- HerdMaster Pro - Milk Quality Monitoring Schema
-- DHIA tests, bulk tank readings, and quality metrics

-- ============================================================================
-- MILK TESTS TABLE - Individual cow test results (DHIA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.milk_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    animal_id UUID NOT NULL,

    -- Test metadata
    test_date DATE NOT NULL,
    test_number INTEGER, -- Sequential test number for the lactation
    dim INTEGER, -- Days in milk at test
    lactation_number INTEGER,

    -- Milk yield
    milk_kg DECIMAL(6,2) NOT NULL,
    milk_am DECIMAL(6,2), -- Morning milking
    milk_pm DECIMAL(6,2), -- Evening milking

    -- Milk components
    fat_percent DECIMAL(5,2),
    fat_kg DECIMAL(6,2),
    protein_percent DECIMAL(5,2),
    protein_kg DECIMAL(6,2),
    lactose_percent DECIMAL(5,2),
    solids_percent DECIMAL(5,2), -- Total solids

    -- Quality indicators
    scc INTEGER, -- Somatic cell count (cells/ml)
    mun DECIMAL(5,1), -- Milk Urea Nitrogen (mg/dL)
    bhn INTEGER, -- Beta-hydroxybutyrate (ketosis indicator, µmol/L)

    -- Calculated values
    fat_protein_ratio DECIMAL(5,2),
    energy_corrected_milk DECIMAL(7,2), -- ECM (kg)

    -- Lab info
    lab_name VARCHAR(100),
    sample_id VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT milk_tests_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT milk_tests_animal_fk FOREIGN KEY (animal_id) REFERENCES public.animals(id) ON DELETE CASCADE,
    CONSTRAINT milk_tests_scc_check CHECK (scc >= 0),
    CONSTRAINT milk_tests_milk_positive CHECK (milk_kg >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milk_tests_tenant ON public.milk_tests(tenant_id, test_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_milk_tests_animal ON public.milk_tests(animal_id, test_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_milk_tests_date ON public.milk_tests(test_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_milk_tests_scc ON public.milk_tests(tenant_id, scc) WHERE deleted_at IS NULL AND scc > 200000;

-- RLS Policies
ALTER TABLE public.milk_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's milk tests"
    ON public.milk_tests FOR SELECT
    USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can insert milk tests for their tenant"
    ON public.milk_tests FOR INSERT
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can update their tenant's milk tests"
    ON public.milk_tests FOR UPDATE
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can delete their tenant's milk tests"
    ON public.milk_tests FOR DELETE
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- BULK TANK READINGS TABLE - Tank-level quality metrics (TimescaleDB)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bulk_tank_readings (
    time TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL,

    -- Volume
    volume_liters DECIMAL(10,2) NOT NULL,
    temperature DECIMAL(4,1), -- Celsius

    -- Components
    fat_percent DECIMAL(5,2),
    protein_percent DECIMAL(5,2),
    lactose_percent DECIMAL(5,2),
    solids_percent DECIMAL(5,2),

    -- Quality
    scc_avg INTEGER, -- Average SCC for the tank
    bacteria_count INTEGER, -- Standard Plate Count (SPC)
    coliform_count INTEGER,

    -- Antibiotic residue tests
    beta_lactam_test VARCHAR(20), -- 'negative', 'positive', 'not_tested'
    tetracycline_test VARCHAR(20),

    -- Pickup info
    truck_number VARCHAR(50),
    driver_name VARCHAR(100),
    destination VARCHAR(100), -- Processor/plant

    -- Payment info
    price_per_liter DECIMAL(6,3),
    total_value DECIMAL(10,2),

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT bulk_tank_readings_tenant_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT bulk_tank_readings_volume_positive CHECK (volume_liters > 0),
    CONSTRAINT bulk_tank_readings_temp_range CHECK (temperature >= 0 AND temperature <= 10)
);

-- Create hypertable for time-series data
SELECT create_hypertable('bulk_tank_readings', 'time', if_not_exists => TRUE);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bulk_tank_tenant_time ON public.bulk_tank_readings(tenant_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_tank_time ON public.bulk_tank_readings(time DESC);

-- RLS Policies
ALTER TABLE public.bulk_tank_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's bulk tank readings"
    ON public.bulk_tank_readings FOR SELECT
    USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can insert bulk tank readings for their tenant"
    ON public.bulk_tank_readings FOR INSERT
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can update their tenant's bulk tank readings"
    ON public.bulk_tank_readings FOR UPDATE
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Users can delete their tenant's bulk tank readings"
    ON public.bulk_tank_readings FOR DELETE
    USING (tenant_id = auth.tenant_id());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate Energy Corrected Milk (ECM)
-- Formula: ECM = milk_kg × (0.327 + 0.116 × fat_% + 0.06 × protein_%)
CREATE OR REPLACE FUNCTION public.calculate_ecm(
    p_milk_kg DECIMAL,
    p_fat_percent DECIMAL,
    p_protein_percent DECIMAL
)
RETURNS DECIMAL AS $$
    SELECT ROUND(
        p_milk_kg * (0.327 + 0.116 * p_fat_percent + 0.06 * p_protein_percent),
        2
    );
$$ LANGUAGE SQL IMMUTABLE;

-- Function to get latest milk test for an animal
CREATE OR REPLACE FUNCTION public.get_latest_milk_test(p_animal_id UUID)
RETURNS TABLE (
    test_date DATE,
    milk_kg DECIMAL,
    fat_percent DECIMAL,
    protein_percent DECIMAL,
    scc INTEGER,
    dim INTEGER
) AS $$
    SELECT
        mt.test_date,
        mt.milk_kg,
        mt.fat_percent,
        mt.protein_percent,
        mt.scc,
        mt.dim
    FROM public.milk_tests mt
    WHERE mt.animal_id = p_animal_id
      AND mt.deleted_at IS NULL
    ORDER BY mt.test_date DESC
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to get animals with high SCC (>200k)
CREATE OR REPLACE FUNCTION public.get_animals_with_high_scc(
    p_tenant_id UUID,
    p_threshold INTEGER DEFAULT 200000
)
RETURNS TABLE (
    animal_id UUID,
    ear_tag VARCHAR,
    latest_scc INTEGER,
    test_date DATE,
    consecutive_high_tests INTEGER
) AS $$
    WITH latest_tests AS (
        SELECT DISTINCT ON (mt.animal_id)
            mt.animal_id,
            mt.scc,
            mt.test_date
        FROM public.milk_tests mt
        WHERE mt.tenant_id = p_tenant_id
          AND mt.deleted_at IS NULL
          AND mt.scc > p_threshold
        ORDER BY mt.animal_id, mt.test_date DESC
    ),
    consecutive_counts AS (
        SELECT
            mt.animal_id,
            COUNT(*) FILTER (WHERE mt.scc > p_threshold) as high_count
        FROM public.milk_tests mt
        WHERE mt.tenant_id = p_tenant_id
          AND mt.deleted_at IS NULL
          AND mt.test_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY mt.animal_id
    )
    SELECT
        lt.animal_id,
        a.ear_tag,
        lt.scc as latest_scc,
        lt.test_date,
        COALESCE(cc.high_count, 0) as consecutive_high_tests
    FROM latest_tests lt
    JOIN public.animals a ON a.id = lt.animal_id
    LEFT JOIN consecutive_counts cc ON cc.animal_id = lt.animal_id
    WHERE a.deleted_at IS NULL
    ORDER BY lt.scc DESC;
$$ LANGUAGE SQL STABLE;

-- Function to get herd average metrics for a date range
CREATE OR REPLACE FUNCTION public.get_herd_quality_metrics(
    p_tenant_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    avg_milk DECIMAL,
    avg_fat_percent DECIMAL,
    avg_protein_percent DECIMAL,
    avg_scc INTEGER,
    pct_high_scc DECIMAL,
    test_count INTEGER,
    cow_count INTEGER
) AS $$
    SELECT
        ROUND(AVG(mt.milk_kg), 2) as avg_milk,
        ROUND(AVG(mt.fat_percent), 2) as avg_fat_percent,
        ROUND(AVG(mt.protein_percent), 2) as avg_protein_percent,
        ROUND(AVG(mt.scc))::INTEGER as avg_scc,
        ROUND(
            100.0 * COUNT(*) FILTER (WHERE mt.scc > 200000) / NULLIF(COUNT(*), 0),
            1
        ) as pct_high_scc,
        COUNT(*)::INTEGER as test_count,
        COUNT(DISTINCT mt.animal_id)::INTEGER as cow_count
    FROM public.milk_tests mt
    WHERE mt.tenant_id = p_tenant_id
      AND mt.test_date BETWEEN p_start_date AND p_end_date
      AND mt.deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;

-- Function to get bulk tank statistics for a date range
CREATE OR REPLACE FUNCTION public.get_bulk_tank_stats(
    p_tenant_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    total_volume DECIMAL,
    avg_fat_percent DECIMAL,
    avg_protein_percent DECIMAL,
    avg_scc INTEGER,
    avg_price DECIMAL,
    total_revenue DECIMAL,
    pickup_count INTEGER
) AS $$
    SELECT
        ROUND(SUM(btr.volume_liters), 2) as total_volume,
        ROUND(AVG(btr.fat_percent), 2) as avg_fat_percent,
        ROUND(AVG(btr.protein_percent), 2) as avg_protein_percent,
        ROUND(AVG(btr.scc_avg))::INTEGER as avg_scc,
        ROUND(AVG(btr.price_per_liter), 3) as avg_price,
        ROUND(SUM(btr.total_value), 2) as total_revenue,
        COUNT(*)::INTEGER as pickup_count
    FROM public.bulk_tank_readings btr
    WHERE btr.tenant_id = p_tenant_id
      AND btr.time BETWEEN p_start_date AND p_end_date;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Latest milk test per animal
CREATE OR REPLACE VIEW public.animals_latest_milk_test AS
SELECT DISTINCT ON (mt.animal_id)
    mt.animal_id,
    mt.test_date,
    mt.milk_kg,
    mt.fat_percent,
    mt.protein_percent,
    mt.scc,
    mt.dim,
    a.ear_tag,
    a.name,
    a.current_lactation
FROM public.milk_tests mt
JOIN public.animals a ON a.id = mt.animal_id
WHERE mt.deleted_at IS NULL
  AND a.deleted_at IS NULL
ORDER BY mt.animal_id, mt.test_date DESC;

-- ============================================================================
-- TRIGGER - Update timestamp
-- ============================================================================

CREATE TRIGGER update_milk_tests_updated_at
    BEFORE UPDATE ON public.milk_tests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Milk quality schema created successfully!' AS status;
