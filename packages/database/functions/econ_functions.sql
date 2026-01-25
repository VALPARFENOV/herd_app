-- HerdMaster Pro - ECON Command Functions
-- RPC functions for economic analysis and IOFC tracking
-- Phase 4: Economics Module

-- ============================================================================
-- CALCULATE ECONOMICS - Basic ECON Report
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_economics(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    metric TEXT,
    value DECIMAL(12,2),
    per_cow DECIMAL(10,2),
    period_days INTEGER
) AS $$
DECLARE
    v_settings RECORD;
    v_total_cows INTEGER;
    v_days INTEGER;
BEGIN
    -- Get economic settings
    SELECT * INTO v_settings
    FROM public.economic_settings
    WHERE tenant_id = p_tenant_id;

    -- Count of cows in period
    SELECT COUNT(DISTINCT id) INTO v_total_cows
    FROM public.animals
    WHERE tenant_id = p_tenant_id
      AND deleted_at IS NULL;

    v_days := (p_end_date - p_start_date)::INTEGER + 1;

    RETURN QUERY
    WITH revenue AS (
        SELECT
            COALESCE(SUM(total_revenue), 0) AS total_milk_revenue
        FROM public.milk_sales
        WHERE tenant_id = p_tenant_id
          AND sale_date BETWEEN p_start_date AND p_end_date
          AND deleted_at IS NULL
    ),
    costs AS (
        SELECT
            SUM(CASE WHEN cost_type = 'feed' THEN amount ELSE 0 END) AS feed_costs,
            SUM(CASE WHEN cost_type = 'vet' THEN amount ELSE 0 END) AS vet_costs,
            SUM(CASE WHEN cost_type = 'breeding' THEN amount ELSE 0 END) AS breeding_costs,
            SUM(CASE WHEN cost_type = 'labor' THEN amount ELSE 0 END) AS labor_costs,
            SUM(amount) AS total_costs
        FROM public.cost_entries
        WHERE tenant_id = p_tenant_id
          AND entry_date BETWEEN p_start_date AND p_end_date
          AND deleted_at IS NULL
    ),
    estimated_feed AS (
        -- If no feed cost entries, estimate from settings
        SELECT
            v_total_cows * COALESCE(v_settings.feed_cost_per_day, 8.50) * v_days AS estimated_feed_cost
    )
    SELECT 'Total Milk Revenue'::TEXT,
           r.total_milk_revenue,
           (r.total_milk_revenue / NULLIF(v_total_cows, 0)),
           v_days
    FROM revenue r

    UNION ALL

    SELECT 'Total Feed Costs'::TEXT,
           COALESCE(c.feed_costs, ef.estimated_feed_cost),
           (COALESCE(c.feed_costs, ef.estimated_feed_cost) / NULLIF(v_total_cows, 0)),
           v_days
    FROM costs c, estimated_feed ef

    UNION ALL

    SELECT 'Total Vet Costs'::TEXT,
           COALESCE(c.vet_costs, 0),
           (COALESCE(c.vet_costs, 0) / NULLIF(v_total_cows, 0)),
           v_days
    FROM costs c

    UNION ALL

    SELECT 'Total Breeding Costs'::TEXT,
           COALESCE(c.breeding_costs, 0),
           (COALESCE(c.breeding_costs, 0) / NULLIF(v_total_cows, 0)),
           v_days
    FROM costs c

    UNION ALL

    SELECT 'Total Labor Costs'::TEXT,
           COALESCE(c.labor_costs, 0),
           (COALESCE(c.labor_costs, 0) / NULLIF(v_total_cows, 0)),
           v_days
    FROM costs c

    UNION ALL

    SELECT 'IOFC (Income Over Feed Cost)'::TEXT,
           r.total_milk_revenue - COALESCE(c.feed_costs, ef.estimated_feed_cost),
           ((r.total_milk_revenue - COALESCE(c.feed_costs, ef.estimated_feed_cost)) / NULLIF(v_total_cows, 0)),
           v_days
    FROM revenue r, costs c, estimated_feed ef

    UNION ALL

    SELECT 'Net Profit'::TEXT,
           r.total_milk_revenue - COALESCE(c.total_costs, 0),
           ((r.total_milk_revenue - COALESCE(c.total_costs, 0)) / NULLIF(v_total_cows, 0)),
           v_days
    FROM revenue r, costs c;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_economics IS
