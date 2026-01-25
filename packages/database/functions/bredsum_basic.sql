-- HerdMaster Pro - BREDSUM Basic Report Function
-- Calculate breeding performance metrics by lactation group

CREATE OR REPLACE FUNCTION public.calculate_bredsum_basic(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    lactation_group TEXT,
    total_breedings BIGINT,
    pregnancies BIGINT,
    conception_rate DECIMAL(5,2),
    services_per_conception DECIMAL(5,2),
    avg_dim_at_breeding DECIMAL(6,1)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN bo.lactation_number = 1 THEN '1st Lact'
            WHEN bo.lactation_number = 2 THEN '2nd Lact'
            WHEN bo.lactation_number >= 3 THEN '3+ Lact'
            ELSE 'Unknown'
        END AS lactation_group,
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
        ) AS services_per_conception,
        ROUND(AVG(bo.dim_at_breeding), 1) AS avg_dim_at_breeding
    FROM public.breeding_outcomes bo
    WHERE bo.tenant_id = p_tenant_id
      AND bo.breeding_date BETWEEN p_start_date AND p_end_date
    GROUP BY
        CASE
            WHEN bo.lactation_number = 1 THEN '1st Lact'
            WHEN bo.lactation_number = 2 THEN '2nd Lact'
            WHEN bo.lactation_number >= 3 THEN '3+ Lact'
            ELSE 'Unknown'
        END
    ORDER BY lactation_group;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_basic IS
'Basic BREDSUM report: breeding performance by lactation group (1st, 2nd, 3+). Includes conception rate and services per conception.';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_basic TO authenticated, service_role;

-- ============================================================================
-- BREDSUM BY SERVICE NUMBER (\B switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_by_service(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    service_number INTEGER,
    total_breedings BIGINT,
    pregnancies BIGINT,
    conception_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bo.service_number::INTEGER,
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
      AND bo.service_number IS NOT NULL
    GROUP BY bo.service_number
    ORDER BY bo.service_number;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_by_service IS
'BREDSUM \B: Conception rates by service number (1st AI, 2nd AI, 3rd+ AI)';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_by_service TO authenticated, service_role;

-- ============================================================================
-- BREDSUM BY CALENDAR MONTH (\C switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_by_month(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '365 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    breeding_month TEXT,
    total_breedings BIGINT,
    pregnancies BIGINT,
    conception_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(DATE_TRUNC('month', bo.breeding_date), 'YYYY-MM') AS breeding_month,
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
    GROUP BY DATE_TRUNC('month', bo.breeding_date)
    ORDER BY DATE_TRUNC('month', bo.breeding_date);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_by_month IS
'BREDSUM \C: Conception rates by calendar month';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_by_month TO authenticated, service_role;

-- ============================================================================
-- BREDSUM BY PEN (\P switch)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_bredsum_by_pen(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    pen_name TEXT,
    total_breedings BIGINT,
    pregnancies BIGINT,
    conception_rate DECIMAL(5,2),
    services_per_conception DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(p.name, 'Unknown') AS pen_name,
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
    LEFT JOIN public.pens p ON p.id = bo.pen_id
    WHERE bo.tenant_id = p_tenant_id
      AND bo.breeding_date BETWEEN p_start_date AND p_end_date
    GROUP BY p.name
    ORDER BY conception_rate DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_bredsum_by_pen IS
'BREDSUM \P: Conception rates by pen/group';

GRANT EXECUTE ON FUNCTION public.calculate_bredsum_by_pen TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'BREDSUM basic functions created: basic, by_service, by_month, by_pen' AS status;
