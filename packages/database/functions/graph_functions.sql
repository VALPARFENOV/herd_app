-- HerdMaster Pro - GRAPH Command Functions
-- RPC functions for histograms and distribution analysis
-- Phase 3: Production Analysis

-- ============================================================================
-- GRAPH HISTOGRAM - Distribution Analysis
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_histogram(
    p_tenant_id UUID,
    p_field TEXT DEFAULT 'milk_kg',
    p_bin_count INTEGER DEFAULT 10,
    p_lactation_filter INTEGER DEFAULT NULL
) RETURNS TABLE(
    bin_label TEXT,
    bin_min DECIMAL(10,2),
    bin_max DECIMAL(10,2),
    count INTEGER,
    percentage DECIMAL(5,2)
) AS $$
DECLARE
    field_column TEXT;
    min_value DECIMAL(10,2);
    max_value DECIMAL(10,2);
    bin_width DECIMAL(10,2);
    total_count INTEGER;
BEGIN
    -- Map field code to column
    field_column := CASE p_field
        WHEN 'MILK' THEN 'avg_milk_kg'
        WHEN '305ME' THEN '305me'
        WHEN 'DIM' THEN 'current_dim'
        WHEN 'SCC' THEN 'avg_scc'
        WHEN 'LACT' THEN 'lactation_number'
        WHEN 'AGE' THEN 'current_dim' -- Using DIM as proxy
        ELSE p_field
    END;

    -- Get min/max values for binning
    EXECUTE format(
        'SELECT MIN(%I), MAX(%I), COUNT(*)
        FROM public.lactation_performance
        WHERE tenant_id = $1
          AND %I IS NOT NULL
          AND ($2::INTEGER IS NULL OR lactation_number = $2)',
        field_column, field_column, field_column
    )
    INTO min_value, max_value, total_count
    USING p_tenant_id, p_lactation_filter;

    -- Calculate bin width
    bin_width := (max_value - min_value) / p_bin_count;

    -- Return histogram data
    RETURN QUERY
    WITH bins AS (
        SELECT
            generate_series(0, p_bin_count - 1) AS bin_num,
            (min_value + generate_series(0, p_bin_count - 1) * bin_width) AS bin_start,
            (min_value + generate_series(1, p_bin_count) * bin_width) AS bin_end
    ),
    data_bins AS (
        SELECT
            FLOOR((data_val - min_value) / NULLIF(bin_width, 0))::INTEGER AS bin_num,
            COUNT(*)::INTEGER AS bin_count
        FROM (
            SELECT
                CASE
                    WHEN field_column = 'avg_milk_kg' THEN lp.avg_milk_kg
                    WHEN field_column = '305me' THEN lp."305me"
                    WHEN field_column = 'current_dim' THEN lp.current_dim::DECIMAL
                    WHEN field_column = 'avg_scc' THEN lp.avg_scc
                    WHEN field_column = 'lactation_number' THEN lp.lactation_number::DECIMAL
                END AS data_val
            FROM public.lactation_performance lp
            WHERE lp.tenant_id = p_tenant_id
              AND (p_lactation_filter IS NULL OR lp.lactation_number = p_lactation_filter)
              AND CASE
                    WHEN field_column = 'avg_milk_kg' THEN lp.avg_milk_kg
                    WHEN field_column = '305me' THEN lp."305me"
                    WHEN field_column = 'current_dim' THEN lp.current_dim::DECIMAL
                    WHEN field_column = 'avg_scc' THEN lp.avg_scc
                    WHEN field_column = 'lactation_number' THEN lp.lactation_number::DECIMAL
                END IS NOT NULL
        ) vals
        WHERE data_val BETWEEN min_value AND max_value
        GROUP BY bin_num
    )
    SELECT
        b.bin_start::TEXT || ' - ' || b.bin_end::TEXT AS bin_label,
        b.bin_start,
        b.bin_end,
        COALESCE(db.bin_count, 0) AS count,
        ROUND((COALESCE(db.bin_count, 0)::DECIMAL / NULLIF(total_count, 0) * 100), 2) AS percentage
    FROM bins b
    LEFT JOIN data_bins db ON db.bin_num = b.bin_num
    ORDER BY b.bin_num;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_histogram IS
'GRAPH: Returns histogram distribution for specified field with configurable bin count';

