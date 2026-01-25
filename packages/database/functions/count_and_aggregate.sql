-- HerdMaster Pro - COUNT and Aggregation RPC Functions
-- Support for DairyComp-style COUNT and SUM commands

-- ============================================================================
-- HELPER: Build WHERE clause from conditions JSONB
-- ============================================================================

CREATE OR REPLACE FUNCTION public.build_where_clause(
    conditions JSONB DEFAULT '{}'::JSONB
) RETURNS TEXT AS $$
DECLARE
    where_clause TEXT := '1=1';
    condition JSONB;
    field TEXT;
    operator TEXT;
    value TEXT;
BEGIN
    -- If no conditions, return true
    IF conditions = '{}'::JSONB OR jsonb_array_length(conditions) = 0 THEN
        RETURN '1=1';
    END IF;

    -- Build WHERE clause from conditions array
    FOR condition IN SELECT * FROM jsonb_array_elements(conditions)
    LOOP
        field := condition->>'field';
        operator := condition->>'operator';
        value := condition->>'value';

        -- Add condition with proper escaping
        where_clause := where_clause || format(
            ' AND %I %s %L',
            field,
            operator,
            value
        );
    END LOOP;

    RETURN where_clause;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.build_where_clause IS
'Builds SQL WHERE clause from JSONB conditions array. Format: [{"field": "rc", "operator": "=", "value": "5"}]';

