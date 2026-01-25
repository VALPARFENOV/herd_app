-- HerdMaster Pro - Production Analysis Views
-- Views for PLOT and GRAPH commands - lactation curves and production trends
-- Phase 3: Production, Events, and Graphical Reports

-- ============================================================================
-- MILK TEST SERIES VIEW
-- ============================================================================
-- Provides time-series data for lactation curves and production analysis

CREATE OR REPLACE VIEW public.milk_test_series AS
SELECT
    mt.id AS test_id,
    mt.tenant_id,
    mt.animal_id,
    a.ear_tag,
    a.name AS animal_name,

    -- Test metadata
    mt.test_date,
    mt.test_number,
    mt.lactation_number,

    -- DIM calculation (use stored DIM or calculate from calving date)
    COALESCE(
        mt.dim,
        CASE
            WHEN a.last_calving_date IS NOT NULL
            THEN (mt.test_date - a.last_calving_date)::INTEGER
            ELSE NULL
        END
    ) AS dim_at_test,

    -- Milk production
    mt.milk_kg,
    mt.milk_am,
    mt.milk_pm,

    -- Components
    mt.fat_percent,
    mt.fat_kg,
    mt.protein_percent,
    mt.protein_kg,
    mt.lactose_percent,
    mt.solids_percent,

    -- Quality indicators
    mt.scc,
    mt.mun,
    mt.bhn,

    -- Calculated metrics
    mt.fat_protein_ratio,

    -- Fat Corrected Milk (3.5% standardization)
    CASE
        WHEN mt.milk_kg IS NOT NULL AND mt.fat_percent IS NOT NULL
        THEN ROUND((mt.milk_kg * (0.4324 + 0.1625 * mt.fat_percent))::NUMERIC, 2)
        ELSE NULL
    END AS fcm,

    -- Energy Corrected Milk (ECM)
    CASE
        WHEN mt.milk_kg IS NOT NULL
             AND mt.fat_percent IS NOT NULL
             AND mt.protein_percent IS NOT NULL
        THEN ROUND((mt.milk_kg * (0.327 + 0.122 * mt.fat_percent + 0.0801 * mt.protein_percent))::NUMERIC, 2)
        ELSE NULL
    END AS ecm,

    -- Log SCC for quality tracking
    CASE
        WHEN mt.scc > 0
        THEN ROUND(LOG(10, mt.scc::NUMERIC), 2)
        ELSE NULL
    END AS log_scc,

    -- Animal info for grouping
    a.pen_id,
    a.current_status,
    a.reproductive_status,

    -- Lactation info
    a.last_calving_date,
    a.expected_calving_date,

    -- Grouping fields
    EXTRACT(YEAR FROM mt.test_date)::INTEGER AS test_year,
    EXTRACT(MONTH FROM mt.test_date)::INTEGER AS test_month,
    EXTRACT(DOW FROM mt.test_date)::INTEGER AS test_dow,

    -- Timestamps
    mt.created_at,
    mt.updated_at

FROM public.milk_tests mt
JOIN public.animals a ON a.id = mt.animal_id
WHERE a.deleted_at IS NULL
ORDER BY mt.test_date DESC, a.ear_tag;

-- ============================================================================
-- LACTATION SUMMARY VIEW
-- ============================================================================
-- Aggregated lactation performance for comparing lactations

CREATE OR REPLACE VIEW public.lactation_performance AS
SELECT
    a.id AS animal_id,
    a.ear_tag,
    a.lactation_number,
    a.last_calving_date AS calving_date,

    -- Current lactation stats
    CASE
        WHEN a.last_calving_date IS NOT NULL
        THEN (CURRENT_DATE - a.last_calving_date)::INTEGER
        ELSE NULL
    END AS current_dim,

    -- Aggregate from milk tests
    COUNT(mt.id) AS test_count,
    AVG(mt.milk_kg) AS avg_milk_kg,
    MAX(mt.milk_kg) AS peak_milk_kg,
    AVG(mt.fat_percent) AS avg_fat_percent,
    AVG(mt.protein_percent) AS avg_protein_percent,
    AVG(mt.scc) AS avg_scc,

    -- Total production (from stored totals if available)
    l.total_milk_kg,
    l.me_305_milk AS "305me",

    -- Peak info
    (SELECT dim
     FROM public.milk_tests
     WHERE animal_id = a.id
       AND lactation_number = a.lactation_number
     ORDER BY milk_kg DESC
     LIMIT 1
    ) AS dim_at_peak,

    -- Quality metrics
    (SELECT COUNT(*)
     FROM public.milk_tests
     WHERE animal_id = a.id
       AND lactation_number = a.lactation_number
       AND scc > 200000
    ) AS high_scc_tests,

    -- Status
    a.current_status,
    a.reproductive_status,
    a.tenant_id

FROM public.animals a
LEFT JOIN public.milk_tests mt
    ON mt.animal_id = a.id
    AND mt.lactation_number = a.lactation_number