GRANT EXECUTE ON FUNCTION public.calculate_histogram TO authenticated, service_role;

-- ============================================================================
-- GRAPH SCATTER - Correlation Analysis
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_scatter(
    p_tenant_id UUID,
    p_x_field TEXT DEFAULT 'dim',
    p_y_field TEXT DEFAULT 'milk_kg',
    p_lactation_filter INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 500
) RETURNS TABLE(
    animal_id UUID,
    ear_tag TEXT,
    x_value DECIMAL(10,2),
    y_value DECIMAL(10,2),
    lactation_number INTEGER
) AS $$
DECLARE
    x_column TEXT;
    y_column TEXT;
BEGIN
    -- Map field codes
    x_column := CASE p_x_field
        WHEN 'DIM' THEN 'current_dim'
        WHEN 'MILK' THEN 'avg_milk_kg'
        WHEN '305ME' THEN '305me'
        WHEN 'SCC' THEN 'avg_scc'
        WHEN 'LACT' THEN 'lactation_number'
        ELSE p_x_field
    END;

    y_column := CASE p_y_field
        WHEN 'DIM' THEN 'current_dim'
        WHEN 'MILK' THEN 'avg_milk_kg'
        WHEN '305ME' THEN '305me'
        WHEN 'SCC' THEN 'avg_scc'
        WHEN 'LACT' THEN 'lactation_number'
        ELSE p_y_field
    END;

    RETURN QUERY EXECUTE format(
        'SELECT
            lp.animal_id,
            lp.ear_tag,
            %I::DECIMAL(10,2) AS x_value,
            %I::DECIMAL(10,2) AS y_value,
            lp.lactation_number
        FROM public.lactation_performance lp
        WHERE lp.tenant_id = $1
          AND %I IS NOT NULL
          AND %I IS NOT NULL
          AND ($2::INTEGER IS NULL OR lp.lactation_number = $2)
        LIMIT $3',
        x_column, y_column, x_column, y_column
    )
    USING p_tenant_id, p_lactation_filter, p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_scatter IS
'GRAPH: Returns scatter plot data for correlation analysis between two fields';

GRANT EXECUTE ON FUNCTION public.calculate_scatter TO authenticated, service_role;

-- ============================================================================
-- GRAPH STATS - Field Statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_field_statistics(
    p_tenant_id UUID,
    p_field TEXT DEFAULT 'milk_kg',
    p_lactation_filter INTEGER DEFAULT NULL
) RETURNS TABLE(
    field_name TEXT,
    count INTEGER,
    mean DECIMAL(10,2),
    median DECIMAL(10,2),
    std_dev DECIMAL(10,2),
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    q1 DECIMAL(10,2),
    q3 DECIMAL(10,2)
) AS $$
DECLARE
    field_column TEXT;
BEGIN
    field_column := CASE p_field
        WHEN 'MILK' THEN 'avg_milk_kg'
        WHEN '305ME' THEN '305me'
        WHEN 'DIM' THEN 'current_dim'
        WHEN 'SCC' THEN 'avg_scc'
        ELSE p_field
    END;

    RETURN QUERY EXECUTE format(
        'SELECT
            %L::TEXT AS field_name,
            COUNT(*)::INTEGER AS count,
            AVG(%I)::DECIMAL(10,2) AS mean,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY %I)::DECIMAL(10,2) AS median,
            STDDEV(%I)::DECIMAL(10,2) AS std_dev,
            MIN(%I)::DECIMAL(10,2) AS min_value,
            MAX(%I)::DECIMAL(10,2) AS max_value,
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY %I)::DECIMAL(10,2) AS q1,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY %I)::DECIMAL(10,2) AS q3
        FROM public.lactation_performance lp
        WHERE lp.tenant_id = $1
          AND %I IS NOT NULL
          AND ($2::INTEGER IS NULL OR lp.lactation_number = $2)',
        p_field, field_column, field_column, field_column,
        field_column, field_column, field_column, field_column, field_column
    )
    USING p_tenant_id, p_lactation_filter;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_field_statistics IS
'Returns comprehensive statistics for a field including mean, median, std dev, quartiles';

GRANT EXECUTE ON FUNCTION public.get_field_statistics TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'GRAPH functions created: calculate_histogram, calculate_scatter, get_field_statistics' AS status;
