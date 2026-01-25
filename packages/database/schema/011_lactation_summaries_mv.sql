-- HerdMaster Pro - Lactation Summaries Materialized View
-- Pre-calculates lactation metrics for fast query performance
-- Includes 305ME calculation function

-- ============================================================================
-- 305ME CALCULATION FUNCTION
-- ============================================================================

-- Calculate 305-day Mature Equivalent milk production
-- Adjusts milk production to standard 305 days and mature cow equivalent
CREATE OR REPLACE FUNCTION public.calculate_305me(
    p_animal_id UUID,
    p_lactation_number INTEGER
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_milk DECIMAL(10,2);
    v_dim INTEGER;
    v_breed VARCHAR(50);
    v_adjustment DECIMAL(5,3);
    v_projected_305 DECIMAL(10,2);
BEGIN
    -- Get total milk and DIM from lactation
    SELECT
        total_milk_kg,
        days_in_milk
    INTO v_total_milk, v_dim
    FROM public.lactations
    WHERE animal_id = p_animal_id
      AND lactation_number = p_lactation_number;

    -- Return NULL if no data
    IF v_total_milk IS NULL OR v_dim IS NULL OR v_dim = 0 THEN
        RETURN NULL;
    END IF;

    -- Get breed for breed-specific adjustments (future enhancement)
    SELECT breed INTO v_breed
    FROM public.animals
    WHERE id = p_animal_id;

    -- Maturity adjustment factor by lactation number
    -- Source: USDA DHIA guidelines for Holstein cows
    v_adjustment := CASE p_lactation_number
        WHEN 1 THEN 1.15  -- First lactation (immature)
        WHEN 2 THEN 1.05  -- Second lactation (maturing)
        ELSE 1.00         -- Mature (3+)
    END;

    -- Project to 305 days if lactation is shorter
    IF v_dim >= 305 THEN
        -- Use actual production if lactation >= 305 days
        v_projected_305 := v_total_milk;
    ELSIF v_dim >= 100 THEN
        -- Linear projection for lactations 100-304 days
        v_projected_305 := (v_total_milk / v_dim) * 305;
    ELSE
        -- For very short lactations (<100 days), use conservative estimate
        -- Apply a penalty factor to avoid overestimation
        v_projected_305 := (v_total_milk / v_dim) * 305 * 0.90;
    END IF;

    -- Apply maturity adjustment and return
    RETURN ROUND((v_projected_305 * v_adjustment)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.calculate_305me IS
'Calculates 305-day Mature Equivalent milk production with lactation number adjustments';

-- ============================================================================
-- LACTATION SUMMARIES MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.lactation_summaries AS
SELECT
    l.id AS lactation_id,
    l.tenant_id,
    l.animal_id,
    l.lactation_number,
    l.calving_date,
    l.dry_date,
    a.ear_tag,
    a.name AS animal_name,

    -- ========================================================================
    -- DURATION METRICS
    -- ========================================================================

    -- DIM: Days in milk
    COALESCE(
        l.days_in_milk,
        CASE
            WHEN l.dry_date IS NOT NULL
            THEN (l.dry_date - l.calving_date)::INTEGER
            ELSE (CURRENT_DATE - l.calving_date)::INTEGER
        END
    ) AS dim,

    -- Days open (conception - calving, or current - calving if not conceived)
    CASE
        WHEN a.conception_date IS NOT NULL
             AND a.conception_date >= l.calving_date
             AND (l.dry_date IS NULL OR a.conception_date <= l.dry_date)
        THEN (a.conception_date - l.calving_date)::INTEGER
        WHEN l.dry_date IS NOT NULL
        THEN (l.dry_date - l.calving_date)::INTEGER
        ELSE (CURRENT_DATE - l.calving_date)::INTEGER
    END AS days_open,

    -- Days dry (next calving - dry date)
    CASE
        WHEN l.dry_date IS NOT NULL
        THEN (
            SELECT (next_lact.calving_date - l.dry_date)::INTEGER
            FROM public.lactations next_lact
            WHERE next_lact.animal_id = l.animal_id
              AND next_lact.lactation_number = l.lactation_number + 1
            LIMIT 1
        )
        ELSE NULL
    END AS days_dry,

    -- ========================================================================
    -- BREEDING METRICS
    -- ========================================================================

    -- Times bred this lactation
    (SELECT COUNT(*)::INTEGER
     FROM public.events e
     WHERE e.animal_id = l.animal_id
       AND e.event_type = 'breeding'
       AND e.deleted_at IS NULL
       AND e.event_date >= l.calving_date
       AND (l.dry_date IS NULL OR e.event_date <= l.dry_date)
    ) AS times_bred,

    -- Services per conception (only if pregnant from this lactation)
    CASE
        WHEN a.conception_date IS NOT NULL
             AND a.conception_date >= l.calving_date
             AND (l.dry_date IS NULL OR a.conception_date <= l.dry_date)
        THEN (
            SELECT COUNT(*)::INTEGER
            FROM public.events e
            WHERE e.animal_id = l.animal_id
              AND e.event_type = 'breeding'
              AND e.deleted_at IS NULL
              AND e.event_date >= l.calving_date
              AND e.event_date <= a.conception_date
        )
        ELSE NULL
    END AS services_per_conception,

    -- ========================================================================
    -- PRODUCTION METRICS
    -- ========================================================================

    -- Total milk (kg)
    l.total_milk_kg,

    -- Total fat (kg) - calculated from average
    CASE
        WHEN l.avg_fat_percent IS NOT NULL AND l.total_milk_kg IS NOT NULL
        THEN ROUND((l.total_milk_kg * l.avg_fat_percent / 100)::NUMERIC, 2)
        ELSE NULL
    END AS total_fat_kg,

    -- Total protein (kg) - calculated from average
    CASE
        WHEN l.avg_protein_percent IS NOT NULL AND l.total_milk_kg IS NOT NULL
        THEN ROUND((l.total_milk_kg * l.avg_protein_percent / 100)::NUMERIC, 2)
        ELSE NULL
    END AS total_protein_kg,

    -- Average components
    l.avg_fat_percent,
    l.avg_protein_percent,
    l.avg_scc,

    -- Peak milk
    l.peak_milk_kg,
    l.peak_dim,

    -- ========================================================================
    -- CALCULATED 305ME
    -- ========================================================================

    -- 305-day Mature Equivalent (pre-calculated)
    COALESCE(
        l.me_305_milk,
        public.calculate_305me(l.animal_id, l.lactation_number)
    ) AS calculated_305me,

    l.me_305_fat,
    l.me_305_protein,

    -- ========================================================================
    -- METADATA
    -- ========================================================================

    l.created_at,
    l.updated_at,

    -- Is this the current lactation?
    (l.lactation_number = a.current_lactation) AS is_current

FROM public.lactations l
JOIN public.animals a ON a.id = l.animal_id
WHERE a.deleted_at IS NULL;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup indexes
CREATE UNIQUE INDEX idx_lactation_summaries_id
    ON public.lactation_summaries(lactation_id);

CREATE INDEX idx_lactation_summaries_animal
    ON public.lactation_summaries(animal_id, lactation_number);

CREATE INDEX idx_lactation_summaries_tenant
    ON public.lactation_summaries(tenant_id);

-- Query optimization indexes
CREATE INDEX idx_lactation_summaries_current
    ON public.lactation_summaries(tenant_id, is_current)
    WHERE is_current = true;

CREATE INDEX idx_lactation_summaries_305me
    ON public.lactation_summaries(tenant_id, calculated_305me DESC NULLS LAST);

CREATE INDEX idx_lactation_summaries_calving_date
    ON public.lactation_summaries(tenant_id, calving_date DESC);

-- ============================================================================
-- REFRESH POLICIES
-- ============================================================================

-- Manual refresh function (callable from application)
CREATE OR REPLACE FUNCTION public.refresh_lactation_summaries()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.lactation_summaries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.refresh_lactation_summaries IS
'Refreshes lactation_summaries materialized view. Call after bulk data changes.';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.lactation_summaries TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_lactation_summaries() TO authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON MATERIALIZED VIEW public.lactation_summaries IS
'Pre-calculated lactation metrics including DIM, days_open, times_bred, production totals, and 305ME. Refresh nightly or after bulk updates.';

-- ============================================================================
-- TRIGGER TO AUTO-REFRESH ON LACTATION CHANGES
-- ============================================================================

-- Function to schedule refresh after lactation updates
CREATE OR REPLACE FUNCTION public.lactation_changed_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Set a flag or queue a job to refresh the MV
    -- For now, we'll rely on manual/scheduled refresh
    -- In production, integrate with pg_cron or application scheduler
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on lactations table (optional - may impact write performance)
-- CREATE TRIGGER trigger_lactation_changed
--     AFTER INSERT OR UPDATE OR DELETE ON public.lactations
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION public.lactation_changed_trigger();

-- ============================================================================
-- INITIAL REFRESH
-- ============================================================================

-- Populate the materialized view on first run
REFRESH MATERIALIZED VIEW public.lactation_summaries;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    COUNT(*) AS total_lactations,
    COUNT(*) FILTER (WHERE is_current = true) AS current_lactations,
    ROUND(AVG(calculated_305me), 2) AS avg_305me
FROM public.lactation_summaries;

SELECT 'Lactation summaries materialized view created successfully!' AS status;
