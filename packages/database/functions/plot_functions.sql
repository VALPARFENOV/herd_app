-- HerdMaster Pro - PLOT Command Functions
-- RPC functions for lactation curves and production plotting
-- Phase 3: Production Analysis

-- ============================================================================
-- PLOT BY DIM - Lactation Curves
-- ============================================================================

CREATE OR REPLACE FUNCTION public.plot_by_dim(
    p_tenant_id UUID,
    p_field TEXT DEFAULT 'milk_kg',
    p_lactation_filter INTEGER DEFAULT NULL,
    p_animal_ids UUID[] DEFAULT NULL,
    p_max_dim INTEGER DEFAULT 305
) RETURNS TABLE(
    animal_id UUID,
    ear_tag TEXT,
    lactation_number INTEGER,
    dim_at_test INTEGER,
    value DECIMAL(10,2),
    test_date DATE
) AS $$
DECLARE
    field_column TEXT;
BEGIN
    -- Map DairyComp field code to database column
    field_column := CASE p_field
        WHEN 'MILK' THEN 'milk_kg'
        WHEN 'FAT' THEN 'fat_percent'
        WHEN 'PROT' THEN 'protein_percent'
        WHEN 'PROTEIN' THEN 'protein_percent'
        WHEN 'SCC' THEN 'scc'
        WHEN 'FCM' THEN 'fcm'
        WHEN 'ECM' THEN 'ecm'
        ELSE p_field -- Assume it's already a db column name
    END;

    -- Return test data grouped by animal and DIM
    RETURN QUERY EXECUTE format(
        'SELECT
            mts.animal_id,
            mts.ear_tag,
            mts.lactation_number,
            mts.dim_at_test,
            %I::DECIMAL(10,2) AS value,
            mts.test_date
        FROM public.milk_test_series mts
        WHERE mts.tenant_id = $1
          AND mts.dim_at_test IS NOT NULL
          AND mts.dim_at_test <= $2
          AND mts.dim_at_test >= 0
          AND %I IS NOT NULL
          AND ($3::INTEGER IS NULL OR mts.lactation_number = $3)
          AND ($4::UUID[] IS NULL OR mts.animal_id = ANY($4))
        ORDER BY mts.animal_id, mts.dim_at_test',
        field_column, field_column
    )
    USING p_tenant_id, p_max_dim, p_lactation_filter, p_animal_ids;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.plot_by_dim IS
'PLOT BY DIM: Returns lactation curve data points for specified field over DIM (days in milk)';

GRANT EXECUTE ON FUNCTION public.plot_by_dim TO authenticated, service_role;

-- ============================================================================
-- PLOT BY DATE - Time Series
-- ============================================================================

CREATE OR REPLACE FUNCTION public.plot_by_date(
    p_tenant_id UUID,
    p_field TEXT DEFAULT 'milk_kg',
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '365 days',
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_animal_ids UUID[] DEFAULT NULL,
    p_aggregate BOOLEAN DEFAULT false
) RETURNS TABLE(
    test_date DATE,
    animal_id UUID,
    ear_tag TEXT,
    value DECIMAL(10,2),
    animal_count INTEGER
) AS $$
DECLARE
    field_column TEXT;
BEGIN
    -- Map field code to column
    field_column := CASE p_field
        WHEN 'MILK' THEN 'milk_kg'
        WHEN 'FAT' THEN 'fat_percent'
        WHEN 'PROT' THEN 'protein_percent'
        WHEN 'PROTEIN' THEN 'protein_percent'
        WHEN 'SCC' THEN 'scc'
        WHEN 'FCM' THEN 'fcm'
        WHEN 'ECM' THEN 'ecm'
        ELSE p_field
    END;

    IF p_aggregate THEN
        -- Aggregated herd-level trend
        RETURN QUERY EXECUTE format(
            'SELECT
                mts.test_date,
                NULL::UUID AS animal_id,
                ''HERD AVG''::TEXT AS ear_tag,
                AVG(%I)::DECIMAL(10,2) AS value,
                COUNT(DISTINCT mts.animal_id)::INTEGER AS animal_count
            FROM public.milk_test_series mts
            WHERE mts.tenant_id = $1
              AND mts.test_date BETWEEN $2 AND $3
              AND %I IS NOT NULL
              AND ($4::UUID[] IS NULL OR mts.animal_id = ANY($4))
            GROUP BY mts.test_date
            ORDER BY mts.test_date',
            field_column, field_column
        )
        USING p_tenant_id, p_start_date, p_end_date, p_animal_ids;
    ELSE
        -- Individual animal trends
        RETURN QUERY EXECUTE format(
            'SELECT
                mts.test_date,
                mts.animal_id,
                mts.ear_tag,
                %I::DECIMAL(10,2) AS value,
                1::INTEGER AS animal_count
            FROM public.milk_test_series mts
            WHERE mts.tenant_id = $1
              AND mts.test_date BETWEEN $2 AND $3
              AND %I IS NOT NULL
              AND ($4::UUID[] IS NULL OR mts.animal_id = ANY($4))
            ORDER BY mts.test_date, mts.ear_tag',
            field_column, field_column
        )
        USING p_tenant_id, p_start_date, p_end_date, p_animal_ids;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.plot_by_date IS
