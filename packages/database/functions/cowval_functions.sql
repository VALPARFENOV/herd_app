-- HerdMaster Pro - COWVAL Functions
-- Cow valuation system for economic analysis
-- Phase 4: Economics Module

-- ============================================================================
-- CALCULATE COW VALUE - Individual cow valuation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_cow_value(
    p_animal_id UUID
) RETURNS TABLE(
    production_value DECIMAL(10,2),
    pregnancy_value DECIMAL(10,2),
    genetic_value DECIMAL(10,2),
    age_adjustment DECIMAL(5,3),
    total_value DECIMAL(10,2),
    relative_value DECIMAL(5,2)
) AS $$
DECLARE
    v_tenant_id UUID;
    v_settings RECORD;
    v_animal RECORD;
    v_lactation RECORD;
    v_milk_value DECIMAL(10,2) := 0;
    v_preg_value DECIMAL(10,2) := 0;
    v_gen_value DECIMAL(10,2) := 0;
    v_age_mult DECIMAL(5,3) := 1.0;
    v_heifer_cost DECIMAL(10,2);
BEGIN
    -- Get animal and tenant info
    SELECT
        a.tenant_id,
        a.lactation_number,
        a.reproductive_status,
        a.pregnancy_confirmed_date,
        a.last_calving_date,
        a.last_milk_kg,
        a.birth_date
    INTO v_animal
    FROM public.animals a
    WHERE a.id = p_animal_id;

    v_tenant_id := v_animal.tenant_id;

    -- Get economic settings
    SELECT * INTO v_settings
    FROM public.economic_settings
    WHERE tenant_id = v_tenant_id;

    v_heifer_cost := COALESCE(v_settings.heifer_purchase_cost, 2000.00);

    -- Get lactation performance (305ME if available)
    SELECT
        l.calculated_305me,
        l.total_milk,
        l.dim
    INTO v_lactation
    FROM public.lactations l
    WHERE l.animal_id = p_animal_id
      AND l.lactation_number = v_animal.lactation_number
    ORDER BY l.lactation_number DESC
    LIMIT 1;

    -- ========================================================================
    -- 1. PRODUCTION VALUE
    -- ========================================================================
    -- Based on expected milk production value for next lactation

    IF v_lactation.calculated_305me IS NOT NULL THEN
        -- Use 305ME projection
        v_milk_value := (v_lactation.calculated_305me *
                        COALESCE(v_settings.milk_price_per_kg, 0.40) *
                        0.8); -- 80% of annual production value
    ELSIF v_animal.last_milk_kg IS NOT NULL THEN
        -- Estimate from current milk production
        v_milk_value := (v_animal.last_milk_kg * 305 *
                        COALESCE(v_settings.milk_price_per_kg, 0.40) *
                        0.7); -- 70% discount for estimate
    ELSE
        -- Default baseline value
        v_milk_value := v_heifer_cost * 0.5;
    END IF;

    -- ========================================================================
    -- 2. PREGNANCY VALUE
    -- ========================================================================
    -- Pregnant cows have additional value based on gestation progress

    IF v_animal.reproductive_status IN ('preg', 'dry')
       AND v_animal.pregnancy_confirmed_date IS NOT NULL THEN

        DECLARE
            v_dcc INTEGER;
            v_gestation_progress DECIMAL(5,3);
        BEGIN
            -- Calculate DCC (Days Carrying Calf)
            v_dcc := (CURRENT_DATE - v_animal.pregnancy_confirmed_date)::INTEGER;

            -- Gestation progress (0 to 1, max at 280 days)
            v_gestation_progress := LEAST(v_dcc / 280.0, 1.0);

            -- Pregnancy value: 30% of heifer cost at full term
            v_preg_value := v_heifer_cost * 0.30 * v_gestation_progress;
        END;
    ELSE
        v_preg_value := 0;
    END IF;

    -- ========================================================================
    -- 3. GENETIC VALUE
    -- ========================================================================
    -- Placeholder for genomic/pedigree data (future enhancement)

    v_gen_value := 0; -- Will be populated when genomic data available

    -- ========================================================================
    -- 4. AGE/LACTATION ADJUSTMENT
    -- ========================================================================
    -- Older cows depreciate in value

    v_age_mult := CASE
        WHEN v_animal.lactation_number <= 2 THEN 1.0    -- Prime productive years
        WHEN v_animal.lactation_number = 3 THEN 0.95    -- Slight discount
        WHEN v_animal.lactation_number = 4 THEN 0.85    -- 15% discount
        WHEN v_animal.lactation_number >= 5 THEN 0.70   -- 30% discount (cull candidates)
        ELSE 1.0
    END;

    -- Additional discount for very old cows (>8 years)
    IF v_animal.birth_date IS NOT NULL THEN
        DECLARE
            v_age_months INTEGER;
        BEGIN
            v_age_months := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_animal.birth_date))::INTEGER * 12 +
                           EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_animal.birth_date))::INTEGER;

            IF v_age_months > 96 THEN -- Over 8 years
                v_age_mult := v_age_mult * 0.8;
            END IF;
        END;
    END IF;

    -- ========================================================================
    -- 5. TOTAL VALUE CALCULATION
    -- ========================================================================

    production_value := v_milk_value;
    pregnancy_value := v_preg_value;
    genetic_value := v_gen_value;
    age_adjustment := v_age_mult;

    total_value := ((v_milk_value + v_preg_value + v_gen_value) * v_age_mult)::DECIMAL(10,2);

    -- Relative value as percentage of heifer cost
    relative_value := ((total_value / NULLIF(v_heifer_cost, 0)) * 100)::DECIMAL(5,2);

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_cow_value IS
'COWVAL: Calculate individual cow valuation based on production, pregnancy, genetics, and age';

