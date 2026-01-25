-- HerdMaster Pro - Breeding Outcomes Analysis VIEW
-- Enables comprehensive breeding performance reporting (BREDSUM)
-- Phase 2: Breeding analysis and reproduction metrics

-- ============================================================================
-- BREEDING OUTCOMES VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.breeding_outcomes AS
SELECT
    e.id AS breeding_event_id,
    e.animal_id,
    e.event_date AS breeding_date,
    e.details->>'bull_id' AS bull_id,
    e.details->>'bull_name' AS bull_name,
    e.details->>'technician_id' AS technician_id,
    e.details->>'technician_name' AS technician_name,
    e.details->>'insemination_type' AS insemination_type, -- 'AI', 'natural', 'ET'

    -- Animal info at breeding
    a.ear_tag,
    a.pen_id,
    a.lactation_number,
    a.reproductive_status,

    -- Calculate DIM at breeding
    CASE WHEN a.last_calving_date IS NOT NULL
         THEN (e.event_date - a.last_calving_date)::INTEGER
         ELSE NULL END AS dim_at_breeding,

    -- Service number for this lactation
    (SELECT COUNT(*) FROM public.events e2
     WHERE e2.animal_id = e.animal_id
       AND e2.event_type = 'breeding'
       AND e2.event_date <= e.event_date
       AND (a.last_calving_date IS NULL OR e2.event_date >= a.last_calving_date)
    )::INTEGER AS service_number,

    -- Did this breeding result in pregnancy?
    CASE WHEN a.pregnancy_confirmed_date IS NOT NULL
              AND e.event_date <= a.pregnancy_confirmed_date
              AND (
                  -- Check if this is the last breeding before pregnancy
                  NOT EXISTS (
                      SELECT 1 FROM public.events e3
                      WHERE e3.animal_id = e.animal_id
                        AND e3.event_type = 'breeding'
                        AND e3.event_date > e.event_date
                        AND e3.event_date <= a.pregnancy_confirmed_date
                  )
              )
         THEN true
         ELSE false END AS resulted_in_pregnancy,

    -- Days to pregnancy check (from breeding to preg check event)
    (SELECT MIN(pc.event_date - e.event_date)
     FROM public.events pc
     WHERE pc.animal_id = e.animal_id
       AND pc.event_type = 'preg_check'
       AND pc.event_date > e.event_date
    )::INTEGER AS days_to_preg_check,

    -- Was pregnancy confirmed?
    EXISTS(
        SELECT 1 FROM public.events pc
        WHERE pc.animal_id = e.animal_id
          AND pc.event_type = 'preg_check'
          AND pc.event_date > e.event_date
          AND (pc.details->>'result')::TEXT = 'pregnant'
        LIMIT 1
    ) AS pregnancy_confirmed,

    -- Calendar info for grouping
    EXTRACT(YEAR FROM e.event_date)::INTEGER AS breeding_year,
    EXTRACT(MONTH FROM e.event_date)::INTEGER AS breeding_month,
    EXTRACT(DOW FROM e.event_date)::INTEGER AS breeding_day_of_week, -- 0=Sunday

    -- Timestamps
    e.created_at,
    e.tenant_id

FROM public.events e
JOIN public.animals a ON a.id = e.animal_id
WHERE e.event_type = 'breeding'
ORDER BY e.event_date DESC;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Cannot create indexes directly on views, but events table should have:
-- CREATE INDEX idx_events_breeding ON events(animal_id, event_date)
--   WHERE event_type = 'breeding';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.breeding_outcomes TO anon, authenticated, service_role;

-- Security invoker mode (RLS inherited from events and animals tables)
ALTER VIEW public.breeding_outcomes SET (security_invoker = true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW public.breeding_outcomes IS
'Comprehensive breeding analysis view for BREDSUM reports. Includes service number, pregnancy outcomes, bull/technician info, and calendar groupings.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    'breeding_outcomes view created' AS status,
    COUNT(*) AS total_breedings
FROM public.breeding_outcomes;