'PLOT BY TDAT: Returns time-series data for specified field over calendar dates';

GRANT EXECUTE ON FUNCTION public.plot_by_date TO authenticated, service_role;

-- ============================================================================
-- PLOT BY LACTATION - Group Comparison
-- ============================================================================

CREATE OR REPLACE FUNCTION public.plot_by_lactation(
    p_tenant_id UUID,
    p_field TEXT DEFAULT '305me',
    p_metric TEXT DEFAULT 'avg' -- 'avg', 'sum', 'count', 'median'
) RETURNS TABLE(
    lactation_group TEXT,
    value DECIMAL(10,2),
    animal_count INTEGER
) AS $$
DECLARE
    field_column TEXT;
    agg_function TEXT;
BEGIN
    -- Map field code to column
    field_column := CASE p_field
        WHEN 'MILK' THEN 'avg_milk_kg'
        WHEN '305ME' THEN '305me'
        WHEN 'TOTM' THEN 'total_milk_kg'
        WHEN 'PEAK' THEN 'peak_milk_kg'
        WHEN 'DIM' THEN 'current_dim'
        WHEN 'SCC' THEN 'avg_scc'
        ELSE p_field
    END;

    -- Map metric to SQL function
    agg_function := CASE p_metric
        WHEN 'avg' THEN 'AVG'
        WHEN 'sum' THEN 'SUM'
        WHEN 'count' THEN 'COUNT'
        WHEN 'median' THEN 'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY'
        ELSE 'AVG'
    END;

    -- Return aggregated data by lactation group
    IF p_metric = 'median' THEN
        RETURN QUERY EXECUTE format(
            'SELECT
                CASE
                    WHEN lp.lactation_number = 1 THEN ''1st Lact''
                    WHEN lp.lactation_number = 2 THEN ''2nd Lact''
                    WHEN lp.lactation_number >= 3 THEN ''3+ Lact''
                    ELSE ''Unknown''
                END AS lactation_group,
                %s %I)::DECIMAL(10,2) AS value,
                COUNT(*)::INTEGER AS animal_count
            FROM public.lactation_performance lp
            WHERE lp.tenant_id = $1
              AND %I IS NOT NULL
            GROUP BY
                CASE
                    WHEN lp.lactation_number = 1 THEN ''1st Lact''
                    WHEN lp.lactation_number = 2 THEN ''2nd Lact''
                    WHEN lp.lactation_number >= 3 THEN ''3+ Lact''
                    ELSE ''Unknown''
                END
            ORDER BY lactation_group',
            agg_function, field_column, field_column
        )
        USING p_tenant_id;
    ELSE
        RETURN QUERY EXECUTE format(
            'SELECT
                CASE
                    WHEN lp.lactation_number = 1 THEN ''1st Lact''
                    WHEN lp.lactation_number = 2 THEN ''2nd Lact''
                    WHEN lp.lactation_number >= 3 THEN ''3+ Lact''
                    ELSE ''Unknown''
                END AS lactation_group,
                %s(%I)::DECIMAL(10,2) AS value,
                COUNT(*)::INTEGER AS animal_count
            FROM public.lactation_performance lp
            WHERE lp.tenant_id = $1
              AND %I IS NOT NULL
            GROUP BY
                CASE
                    WHEN lp.lactation_number = 1 THEN ''1st Lact''
                    WHEN lp.lactation_number = 2 THEN ''2nd Lact''
                    WHEN lp.lactation_number >= 3 THEN ''3+ Lact''
                    ELSE ''Unknown''
                END
            ORDER BY lactation_group',
            agg_function, field_column, field_column
        )
        USING p_tenant_id;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.plot_by_lactation IS
