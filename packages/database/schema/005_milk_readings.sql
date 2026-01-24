-- HerdMaster Pro - Milk Production Module
-- TimescaleDB hypertable for time-series milk readings

-- ============================================================================
-- ENABLE TIMESCALEDB EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================================
-- MILK READINGS (individual cow milking sessions)
-- ============================================================================

CREATE TABLE public.milk_readings (
    time TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,

    -- Session identification
    session_id VARCHAR(20) NOT NULL, -- 'morning', 'afternoon', 'evening'

    -- Production data
    milk_kg DECIMAL(6,2) NOT NULL CHECK (milk_kg >= 0),
    duration_seconds INTEGER CHECK (duration_seconds > 0),
    avg_flow_rate DECIMAL(5,2) CHECK (avg_flow_rate >= 0), -- kg/min
    peak_flow_rate DECIMAL(5,2) CHECK (peak_flow_rate >= 0), -- kg/min

    -- Quarter-level data (optional, from advanced equipment)
    -- Conductivity by quarter: LF, LR, RF, RR (mS/cm)
    conductivity JSONB DEFAULT '{}',
    -- Example: {"LF": 5.2, "LR": 5.1, "RF": 5.3, "RR": 5.0}

    -- Milk quality indicators (from inline sensors)
    temperature DECIMAL(4,1), -- °C
    blood_detected BOOLEAN DEFAULT false,
    color_abnormal BOOLEAN DEFAULT false,

    -- Equipment data
    source VARCHAR(50) NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'delaval', 'lely', 'gea', 'sac', 'boumatic', 'other')),
    equipment_id VARCHAR(100), -- identifier of specific milking stall/robot

    -- Import tracking
    import_batch_id UUID, -- for grouping imported records
    imported_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Composite primary key
    CONSTRAINT milk_readings_pkey PRIMARY KEY (time, tenant_id, animal_id, session_id)
);

-- Convert to TimescaleDB hypertable
-- Partition by time (1 day chunks) for optimal performance
SELECT create_hypertable(
    'milk_readings',
    'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- ============================================================================
-- INDEXES for query performance
-- ============================================================================

-- Tenant + time range queries (most common)
CREATE INDEX idx_milk_readings_tenant_time
    ON public.milk_readings(tenant_id, time DESC);

-- Animal + time range queries (individual cow charts)
CREATE INDEX idx_milk_readings_animal_time
    ON public.milk_readings(animal_id, time DESC);

-- Session queries (compare morning vs evening yields)
CREATE INDEX idx_milk_readings_session
    ON public.milk_readings(tenant_id, session_id, time DESC);

-- Source queries (equipment-specific analysis)
CREATE INDEX idx_milk_readings_source
    ON public.milk_readings(source, time DESC) WHERE source != 'manual';

-- Abnormal readings for quality alerts
CREATE INDEX idx_milk_readings_abnormal
    ON public.milk_readings(tenant_id, time DESC)
    WHERE blood_detected = true OR color_abnormal = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.milk_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY milk_readings_tenant_isolation ON public.milk_readings
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- ============================================================================
-- COMPRESSION (TimescaleDB feature for historical data)
-- ============================================================================

-- Compress data older than 7 days to save storage
-- Compressed data is still queryable, just read-only
ALTER TABLE milk_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tenant_id, animal_id, session_id',
    timescaledb.compress_orderby = 'time DESC'
);

-- Add compression policy (compress chunks older than 7 days)
SELECT add_compression_policy('milk_readings', INTERVAL '7 days', if_not_exists => TRUE);

-- ============================================================================
-- RETENTION POLICY (optional: delete data older than 2 years)
-- ============================================================================

-- Uncomment to enable automatic deletion of old data
-- SELECT add_retention_policy('milk_readings', INTERVAL '2 years', if_not_exists => TRUE);

-- ============================================================================
-- CONTINUOUS AGGREGATES for fast analytics
-- ============================================================================

