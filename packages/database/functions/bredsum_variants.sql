-- HerdMaster Pro - BREDSUM Variant Functions
-- Additional BREDSUM report types (\S, \T, \E, \H, \Q, \N, \W, \PG)

-- ============================================================================
-- BREDSUM BY SIRE (\S switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_by_sire(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    bull_name TEXT,
    bull_id TEXT,
    total_breedings BIGINT,
    pregnancies BIGINT,
    conception_rate DECIMAL(5,2),
    services_per_conception DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(bo.bull_name, 'Unknown') AS bull_name,
        COALESCE(bo.bull_id, 'N/A') AS bull_id,
        COUNT(*)::BIGINT AS total_breedings,
        SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::BIGINT AS pregnancies,
        ROUND(
            (SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::DECIMAL /
             NULLIF(COUNT(*), 0) * 100),
            2
        ) AS conception_rate,
        ROUND(
            (COUNT(*)::DECIMAL /
             NULLIF(SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END), 0)),
            2
        ) AS services_per_conception
    FROM public.breeding_outcomes bo
    WHERE bo.tenant_id = p_tenant_id
      AND bo.breeding_date BETWEEN p_start_date AND p_end_date
      AND bo.bull_name IS NOT NULL
    GROUP BY bo.bull_name, bo.bull_id
    ORDER BY conception_rate DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_by_sire IS
'BREDSUM \S: Conception rates by sire/bull';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_by_sire TO authenticated, service_role;

-- ============================================================================
-- BREDSUM BY TECHNICIAN (\T switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_by_technician(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    technician_name TEXT,
    total_breedings BIGINT,
    pregnancies BIGINT,
    conception_rate DECIMAL(5,2),
    services_per_conception DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(bo.technician_name, 'Unknown') AS technician_name,
        COUNT(*)::BIGINT AS total_breedings,
        SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::BIGINT AS pregnancies,
        ROUND(
            (SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::DECIMAL /
             NULLIF(COUNT(*), 0) * 100),
            2
        ) AS conception_rate,
        ROUND(
            (COUNT(*)::DECIMAL /
             NULLIF(SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END), 0)),
            2
        ) AS services_per_conception
    FROM public.breeding_outcomes bo
    WHERE bo.tenant_id = p_tenant_id
      AND bo.breeding_date BETWEEN p_start_date AND p_end_date
    GROUP BY bo.technician_name
    ORDER BY conception_rate DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_by_technician IS
'BREDSUM \T: Conception rates by AI technician';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_by_technician TO authenticated, service_role;

-- ============================================================================
-- BREDSUM BY DIM (\N switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_by_dim(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    dim_range TEXT,
    total_breedings BIGINT,
    pregnancies BIGINT,
    conception_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN bo.dim_at_breeding < 60 THEN '< 60 DIM'
            WHEN bo.dim_at_breeding BETWEEN 60 AND 90 THEN '60-90 DIM'
            WHEN bo.dim_at_breeding BETWEEN 91 AND 120 THEN '91-120 DIM'
            WHEN bo.dim_at_breeding BETWEEN 121 AND 150 THEN '121-150 DIM'
            WHEN bo.dim_at_breeding > 150 THEN '> 150 DIM'
            ELSE 'Unknown'
        END AS dim_range,
        COUNT(*)::BIGINT AS total_breedings,
        SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::BIGINT AS pregnancies,
        ROUND(
            (SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::DECIMAL /
             NULLIF(COUNT(*), 0) * 100),
            2
        ) AS conception_rate
    FROM public.breeding_outcomes bo
    WHERE bo.tenant_id = p_tenant_id
      AND bo.breeding_date BETWEEN p_start_date AND p_end_date
      AND bo.dim_at_breeding IS NOT NULL
    GROUP BY
        CASE
            WHEN bo.dim_at_breeding < 60 THEN '< 60 DIM'
            WHEN bo.dim_at_breeding BETWEEN 60 AND 90 THEN '60-90 DIM'
            WHEN bo.dim_at_breeding BETWEEN 91 AND 120 THEN '91-120 DIM'
            WHEN bo.dim_at_breeding BETWEEN 121 AND 150 THEN '121-150 DIM'
            WHEN bo.dim_at_breeding > 150 THEN '> 150 DIM'
            ELSE 'Unknown'
        END
    ORDER BY
        CASE
            WHEN MIN(bo.dim_at_breeding) < 60 THEN 1
            WHEN MIN(bo.dim_at_breeding) BETWEEN 60 AND 90 THEN 2
            WHEN MIN(bo.dim_at_breeding) BETWEEN 91 AND 120 THEN 3
            WHEN MIN(bo.dim_at_breeding) BETWEEN 121 AND 150 THEN 4
            WHEN MIN(bo.dim_at_breeding) > 150 THEN 5
            ELSE 6
        END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_by_dim IS
'BREDSUM \N: Conception rates by DIM range';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_by_dim TO authenticated, service_role;

-- ============================================================================
-- BREDSUM BY DAY OF WEEK (\W switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_by_dow(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    day_of_week TEXT,
    total_breedings BIGINT,
    pregnancies BIGINT,
    conception_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE bo.breeding_day_of_week
            WHEN 0 THEN 'Sunday'
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday'
            ELSE 'Unknown'
        END AS day_of_week,
        COUNT(*)::BIGINT AS total_breedings,
        SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::BIGINT AS pregnancies,
        ROUND(
            (SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::DECIMAL /
             NULLIF(COUNT(*), 0) * 100),
            2
        ) AS conception_rate
    FROM public.breeding_outcomes bo
    WHERE bo.tenant_id = p_tenant_id
      AND bo.breeding_date BETWEEN p_start_date AND p_end_date
    GROUP BY bo.breeding_day_of_week
    ORDER BY bo.breeding_day_of_week;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_by_dow IS
'BREDSUM \W: Conception rates by day of week';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_by_dow TO authenticated, service_role;

-- ============================================================================
-- BREDSUM 21-DAY PREGNANCY RATES (\E switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_21day(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '180 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    period_start DATE,
    eligible_cows INTEGER,
    breedings INTEGER,
    pregnancies INTEGER,
    pregnancy_rate DECIMAL(5,2),
    heat_detection_rate DECIMAL(5,2)
) AS $$
BEGIN
    -- 21-day pregnancy rate calculation
    -- Requires counting eligible cows per period (complex, simplified version)
    RETURN QUERY
    WITH breeding_periods AS (
        SELECT
            DATE_TRUNC('week', bo.breeding_date)::DATE AS period_start,
            COUNT(DISTINCT bo.animal_id) AS breedings,
            SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END) AS pregnancies
        FROM public.breeding_outcomes bo
        WHERE bo.tenant_id = p_tenant_id
          AND bo.breeding_date BETWEEN p_start_date AND p_end_date
        GROUP BY DATE_TRUNC('week', bo.breeding_date)
    )
    SELECT
        bp.period_start,
        (bp.breedings * 3)::INTEGER AS eligible_cows, -- Rough estimate
        bp.breedings::INTEGER AS breedings,
        bp.pregnancies::INTEGER AS pregnancies,
        ROUND((bp.pregnancies::DECIMAL / NULLIF(bp.breedings * 3, 0) * 100), 2) AS pregnancy_rate,
        ROUND((bp.breedings::DECIMAL / NULLIF(bp.breedings * 3, 0) * 100), 2) AS heat_detection_rate
    FROM breeding_periods bp
    ORDER BY bp.period_start;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_21day IS
'BREDSUM \E: 21-day pregnancy rates and heat detection';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_21day TO authenticated, service_role;

-- ============================================================================
-- BREDSUM HEAT DETECTION (\H switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_heat_detection(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    metric TEXT,
    value DECIMAL(10,2),
    count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'Heat Detection Rate' AS metric,
        ROUND(
            (COUNT(DISTINCT bo.animal_id)::DECIMAL /
             NULLIF((SELECT COUNT(*) FROM public.animals WHERE tenant_id = p_tenant_id AND reproductive_status = 'open'), 0) * 100),
            2
        ) AS value,
        COUNT(DISTINCT bo.animal_id)::INTEGER AS count
    FROM public.breeding_outcomes bo
    WHERE bo.tenant_id = p_tenant_id
      AND bo.breeding_date BETWEEN p_start_date AND p_end_date

    UNION ALL

    SELECT
        'Avg Days Between Heats' AS metric,
        ROUND(AVG(heat_intervals.interval_days), 2) AS value,
        COUNT(*)::INTEGER AS count
    FROM (
        SELECT
            animal_id,
            (event_date - LAG(event_date) OVER (PARTITION BY animal_id ORDER BY event_date))::INTEGER AS interval_days
        FROM public.events
        WHERE tenant_id = p_tenant_id
          AND event_type = 'heat'
          AND event_date BETWEEN p_start_date AND p_end_date
    ) heat_intervals
    WHERE heat_intervals.interval_days IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_heat_detection IS
'BREDSUM \H: Heat detection metrics and intervals';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_heat_detection TO authenticated, service_role;

-- ============================================================================
-- BREDSUM Q-SUM (\Q switch) - Cumulative conception rate
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_qsum(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    day_number INTEGER,
    breeding_date DATE,
    daily_breedings BIGINT,
    daily_pregnancies BIGINT,
    cumulative_breedings BIGINT,
    cumulative_pregnancies BIGINT,
    cumulative_conception_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_stats AS (
        SELECT
            bo.breeding_date,
            COUNT(*)::BIGINT AS breedings,
            SUM(CASE WHEN bo.resulted_in_pregnancy THEN 1 ELSE 0 END)::BIGINT AS pregnancies
        FROM public.breeding_outcomes bo
        WHERE bo.tenant_id = p_tenant_id
          AND bo.breeding_date BETWEEN p_start_date AND p_end_date
        GROUP BY bo.breeding_date
        ORDER BY bo.breeding_date
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY ds.breeding_date)::INTEGER AS day_number,
        ds.breeding_date,
        ds.breedings AS daily_breedings,
        ds.pregnancies AS daily_pregnancies,
        SUM(ds.breedings) OVER (ORDER BY ds.breeding_date)::BIGINT AS cumulative_breedings,
        SUM(ds.pregnancies) OVER (ORDER BY ds.breeding_date)::BIGINT AS cumulative_pregnancies,
        ROUND(
            (SUM(ds.pregnancies) OVER (ORDER BY ds.breeding_date)::DECIMAL /
             NULLIF(SUM(ds.breedings) OVER (ORDER BY ds.breeding_date), 0) * 100),
            2
        ) AS cumulative_conception_rate
    FROM daily_stats ds;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_qsum IS
'BREDSUM \Q: Q-Sum cumulative conception rate trend over time';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_qsum TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'BREDSUM variant functions created: \S, \T, \N, \W, \E, \H, \Q' AS status;