'PLOT BY LACT: Returns aggregated production metrics grouped by lactation number';

GRANT EXECUTE ON FUNCTION public.plot_by_lactation TO authenticated, service_role;

-- ============================================================================
-- PLOT BY PEN - Location Comparison
-- ============================================================================

CREATE OR REPLACE FUNCTION public.plot_by_pen(
    p_tenant_id UUID,
    p_field TEXT DEFAULT 'milk_kg',
    p_metric TEXT DEFAULT 'avg'
) RETURNS TABLE(
    pen_id UUID,
    pen_name TEXT,
    value DECIMAL(10,2),
    animal_count INTEGER
) AS $$
DECLARE
    field_column TEXT;
    agg_function TEXT;
BEGIN
    field_column := CASE p_field
        WHEN 'MILK' THEN 'avg_milk_kg'
        WHEN '305ME' THEN '305me'
        WHEN 'DIM' THEN 'current_dim'
        WHEN 'SCC' THEN 'avg_scc'
        ELSE p_field
    END;

    agg_function := CASE p_metric
        WHEN 'avg' THEN 'AVG'
        WHEN 'sum' THEN 'SUM'
        WHEN 'count' THEN 'COUNT'
        ELSE 'AVG'
    END;

    RETURN QUERY EXECUTE format(
        'SELECT
            lp.pen_id,
            COALESCE(p.name, ''Unknown'') AS pen_name,
            %s(%I)::DECIMAL(10,2) AS value,
            COUNT(*)::INTEGER AS animal_count
        FROM public.lactation_performance lp
        LEFT JOIN public.pens p ON p.id = lp.pen_id
        WHERE lp.tenant_id = $1
          AND %I IS NOT NULL
        GROUP BY lp.pen_id, p.name
        ORDER BY value DESC NULLS LAST',
        agg_function, field_column, field_column
    )
    USING p_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.plot_by_pen IS
'PLOT BY PEN: Returns aggregated production metrics grouped by pen/location';

GRANT EXECUTE ON FUNCTION public.plot_by_pen TO authenticated, service_role;

-- ============================================================================
-- HELPER: Get Average Lactation Curve
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_average_lactation_curve(
    p_tenant_id UUID,
    p_lactation_filter INTEGER DEFAULT NULL,
    p_field TEXT DEFAULT 'milk_kg',
    p_max_dim INTEGER DEFAULT 305
) RETURNS TABLE(
    dim_at_test INTEGER,
    avg_value DECIMAL(10,2),
    sample_count INTEGER,
    std_dev DECIMAL(10,2),
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2)
) AS $$
DECLARE
    field_column TEXT;
BEGIN
    field_column := CASE p_field
        WHEN 'MILK' THEN 'milk_kg'
        WHEN 'FAT' THEN 'fat_percent'
        WHEN 'PROT' THEN 'protein_percent'
        WHEN 'SCC' THEN 'scc'
        WHEN 'FCM' THEN 'fcm'
        ELSE p_field
    END;

    RETURN QUERY EXECUTE format(
        'SELECT
            mts.dim_at_test,
            AVG(%I)::DECIMAL(10,2) AS avg_value,
            COUNT(*)::INTEGER AS sample_count,
            STDDEV(%I)::DECIMAL(10,2) AS std_dev,
            MIN(%I)::DECIMAL(10,2) AS min_value,
            MAX(%I)::DECIMAL(10,2) AS max_value
        FROM public.milk_test_series mts
        WHERE mts.tenant_id = $1
          AND mts.dim_at_test IS NOT NULL
          AND mts.dim_at_test BETWEEN 0 AND $2
          AND %I IS NOT NULL
          AND ($3::INTEGER IS NULL OR mts.lactation_number = $3)
        GROUP BY mts.dim_at_test
        ORDER BY mts.dim_at_test',
        field_column, field_column, field_column, field_column, field_column
    )
    USING p_tenant_id, p_max_dim, p_lactation_filter;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_average_lactation_curve IS
'Returns average lactation curve with statistics for herd benchmarking';

GRANT EXECUTE ON FUNCTION public.get_average_lactation_curve TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'PLOT functions created: plot_by_dim, plot_by_date, plot_by_lactation, plot_by_pen, get_average_lactation_curve' AS status;
