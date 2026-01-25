-- HerdMaster Pro - Calculated Fields Expansion
-- Extends animals_with_calculated view from 6 to 26 fields
-- Phase 1: Critical calculated fields for DairyComp 305 parity

-- ============================================================================
-- DROP EXISTING VIEW
-- ============================================================================

DROP VIEW IF EXISTS public.animals_with_calculated CASCADE;

-- ============================================================================
-- EXPANDED VIEW WITH 26 CALCULATED FIELDS
-- ============================================================================

CREATE OR REPLACE VIEW public.animals_with_calculated AS
SELECT
    a.*,

    -- ========================================================================
    -- EXISTING FIELDS (6) - Preserved from 007_calculated_fields_view.sql
    -- ========================================================================

    -- DIM: Days in Milk (days since last calving)
    CASE
        WHEN a.last_calving_date IS NOT NULL AND a.current_status = 'milking'
        THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_calving_date))::INTEGER
        ELSE NULL
    END AS dim,

    -- DCC: Days Carrying Calf (days until expected calving for pregnant cows)
    -- Assuming 280 day gestation from conception_date
    CASE
        WHEN a.conception_date IS NOT NULL AND a.reproductive_status IN ('preg', 'dry')
        THEN 280 - EXTRACT(DAY FROM (CURRENT_DATE - a.conception_date))::INTEGER
        ELSE NULL
    END AS dcc,

    -- AGE: Age in months
    CASE
        WHEN a.birth_date IS NOT NULL
        THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.birth_date))::INTEGER * 12 +
             EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.birth_date))::INTEGER
        ELSE NULL
    END AS age_months,

    -- DOPN: Days Open (days since calving for non-pregnant cows)
    CASE
        WHEN a.last_calving_date IS NOT NULL
             AND a.reproductive_status NOT IN ('preg', 'dry', 'blank')
        THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_calving_date))::INTEGER
        ELSE NULL
    END AS days_open,

    -- DSLH: Days Since Last Heat
    CASE
        WHEN a.last_heat_date IS NOT NULL
        THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_heat_date))::INTEGER
        ELSE NULL
    END AS days_since_last_heat,

    -- DSLB: Days Since Last Breeding
    CASE
        WHEN a.last_breeding_date IS NOT NULL
        THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_breeding_date))::INTEGER
        ELSE NULL
    END AS days_since_last_breeding,

    -- ========================================================================
    -- NEW FIELDS (20) - Phase 1 Critical Additions
    -- ========================================================================

    -- DUE: Days until expected calving (negative = overdue)
    CASE
        WHEN a.expected_calving_date IS NOT NULL
        THEN (a.expected_calving_date - CURRENT_DATE)::INTEGER
        ELSE NULL
    END AS due,

    -- DDRY: Days dry (days since dry date)
    CASE
        WHEN a.current_status = 'dry' AND a.dry_date IS NOT NULL
        THEN EXTRACT(DAY FROM (CURRENT_DATE - a.dry_date))::INTEGER
        ELSE NULL
    END AS ddry,

    -- AGEFR: Age at first calving (months)
    first_lact.age_at_first_calving AS agefr,

    -- TBRD: Times bred this lactation
    breed_count.times_bred AS tbrd,

    -- LGSCC: Log base-10 of SCC (milk quality metric)
    CASE
        WHEN a.last_scc > 0
        THEN ROUND(LOG(10, a.last_scc::NUMERIC), 2)
        ELSE NULL
    END AS lgscc,

    -- FCM: Fat Corrected Milk (standardizes milk to 3.5% fat)
    -- Formula: FCM = milk_kg × (0.4324 + 0.1625 × fat_%)
    CASE
        WHEN a.last_milk_kg IS NOT NULL AND a.last_fat_percent IS NOT NULL
        THEN ROUND((a.last_milk_kg * (0.4324 + 0.1625 * a.last_fat_percent))::NUMERIC, 2)
        ELSE NULL
    END AS fcm,

    -- HINT: Heat interval (days between last two heat events)
    heat_interval.interval_days AS hint,

    -- ========================================================================
    -- LACTATION TOTALS & 305ME (from lactations table)
    -- ========================================================================

    -- TOTM: Total milk this lactation (kg)
    curr_lact.total_milk_kg AS totm,

    -- TOTF: Total fat this lactation (kg)
    curr_lact.total_fat_kg AS totf,

    -- TOTP: Total protein this lactation (kg)
    curr_lact.total_protein_kg AS totp,

    -- 305ME: 305-day Mature Equivalent milk
    curr_lact.me_305_milk AS "305me",

    -- ========================================================================
    -- PREVIOUS LACTATION METRICS (from lactations table)
    -- ========================================================================

    -- PDIM: Previous lactation DIM (days in milk)
    prev_lact.days_in_milk AS pdim,

    -- PDOPN: Previous lactation days open
    prev_lact.days_open AS pdopn,

    -- PTBRD: Previous lactation times bred
    prev_lact.times_bred AS ptbrd,

    -- PTOTM: Previous lactation total milk
    prev_lact.total_milk_kg AS ptotm,

    -- PTOTF: Previous lactation total fat
    prev_lact.total_fat_kg AS ptotf,

    -- PTOTP: Previous lactation total protein
    prev_lact.total_protein_kg AS ptotp,

    -- ========================================================================
    -- REPRODUCTION - PREGNANT COWS
    -- ========================================================================

    -- DOPN_PREG: Days open at conception (for pregnant/dry cows)
    CASE
        WHEN a.reproductive_status IN ('preg', 'dry')
             AND a.conception_date IS NOT NULL
             AND a.last_calving_date IS NOT NULL
        THEN (a.conception_date - a.last_calving_date)::INTEGER
        ELSE NULL
    END AS dopn_preg,

    -- SPC: Services per conception (for pregnant cows only)
    CASE
        WHEN a.reproductive_status IN ('preg', 'dry')
             AND a.conception_date IS NOT NULL
        THEN breed_preg_count.services_to_conception
        ELSE NULL
    END AS spc,

    -- ========================================================================
    -- BREEDING-SPECIFIC FIELDS (Phase 2)
    -- ========================================================================

    -- SIRC: Sire of conception (bull used for conception breeding)
    conception_sire.bull_id AS sirc,
    conception_sire.bull_name AS sirc_name,

    -- SIR1-4: Last 4 breeding bulls (as JSONB array)
    recent_sires.bull_ids AS recent_sire_ids,
    recent_sires.bull_names AS recent_sire_names,

    -- DCCP: DCC at pregnancy check (gestation days when pregnancy was confirmed)
    CASE
        WHEN a.pregnancy_confirmed_date IS NOT NULL
             AND a.conception_date IS NOT NULL
        THEN (a.pregnancy_confirmed_date - a.conception_date)::INTEGER
        ELSE NULL
    END AS dccp,

    -- CALF1-3: Recent calf IDs (as JSONB array)
    recent_calves.calf_ids AS recent_calf_ids,
    recent_calves.calf_ear_tags AS recent_calf_ear_tags,

    -- ========================================================================
    -- ECONOMIC/VALUATION FIELDS (Phase 4 - COWVAL)
    -- ========================================================================

    -- CWVAL: Total cow value
    cv.total_value,

    -- RELV: Relative value (percentage vs heifer baseline cost)
    cv.relative_value,

    -- PGVAL: Pregnancy value component
    cv.pregnancy_value,

    -- PRODV: Production value component
    cv.production_value,

    -- GENVAL: Genetic value component (placeholder for genomic data)
    cv.genetic_value,

    -- Age adjustment multiplier (used in valuation calculation)
    cv.age_adjustment