'ECON: Returns basic economic metrics including IOFC, costs, and profit';

GRANT EXECUTE ON FUNCTION public.calculate_economics TO authenticated, service_role;

-- ============================================================================
-- IOFC BY PEN - Location-based profitability
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_iofc_by_pen(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    pen_id UUID,
    pen_name TEXT,
    cow_count INTEGER,
    avg_milk_kg DECIMAL(10,2),
    milk_revenue DECIMAL(12,2),
    feed_costs DECIMAL(12,2),
    iofc DECIMAL(12,2),
    iofc_per_cow DECIMAL(10,2)
) AS $$
DECLARE
    v_settings RECORD;
    v_days INTEGER;
BEGIN
    -- Get settings
    SELECT * INTO v_settings
    FROM public.economic_settings
    WHERE tenant_id = p_tenant_id;

    v_days := (p_end_date - p_start_date)::INTEGER + 1;

    RETURN QUERY
    WITH pen_production AS (
        SELECT
            a.pen_id,
            COUNT(DISTINCT a.id) AS cow_count,
            AVG(mt.milk_kg) AS avg_milk
        FROM public.animals a
        LEFT JOIN public.milk_tests mt
            ON mt.animal_id = a.id
            AND mt.test_date BETWEEN p_start_date AND p_end_date
        WHERE a.tenant_id = p_tenant_id
          AND a.current_status = 'milking'
          AND a.deleted_at IS NULL
        GROUP BY a.pen_id
    ),
    pen_costs AS (
        SELECT
            ce.pen_id,
            SUM(CASE WHEN ce.cost_type = 'feed' THEN ce.amount ELSE 0 END) AS feed_cost
        FROM public.cost_entries ce
        WHERE ce.tenant_id = p_tenant_id
          AND ce.entry_date BETWEEN p_start_date AND p_end_date
          AND ce.deleted_at IS NULL
          AND ce.pen_id IS NOT NULL
        GROUP BY ce.pen_id
    )
    SELECT
        pp.pen_id,
        COALESCE(p.name, 'Unknown') AS pen_name,
        pp.cow_count::INTEGER,
        pp.avg_milk::DECIMAL(10,2),
        (pp.avg_milk * COALESCE(v_settings.milk_price_per_kg, 0.40) * pp.cow_count * v_days)::DECIMAL(12,2) AS milk_revenue,
        COALESCE(pc.feed_cost, pp.cow_count * COALESCE(v_settings.feed_cost_per_day, 8.50) * v_days)::DECIMAL(12,2) AS feed_costs,
        ((pp.avg_milk * COALESCE(v_settings.milk_price_per_kg, 0.40) * pp.cow_count * v_days) -
         COALESCE(pc.feed_cost, pp.cow_count * COALESCE(v_settings.feed_cost_per_day, 8.50) * v_days))::DECIMAL(12,2) AS iofc,
        (((pp.avg_milk * COALESCE(v_settings.milk_price_per_kg, 0.40) * v_days) -
         COALESCE(pc.feed_cost, COALESCE(v_settings.feed_cost_per_day, 8.50) * v_days) / NULLIF(pp.cow_count, 0)))::DECIMAL(10,2) AS iofc_per_cow
    FROM pen_production pp
    LEFT JOIN public.pens p ON p.id = pp.pen_id
    LEFT JOIN pen_costs pc ON pc.pen_id = pp.pen_id
    WHERE pp.cow_count > 0
    ORDER BY iofc DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_iofc_by_pen IS
'ECON: Returns IOFC analysis grouped by pen/location';

GRANT EXECUTE ON FUNCTION public.calculate_iofc_by_pen TO authenticated, service_role;

-- ============================================================================
-- PROFITABILITY TRENDS - Daily/Weekly/Monthly
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_profitability_trends(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
    p_end_date DATE DEFAULT CURRENT_DATE,
    p_interval TEXT DEFAULT 'week' -- 'day', 'week', 'month'
) RETURNS TABLE(
    period_start DATE,
    period_label TEXT,
    milk_revenue DECIMAL(12,2),
    total_costs DECIMAL(12,2),
    iofc DECIMAL(12,2),
    net_profit DECIMAL(12,2),
    volume_kg DECIMAL(10,2)
) AS $$
DECLARE
    v_interval_sql TEXT;