-- Daily production per animal (pre-calculated)
CREATE MATERIALIZED VIEW milk_daily_per_animal
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS day,
    tenant_id,
    animal_id,
    COUNT(*) as milkings_count,
    SUM(milk_kg) as total_milk_kg,
    AVG(milk_kg) as avg_milk_kg,
    MAX(milk_kg) as max_milk_kg,
    MIN(milk_kg) as min_milk_kg,
    AVG(duration_seconds) as avg_duration_seconds,
    AVG(avg_flow_rate) as avg_flow_rate
FROM milk_readings
GROUP BY day, tenant_id, animal_id
WITH NO DATA;

-- Daily production per tenant (herd totals)
CREATE MATERIALIZED VIEW milk_daily_per_tenant
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS day,
    tenant_id,
    COUNT(DISTINCT animal_id) as cows_milked,
    COUNT(*) as total_milkings,
    SUM(milk_kg) as total_milk_kg,
    AVG(milk_kg) as avg_per_milking,
    AVG(duration_seconds) as avg_duration
FROM milk_readings
GROUP BY day, tenant_id
WITH NO DATA;

-- Refresh policies (update aggregates every hour)
SELECT add_continuous_aggregate_policy('milk_daily_per_animal',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('milk_daily_per_tenant',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get daily milk production for the herd (used by Dashboard)
CREATE OR REPLACE FUNCTION public.get_daily_milk_production(
    p_tenant_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    total_kg DECIMAL(10,2),
    avg_per_cow DECIMAL(6,2),
    cows_milked INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        day::DATE as date,
        COALESCE(total_milk_kg, 0) as total_kg,
        COALESCE(total_milk_kg / NULLIF(cows_milked, 0), 0) as avg_per_cow,
        COALESCE(cows_milked, 0) as cows_milked
    FROM milk_daily_per_tenant
    WHERE tenant_id = p_tenant_id
        AND day >= CURRENT_DATE - p_days
    ORDER BY day ASC;
END;
$$;

-- Get milk production for specific animal
CREATE OR REPLACE FUNCTION public.get_animal_milk_production(
    p_animal_id UUID,
    p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
    date DATE,
    total_kg DECIMAL(10,2),
    milkings_count INTEGER,
    avg_kg DECIMAL(6,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        day::DATE as date,
        COALESCE(total_milk_kg, 0) as total_kg,
        COALESCE(milkings_count::INTEGER, 0) as milkings_count,
        COALESCE(avg_milk_kg, 0) as avg_kg
    FROM milk_daily_per_animal
    WHERE animal_id = p_animal_id
        AND day >= CURRENT_DATE - p_days
    ORDER BY day ASC;
END;
$$;

-- Get latest milking session for animal (for cards/alerts)
CREATE OR REPLACE FUNCTION public.get_latest_milking(
    p_animal_id UUID
)
RETURNS TABLE (
    time TIMESTAMPTZ,
    session_id VARCHAR(20),
    milk_kg DECIMAL(6,2),
    duration_seconds INTEGER,
    avg_flow_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mr.time,
        mr.session_id,
        mr.milk_kg,
        mr.duration_seconds,
        mr.avg_flow_rate
    FROM milk_readings mr
    WHERE mr.animal_id = p_animal_id
    ORDER BY mr.time DESC
    LIMIT 1;
END;
$$;

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================

COMMENT ON TABLE public.milk_readings IS
'Time-series data for individual milking sessions. Uses TimescaleDB for efficient storage and queries.';

COMMENT ON COLUMN public.milk_readings.session_id IS
'Milking session: morning (4-10am), afternoon (10am-4pm), evening (4-10pm)';

COMMENT ON COLUMN public.milk_readings.conductivity IS
'Quarter-level conductivity readings in mS/cm. Format: {"LF": 5.2, "LR": 5.1, "RF": 5.3, "RR": 5.0}';

COMMENT ON MATERIALIZED VIEW milk_daily_per_animal IS
'Continuous aggregate: daily milk production per animal. Auto-refreshed every hour.';

COMMENT ON MATERIALIZED VIEW milk_daily_per_tenant IS
'Continuous aggregate: daily milk production per tenant (herd totals). Auto-refreshed every hour.';