FROM public.animals a

-- ============================================================================
-- LATERAL JOINS for complex calculations
-- ============================================================================

-- Age at first calving
LEFT JOIN LATERAL (
    SELECT
        EXTRACT(YEAR FROM AGE(l.calving_date, a.birth_date))::INTEGER * 12 +
        EXTRACT(MONTH FROM AGE(l.calving_date, a.birth_date))::INTEGER AS age_at_first_calving
    FROM public.lactations l
    WHERE l.animal_id = a.id
      AND l.lactation_number = 1
    LIMIT 1
) first_lact ON true

-- Times bred this lactation (count breeding events)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS times_bred
    FROM public.events e
    WHERE e.animal_id = a.id
      AND e.event_type = 'breeding'
      AND (
          a.last_calving_date IS NULL
          OR e.event_date >= a.last_calving_date
      )
) breed_count ON true

-- Heat interval (days between last two heats)
LEFT JOIN LATERAL (
    SELECT
        (e1.event_date - e2.event_date)::INTEGER AS interval_days
    FROM public.events e1
    CROSS JOIN LATERAL (
        SELECT event_date
        FROM public.events
        WHERE animal_id = a.id
          AND event_type = 'heat'
          AND event_date < e1.event_date
        ORDER BY event_date DESC
        LIMIT 1
    ) e2
    WHERE e1.animal_id = a.id
      AND e1.event_type = 'heat'
    ORDER BY e1.event_date DESC
    LIMIT 1
) heat_interval ON true

-- Current lactation data
LEFT JOIN LATERAL (
    SELECT
        l.total_milk_kg,
        -- Calculate total fat kg from average
        CASE
            WHEN l.avg_fat_percent IS NOT NULL AND l.total_milk_kg IS NOT NULL
            THEN ROUND((l.total_milk_kg * l.avg_fat_percent / 100)::NUMERIC, 2)
            ELSE NULL
        END AS total_fat_kg,
        -- Calculate total protein kg from average
        CASE
            WHEN l.avg_protein_percent IS NOT NULL AND l.total_milk_kg IS NOT NULL
            THEN ROUND((l.total_milk_kg * l.avg_protein_percent / 100)::NUMERIC, 2)
            ELSE NULL
        END AS total_protein_kg,
        l.me_305_milk,
        l.days_in_milk,
        -- Calculate days open for current lactation
        CASE
            WHEN a.conception_date IS NOT NULL AND l.calving_date IS NOT NULL
            THEN (a.conception_date - l.calving_date)::INTEGER
            WHEN l.dry_date IS NOT NULL AND l.calving_date IS NOT NULL
            THEN (l.dry_date - l.calving_date)::INTEGER
            ELSE NULL
        END AS days_open,
        -- Calculate times bred for current lactation
        (SELECT COUNT(*)::INTEGER
         FROM public.events e
         WHERE e.animal_id = a.id
           AND e.event_type = 'breeding'
           AND e.event_date >= l.calving_date
           AND (l.dry_date IS NULL OR e.event_date <= l.dry_date)
        ) AS times_bred
    FROM public.lactations l
    WHERE l.animal_id = a.id
      AND l.lactation_number = a.current_lactation
    LIMIT 1
) curr_lact ON true