LEFT JOIN public.lactations l
    ON l.animal_id = a.id
    AND l.lactation_number = a.lactation_number

WHERE a.deleted_at IS NULL
  AND a.lactation_number > 0

GROUP BY
    a.id, a.ear_tag, a.lactation_number, a.last_calving_date,
    a.current_status, a.reproductive_status, a.tenant_id,
    l.total_milk_kg, l.me_305_milk

ORDER BY a.ear_tag, a.lactation_number;

-- ============================================================================
-- PRODUCTION TRENDS VIEW
-- ============================================================================
-- Daily/weekly/monthly production aggregates for herd-level trends

CREATE OR REPLACE VIEW public.production_trends AS
SELECT
    mt.tenant_id,
    mt.test_date,

    -- Time groupings
    DATE_TRUNC('week', mt.test_date)::DATE AS week_start,
    DATE_TRUNC('month', mt.test_date)::DATE AS month_start,
    EXTRACT(YEAR FROM mt.test_date)::INTEGER AS year,
    EXTRACT(MONTH FROM mt.test_date)::INTEGER AS month,

    -- Aggregated metrics
    COUNT(DISTINCT mt.animal_id) AS cows_tested,
    COUNT(mt.id) AS total_tests,

    -- Production averages
    AVG(mt.milk_kg) AS avg_milk_kg,
    SUM(mt.milk_kg) AS total_milk_kg,

    -- Component averages
    AVG(mt.fat_percent) AS avg_fat_percent,
    AVG(mt.protein_percent) AS avg_protein_percent,
    AVG(mt.lactose_percent) AS avg_lactose_percent,

    -- Quality metrics
    AVG(mt.scc) AS avg_scc,
    AVG(CASE WHEN mt.scc > 0 THEN LOG(10, mt.scc::NUMERIC) END) AS avg_log_scc,
    COUNT(CASE WHEN mt.scc > 200000 THEN 1 END) AS high_scc_count,
    ROUND((COUNT(CASE WHEN mt.scc > 200000 THEN 1 END)::DECIMAL /
           NULLIF(COUNT(mt.id), 0) * 100), 2) AS high_scc_percent,

    -- Health indicators
    AVG(mt.mun) AS avg_mun,
    AVG(mt.bhn) AS avg_bhn,
    COUNT(CASE WHEN mt.bhn > 100 THEN 1 END) AS ketosis_risk_count,

    -- DIM distribution
    AVG(mt.dim) AS avg_dim,
    MIN(mt.dim) AS min_dim,
    MAX(mt.dim) AS max_dim,

    -- Lactation distribution
    COUNT(CASE WHEN a.lactation_number = 1 THEN 1 END) AS lact1_count,
    COUNT(CASE WHEN a.lactation_number = 2 THEN 1 END) AS lact2_count,
    COUNT(CASE WHEN a.lactation_number >= 3 THEN 1 END) AS lact3plus_count

FROM public.milk_tests mt
JOIN public.animals a ON a.id = mt.animal_id

WHERE a.deleted_at IS NULL

GROUP BY
    mt.tenant_id,
    mt.test_date,
    DATE_TRUNC('week', mt.test_date),
    DATE_TRUNC('month', mt.test_date),
    EXTRACT(YEAR FROM mt.test_date),
    EXTRACT(MONTH FROM mt.test_date)

ORDER BY mt.test_date DESC;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Milk tests indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_milk_tests_animal_date
    ON public.milk_tests(animal_id, test_date);

CREATE INDEX IF NOT EXISTS idx_milk_tests_tenant_date
    ON public.milk_tests(tenant_id, test_date);

CREATE INDEX IF NOT EXISTS idx_milk_tests_lactation
    ON public.milk_tests(animal_id, lactation_number);

CREATE INDEX IF NOT EXISTS idx_milk_tests_dim
    ON public.milk_tests(dim)
    WHERE dim IS NOT NULL;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.milk_test_series TO anon, authenticated, service_role;
GRANT SELECT ON public.lactation_performance TO anon, authenticated, service_role;
GRANT SELECT ON public.production_trends TO anon, authenticated, service_role;

-- Security invoker mode (RLS inherited from base tables)
ALTER VIEW public.milk_test_series SET (security_invoker = true);
ALTER VIEW public.lactation_performance SET (security_invoker = true);
ALTER VIEW public.production_trends SET (security_invoker = true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW public.milk_test_series IS
'Time-series milk test data with calculated DIM, FCM, ECM, and log SCC for lactation curves and PLOT commands';

COMMENT ON VIEW public.lactation_performance IS
'Aggregated lactation statistics for comparing performance across lactations and groups';

COMMENT ON VIEW public.production_trends IS
'Herd-level production trends aggregated by day/week/month for dashboard analytics';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    'Production analysis views created' AS status,
    (SELECT COUNT(*) FROM public.milk_test_series) AS test_series_count,
    (SELECT COUNT(*) FROM public.lactation_performance) AS lactations_count,
    (SELECT COUNT(DISTINCT test_date) FROM public.production_trends) AS trend_days;
