-- Create view with calculated fields for DairyComp compatibility
-- This view adds DIM, DCC, AGE, DOPN and other calculated metrics

CREATE OR REPLACE VIEW public.animals_with_calculated AS
SELECT
    a.*,

    -- DIM: Days in Milk (days since last calving)
    CASE
        WHEN a.last_calving_date IS NOT NULL
        THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_calving_date))::INTEGER
        ELSE NULL
    END AS dim,

    -- DCC: Days to Calving (for pregnant cows)
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
    END AS days_since_last_breeding

FROM public.animals a;

-- Grant permissions
GRANT SELECT ON public.animals_with_calculated TO anon, authenticated, service_role;

-- Create RLS policies (inherit from animals table)
ALTER VIEW public.animals_with_calculated SET (security_invoker = true);

-- Comment
COMMENT ON VIEW public.animals_with_calculated IS 'Animals with calculated DairyComp fields (DIM, DCC, AGE, DOPN, DSLH, DSLB)';