BEGIN
    -- Determine SQL interval expression
    v_interval_sql := CASE p_interval
        WHEN 'day' THEN 'sale_date'
        WHEN 'week' THEN 'DATE_TRUNC(''week'', sale_date)::DATE'
        WHEN 'month' THEN 'DATE_TRUNC(''month'', sale_date)::DATE'
        ELSE 'DATE_TRUNC(''week'', sale_date)::DATE'
    END;

    RETURN QUERY EXECUTE format(
        'WITH period_revenue AS (
            SELECT
                %s AS period,
                SUM(total_revenue) AS revenue,
                SUM(volume_kg) AS volume
            FROM public.milk_sales
            WHERE tenant_id = $1
              AND sale_date BETWEEN $2 AND $3
              AND deleted_at IS NULL
            GROUP BY period
        ),
        period_costs AS (
            SELECT
                %s AS period,
                SUM(amount) AS costs
            FROM public.cost_entries
            WHERE tenant_id = $1
              AND entry_date BETWEEN $2 AND $3
              AND deleted_at IS NULL
            GROUP BY period
        )
        SELECT
            pr.period::DATE AS period_start,
            TO_CHAR(pr.period, ''YYYY-MM-DD'')::TEXT AS period_label,
            COALESCE(pr.revenue, 0)::DECIMAL(12,2) AS milk_revenue,
            COALESCE(pc.costs, 0)::DECIMAL(12,2) AS total_costs,
            (COALESCE(pr.revenue, 0) - COALESCE(pc.costs, 0) * 0.5)::DECIMAL(12,2) AS iofc,
            (COALESCE(pr.revenue, 0) - COALESCE(pc.costs, 0))::DECIMAL(12,2) AS net_profit,
            COALESCE(pr.volume, 0)::DECIMAL(10,2) AS volume_kg
        FROM period_revenue pr
        FULL OUTER JOIN period_costs pc ON pc.period = pr.period
        ORDER BY period_start',
        v_interval_sql,
        CASE p_interval
            WHEN 'day' THEN 'entry_date'
            WHEN 'week' THEN 'DATE_TRUNC(''week'', entry_date)::DATE'
            WHEN 'month' THEN 'DATE_TRUNC(''month'', entry_date)::DATE'
            ELSE 'DATE_TRUNC(''week'', entry_date)::DATE'
        END
    )
    USING p_tenant_id, p_start_date, p_end_date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_profitability_trends IS
'ECON: Returns profitability trends aggregated by day/week/month';

GRANT EXECUTE ON FUNCTION public.calculate_profitability_trends TO authenticated, service_role;

-- ============================================================================
-- COST BREAKDOWN - By type and category
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_cost_breakdown(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    cost_type TEXT,
    category TEXT,
    total_amount DECIMAL(12,2),
    entry_count INTEGER,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH total AS (
        SELECT SUM(amount) AS total_costs
        FROM public.cost_entries
        WHERE tenant_id = p_tenant_id
          AND entry_date BETWEEN p_start_date AND p_end_date
          AND deleted_at IS NULL
    )
    SELECT
        ce.cost_type,
        COALESCE(ce.category, 'Uncategorized') AS category,
        SUM(ce.amount)::DECIMAL(12,2) AS total_amount,
        COUNT(*)::INTEGER AS entry_count,
        ROUND((SUM(ce.amount) / NULLIF(t.total_costs, 0) * 100), 2)::DECIMAL(5,2) AS percentage
    FROM public.cost_entries ce
    CROSS JOIN total t
    WHERE ce.tenant_id = p_tenant_id
      AND ce.entry_date BETWEEN p_start_date AND p_end_date
      AND ce.deleted_at IS NULL
    GROUP BY ce.cost_type, ce.category, t.total_costs
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_cost_breakdown IS
'ECON: Returns detailed breakdown of costs by type and category';

GRANT EXECUTE ON FUNCTION public.get_cost_breakdown TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'ECON functions created: calculate_economics, calculate_iofc_by_pen, calculate_profitability_trends, get_cost_breakdown' AS status;