-- ============================================================================
-- COUNT BY GROUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.count_by_group(
    p_tenant_id UUID,
    p_group_field TEXT,
    p_conditions JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE(
    group_value TEXT,
    count BIGINT
) AS $$
DECLARE
    sql_query TEXT;
    where_clause TEXT;
BEGIN
    -- Build WHERE clause
    where_clause := build_where_clause(p_conditions);

    -- Build dynamic GROUP BY query
    sql_query := format(
        'SELECT
            COALESCE(%I::TEXT, ''NULL'') AS group_value,
            COUNT(*) AS count
        FROM public.animals_with_calculated
        WHERE tenant_id = %L
          AND deleted_at IS NULL
          AND %s
        GROUP BY %I
        ORDER BY count DESC, group_value',
        p_group_field,
        p_tenant_id,
        where_clause,
        p_group_field
    );

    RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.count_by_group IS
'Counts animals grouped by a field. Example: COUNT ID BY PEN';

-- Grant execution
GRANT EXECUTE ON FUNCTION public.count_by_group TO authenticated, service_role;

-- ============================================================================
-- SIMPLE COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.count_animals(
    p_tenant_id UUID,
    p_conditions JSONB DEFAULT '{}'::JSONB
) RETURNS BIGINT AS $$
DECLARE
    sql_query TEXT;
    where_clause TEXT;
    result BIGINT;
BEGIN
    -- Build WHERE clause
    where_clause := build_where_clause(p_conditions);

    -- Build count query
    sql_query := format(
        'SELECT COUNT(*)
        FROM public.animals_with_calculated
        WHERE tenant_id = %L
          AND deleted_at IS NULL
          AND %s',
        p_tenant_id,
        where_clause
    );

    EXECUTE sql_query INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.count_animals IS
'Counts animals matching conditions. Example: COUNT ID FOR RC=5';

GRANT EXECUTE ON FUNCTION public.count_animals TO authenticated, service_role;

-- ============================================================================
-- CALCULATE AGGREGATES (SUM/AVG)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_aggregates(
    p_tenant_id UUID,
    p_fields TEXT[],
    p_conditions JSONB DEFAULT '{}'::JSONB,
    p_group_by TEXT DEFAULT NULL,
    p_include_avg BOOLEAN DEFAULT TRUE,
    p_include_sum BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
    sql_query TEXT;
    where_clause TEXT;
    select_parts TEXT[] := ARRAY[]::TEXT[];
    field TEXT;
    result JSONB;
BEGIN
    -- Build WHERE clause
    where_clause := build_where_clause(p_conditions);

    -- Build SELECT clause with aggregations
    FOREACH field IN ARRAY p_fields
    LOOP
        IF p_include_avg THEN
            select_parts := array_append(
                select_parts,
                format('ROUND(AVG(%I::NUMERIC), 2) AS avg_%s', field, field)
            );
        END IF;

        IF p_include_sum THEN
            select_parts := array_append(
                select_parts,
                format('ROUND(SUM(%I::NUMERIC), 2) AS sum_%s', field, field)
            );
        END IF;

        -- Always include count
        select_parts := array_append(
            select_parts,
            format('COUNT(%I) AS count_%s', field, field)
        );
    END LOOP;

    -- Add group field if specified
    IF p_group_by IS NOT NULL THEN
        sql_query := format(
            'SELECT
                jsonb_agg(
                    jsonb_build_object(
                        ''group'', COALESCE(%I::TEXT, ''NULL''),
                        %s
                    )
                )
            FROM public.animals_with_calculated
            WHERE tenant_id = %L
              AND deleted_at IS NULL
              AND %s
            GROUP BY %I',
            p_group_by,
            array_to_string(
                ARRAY(
                    SELECT format('''%s'', %s',
                        regexp_replace(sp, '^.*AS (.+)$', '\1'),
                        sp
                    )
                    FROM unnest(select_parts) sp
                ),
                ', '
            ),
            p_tenant_id,
            where_clause,
            p_group_by
        );
    ELSE
        -- No grouping - single row result
        sql_query := format(
            'SELECT
                jsonb_build_object(
                    %s
                )
            FROM public.animals_with_calculated
            WHERE tenant_id = %L
              AND deleted_at IS NULL
              AND %s',
            array_to_string(
                ARRAY(
                    SELECT format('''%s'', %s',
                        regexp_replace(sp, '^.*AS (.+)$', '\1'),
                        sp
                    )
                    FROM unnest(select_parts) sp
                ),
                ', '
            ),
            p_tenant_id,
            where_clause
        );
    END IF;

    EXECUTE sql_query INTO result;
    RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_aggregates IS
'Calculates SUM/AVG for specified fields with optional grouping. Example: SUM MILK LACT \A BY PEN';

GRANT EXECUTE ON FUNCTION public.calculate_aggregates TO authenticated, service_role;

-- ============================================================================
-- GET FIELD STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_field_statistics(
    p_tenant_id UUID,
    p_field TEXT,
    p_conditions JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE(
    avg_value DECIMAL(10,2),
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    sum_value DECIMAL(10,2),
    count_value BIGINT,
    median_value DECIMAL(10,2),
    std_dev DECIMAL(10,2)
) AS $$
DECLARE
    sql_query TEXT;
    where_clause TEXT;
BEGIN
    where_clause := build_where_clause(p_conditions);

    sql_query := format(
        'SELECT
            ROUND(AVG(%I::NUMERIC), 2) AS avg_value,
            ROUND(MIN(%I::NUMERIC), 2) AS min_value,
            ROUND(MAX(%I::NUMERIC), 2) AS max_value,
            ROUND(SUM(%I::NUMERIC), 2) AS sum_value,
            COUNT(%I) AS count_value,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY %I::NUMERIC), 2) AS median_value,
            ROUND(STDDEV(%I::NUMERIC), 2) AS std_dev
        FROM public.animals_with_calculated
        WHERE tenant_id = %L
          AND deleted_at IS NULL
          AND %s
          AND %I IS NOT NULL',
        p_field, p_field, p_field, p_field, p_field, p_field, p_field,
        p_tenant_id,
        where_clause,
        p_field
    );

    RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_field_statistics IS
'Returns comprehensive statistics for a numeric field (avg, min, max, sum, count, median, stddev)';

GRANT EXECUTE ON FUNCTION public.get_field_statistics TO authenticated, service_role;

-- ============================================================================
-- HISTOGRAM CALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_histogram(
    p_tenant_id UUID,
    p_field TEXT,
    p_bin_count INTEGER DEFAULT 10,
    p_conditions JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE(
    bin_label TEXT,
    bin_min DECIMAL(10,2),
    bin_max DECIMAL(10,2),
    count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
DECLARE
    sql_query TEXT;
    where_clause TEXT;
BEGIN
    where_clause := build_where_clause(p_conditions);

    sql_query := format(
        'WITH stats AS (
            SELECT
                MIN(%I::NUMERIC) AS min_val,
                MAX(%I::NUMERIC) AS max_val,
                COUNT(*) AS total_count
            FROM public.animals_with_calculated
            WHERE tenant_id = %L
              AND deleted_at IS NULL
              AND %s
              AND %I IS NOT NULL
        ),
        bins AS (
            SELECT
                generate_series(0, %s - 1) AS bin_num,
                min_val,
                max_val,
                (max_val - min_val) / %s AS bin_width,
                total_count
            FROM stats
        ),
        data_with_bins AS (
            SELECT
                a.%I AS value,
                FLOOR((%I::NUMERIC - b.min_val) / NULLIF(b.bin_width, 0)) AS bin_num,
                b.bin_width,
                b.min_val,
                b.total_count
            FROM public.animals_with_calculated a
            CROSS JOIN bins b
            WHERE a.tenant_id = %L
              AND a.deleted_at IS NULL
              AND %s
              AND a.%I IS NOT NULL
        )
        SELECT
            CONCAT(
                ROUND(min_val + bin_num * bin_width, 1),
                '' - '',
                ROUND(min_val + (bin_num + 1) * bin_width, 1)
            ) AS bin_label,
            ROUND(min_val + bin_num * bin_width, 2) AS bin_min,
            ROUND(min_val + (bin_num + 1) * bin_width, 2) AS bin_max,
            COUNT(*)::BIGINT AS count,
            ROUND((COUNT(*)::NUMERIC / total_count * 100), 2) AS percentage
        FROM data_with_bins
        GROUP BY bin_num, bin_width, min_val, total_count
        ORDER BY bin_num',
        p_field, p_field,
        p_tenant_id,
        where_clause,
        p_field,
        p_bin_count,
        p_bin_count,
        p_field, p_field,
        p_tenant_id,
        where_clause,
        p_field
    );

    RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_histogram IS
'Calculates histogram distribution for a numeric field with specified number of bins';

GRANT EXECUTE ON FUNCTION public.calculate_histogram TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'COUNT and aggregation RPC functions created successfully!' AS status;