GRANT EXECUTE ON FUNCTION public.calculate_cow_value TO authenticated, service_role;

-- ============================================================================
-- UPDATE ALL COW VALUATIONS - Batch update for all animals
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_cow_valuations(
    p_tenant_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_animal RECORD;
    v_valuation RECORD;
BEGIN
    -- Delete existing valuations for this tenant
    DELETE FROM public.cow_valuations
    WHERE tenant_id = p_tenant_id;

    -- Calculate and insert valuations for all active animals
    FOR v_animal IN
        SELECT id FROM public.animals
        WHERE tenant_id = p_tenant_id
          AND deleted_at IS NULL
          AND current_status IN ('milking', 'dry', 'bred', 'open')
    LOOP
        -- Get valuation
        SELECT * INTO v_valuation
        FROM public.calculate_cow_value(v_animal.id);

        -- Insert into cow_valuations table
        INSERT INTO public.cow_valuations (
            animal_id,
            tenant_id,
            production_value,
            pregnancy_value,
            genetic_value,
            age_adjustment,
            total_value,
            relative_value,
            valuation_date
        ) VALUES (
            v_animal.id,
            p_tenant_id,
            v_valuation.production_value,
            v_valuation.pregnancy_value,
            v_valuation.genetic_value,
            v_valuation.age_adjustment,
            v_valuation.total_value,
            v_valuation.relative_value,
            CURRENT_DATE
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_cow_valuations IS
'COWVAL: Batch update cow valuations for entire herd';

GRANT EXECUTE ON FUNCTION public.update_cow_valuations TO authenticated, service_role;

-- ============================================================================
-- GET COWVAL REPORT - Returns sorted list of cow valuations
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_cowval_report(
    p_tenant_id UUID,
    p_sort_by TEXT DEFAULT 'relative_value', -- 'total_value', 'relative_value', 'production_value'
    p_sort_desc BOOLEAN DEFAULT TRUE,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE(
    animal_id UUID,
    ear_tag TEXT,
    pen_name TEXT,
    lactation_number INTEGER,
    production_value DECIMAL(10,2),
    pregnancy_value DECIMAL(10,2),
    total_value DECIMAL(10,2),
    relative_value DECIMAL(5,2),
    age_adjustment DECIMAL(5,3),
    valuation_date DATE
) AS $$
DECLARE
    v_sort_column TEXT;
    v_sort_direction TEXT;
BEGIN
    -- Validate and set sort column
    v_sort_column := CASE p_sort_by
        WHEN 'total_value' THEN 'cv.total_value'
        WHEN 'relative_value' THEN 'cv.relative_value'
        WHEN 'production_value' THEN 'cv.production_value'
        ELSE 'cv.relative_value'
    END;

    v_sort_direction := CASE WHEN p_sort_desc THEN 'DESC' ELSE 'ASC' END;

    RETURN QUERY EXECUTE format(
        'SELECT
            cv.animal_id,
            a.ear_tag,
            COALESCE(p.name, ''Unknown'') AS pen_name,
            a.lactation_number,
            cv.production_value,
            cv.pregnancy_value,
            cv.total_value,
            cv.relative_value,
            cv.age_adjustment,
            cv.valuation_date
        FROM public.cow_valuations cv
        JOIN public.animals a ON a.id = cv.animal_id
        LEFT JOIN public.pens p ON p.id = a.pen_id
        WHERE cv.tenant_id = $1
          AND a.deleted_at IS NULL
        ORDER BY %s %s
        LIMIT $2',
        v_sort_column,
        v_sort_direction
    )
    USING p_tenant_id, p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_cowval_report IS
'COWVAL: Get sorted cow valuation report';

GRANT EXECUTE ON FUNCTION public.get_cowval_report TO authenticated, service_role;

-- ============================================================================
-- GET VALUATION SUMMARY - Herd-level statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_valuation_summary(
    p_tenant_id UUID
) RETURNS TABLE(
    total_cows INTEGER,
    avg_cow_value DECIMAL(10,2),
    median_cow_value DECIMAL(10,2),
    total_herd_value DECIMAL(12,2),
    avg_relative_value DECIMAL(5,2),
    high_value_count INTEGER,  -- RELV > 100%
    low_value_count INTEGER     -- RELV < 70%
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_cows,
        AVG(cv.total_value)::DECIMAL(10,2) AS avg_cow_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cv.total_value)::DECIMAL(10,2) AS median_cow_value,
        SUM(cv.total_value)::DECIMAL(12,2) AS total_herd_value,
        AVG(cv.relative_value)::DECIMAL(5,2) AS avg_relative_value,
        COUNT(*) FILTER (WHERE cv.relative_value > 100)::INTEGER AS high_value_count,
        COUNT(*) FILTER (WHERE cv.relative_value < 70)::INTEGER AS low_value_count
    FROM public.cow_valuations cv
    WHERE cv.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_valuation_summary IS
'COWVAL: Get herd-level valuation statistics';

GRANT EXECUTE ON FUNCTION public.get_valuation_summary TO authenticated, service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'COWVAL functions created: calculate_cow_value, update_cow_valuations, get_cowval_report, get_valuation_summary' AS status;