-- Previous lactation data
LEFT JOIN LATERAL (
    SELECT
        l.days_in_milk,
        -- Calculate days open for previous lactation
        CASE
            WHEN l.dry_date IS NOT NULL AND l.calving_date IS NOT NULL
            THEN (l.dry_date - l.calving_date)::INTEGER
            ELSE NULL
        END AS days_open,
        -- Calculate times bred for previous lactation
        (SELECT COUNT(*)::INTEGER
         FROM public.events e
         WHERE e.animal_id = a.id
           AND e.event_type = 'breeding'
           AND e.event_date >= l.calving_date
           AND (l.dry_date IS NULL OR e.event_date <= l.dry_date)
        ) AS times_bred,
        l.total_milk_kg,
        -- Calculate total fat kg from average
        CASE
            WHEN l.avg_fat_percent IS NOT NULL AND l.total_milk_kg IS NOT NULL
            THEN ROUND((l.total_milk_kg * l.avg_fat_percent / 100)::NUMERIC, 2)
            ELSE NULL
        END AS total_fat_kg,
        -- Calculate total protein kg from average
        CASE
            WHEN l.avg_protein_percent IS NOT NULL AND l.total_milk_kg IS NOT NULL
            THEN ROUND((l.total_milk_kg * l.avg_protein_percent / 100)::NUMERIC, 2)
            ELSE NULL
        END AS total_protein_kg
    FROM public.lactations l
    WHERE l.animal_id = a.id
      AND l.lactation_number = (a.current_lactation - 1)
    LIMIT 1
) prev_lact ON true

-- Services per conception (for pregnant cows)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS services_to_conception
    FROM public.events e
    WHERE e.animal_id = a.id
      AND e.event_type = 'breeding'
      AND a.conception_date IS NOT NULL
      AND a.last_calving_date IS NOT NULL
      AND e.event_date >= a.last_calving_date
      AND e.event_date <= a.conception_date
) breed_preg_count ON true

-- Sire of conception (bull that resulted in pregnancy)
LEFT JOIN LATERAL (
    SELECT
        e.details->>'bull_id' AS bull_id,
        e.details->>'bull_name' AS bull_name
    FROM public.events e
    WHERE e.animal_id = a.id
      AND e.event_type = 'breeding'
      AND a.conception_date IS NOT NULL
      AND e.event_date = a.conception_date
    LIMIT 1
) conception_sire ON true

-- Recent sires (last 4 breeding bulls)
LEFT JOIN LATERAL (
    SELECT
        jsonb_agg(e.details->>'bull_id' ORDER BY e.event_date DESC) AS bull_ids,
        jsonb_agg(e.details->>'bull_name' ORDER BY e.event_date DESC) AS bull_names
    FROM (
        SELECT details, event_date
        FROM public.events
        WHERE animal_id = a.id
          AND event_type = 'breeding'
        ORDER BY event_date DESC
        LIMIT 4
    ) e
) recent_sires ON true

-- Recent calves (last 3 offspring)
LEFT JOIN LATERAL (
    SELECT
        jsonb_agg(c.id ORDER BY c.birth_date DESC) AS calf_ids,
        jsonb_agg(c.ear_tag ORDER BY c.birth_date DESC) AS calf_ear_tags
    FROM (
        SELECT id, ear_tag, birth_date
        FROM public.animals
        WHERE dam_id = a.id
        ORDER BY birth_date DESC
        LIMIT 3
    ) c
) recent_calves ON true

-- Cow valuation (COWVAL fields from cow_valuations table)
LEFT JOIN public.cow_valuations cv ON cv.animal_id = a.id

WHERE a.deleted_at IS NULL;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.animals_with_calculated TO anon, authenticated, service_role;

-- Security invoker mode (RLS policies inherit from animals table)
ALTER VIEW public.animals_with_calculated SET (security_invoker = true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW public.animals_with_calculated IS
'Expanded calculated fields view: 32 DairyComp-compatible fields including DIM, DCC, AGE, DOPN, TBRD, LGSCC, FCM, 305ME, previous lactation metrics, breeding fields, and COWVAL economic valuations';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Calculated fields view expanded: 6 → 32 fields (including COWVAL)' AS status;
