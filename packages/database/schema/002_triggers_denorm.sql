-- HerdMaster Pro - Triggers for denormalized fields
-- Keeps last_* fields in animals table in sync with related tables

-- ============================================================================
-- MILK READINGS → animals.last_milk_*, last_test_date
-- ============================================================================

CREATE OR REPLACE FUNCTION update_animal_from_milk_reading()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.animals
    SET
        last_milk_kg = NEW.milk_yield_kg,
        last_test_date = NEW.time::date,
        updated_at = NOW()
    WHERE id = NEW.animal_id
      AND (last_test_date IS NULL OR last_test_date <= NEW.time::date);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Will be created after milk_readings table exists (in timescale migration)
-- CREATE TRIGGER trg_milk_reading_update_animal
-- AFTER INSERT ON public.milk_readings
-- FOR EACH ROW EXECUTE FUNCTION update_animal_from_milk_reading();

-- ============================================================================
-- EVENTS → animals (calving, breeding, heat, etc.)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_animal_from_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Calving event
    IF NEW.event_type = 'calving' THEN
        UPDATE public.animals
        SET
            last_calving_date = NEW.event_date,
            lactation_number = COALESCE(lactation_number, 0) + 1,
            current_status = 'fresh',
            reproductive_status = 'open',
            updated_at = NOW()
        WHERE id = NEW.animal_id;

    -- Heat detection
    ELSIF NEW.event_type = 'heat' THEN
        UPDATE public.animals
        SET
            last_heat_date = NEW.event_date,
            reproductive_status = 'heat',
            updated_at = NOW()
        WHERE id = NEW.animal_id;

    -- Breeding/insemination
    ELSIF NEW.event_type = 'breeding' THEN
        UPDATE public.animals
        SET
            last_breeding_date = NEW.event_date,
            reproductive_status = 'bred',
            updated_at = NOW()
        WHERE id = NEW.animal_id;

    -- Pregnancy confirmation
    ELSIF NEW.event_type = 'pregnancy_check' THEN
        IF (NEW.details->>'result')::text = 'pregnant' THEN
            UPDATE public.animals
            SET
                pregnancy_confirmed_date = NEW.event_date,
                reproductive_status = 'pregnant',
                expected_calving_date = last_breeding_date + INTERVAL '280 days',
                updated_at = NOW()
            WHERE id = NEW.animal_id;
        ELSE
            UPDATE public.animals
            SET
                reproductive_status = 'open',
                pregnancy_confirmed_date = NULL,
                expected_calving_date = NULL,
                updated_at = NOW()
            WHERE id = NEW.animal_id;
        END IF;

    -- Dry off
    ELSIF NEW.event_type = 'dry_off' THEN
        UPDATE public.animals
        SET
            current_status = 'dry',
            updated_at = NOW()
        WHERE id = NEW.animal_id;

    -- Vet check
    ELSIF NEW.event_type IN ('treatment', 'vaccination', 'examination') THEN
        UPDATE public.animals
        SET
            last_vet_check_date = NEW.event_date,
            updated_at = NOW()
        WHERE id = NEW.animal_id;

    -- BCS scoring
    ELSIF NEW.event_type = 'bcs' THEN
        UPDATE public.animals
        SET
            bcs_score = (NEW.details->>'score')::decimal,
            updated_at = NOW()
        WHERE id = NEW.animal_id;

    -- Sold/culled/dead
    ELSIF NEW.event_type IN ('sold', 'culled', 'death') THEN
        UPDATE public.animals
        SET
            current_status = NEW.event_type,
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.animal_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_update_animal
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION update_animal_from_event();

-- ============================================================================
-- LACTATIONS → animals (when lactation record is finalized)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_animal_from_lactation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update animal with latest lactation metrics
    IF NEW.me_305_milk IS NOT NULL THEN
        UPDATE public.animals
        SET
            last_fat_percent = NEW.avg_fat_percent,
            last_protein_percent = NEW.avg_protein_percent,
            last_scc = NEW.avg_scc,
            updated_at = NOW()
        WHERE id = NEW.animal_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lactation_update_animal
AFTER INSERT OR UPDATE ON public.lactations
FOR EACH ROW EXECUTE FUNCTION update_animal_from_lactation();

-- ============================================================================
-- STATUS TRANSITIONS (automatic based on DIM)
-- ============================================================================

-- This could be a scheduled job, but here's a function to call manually or via cron
CREATE OR REPLACE FUNCTION update_animal_statuses()
RETURNS void AS $$
BEGIN
    -- Fresh → Lactating (after 21 days)
    UPDATE public.animals
    SET current_status = 'lactating', updated_at = NOW()
    WHERE current_status = 'fresh'
      AND last_calving_date < CURRENT_DATE - INTERVAL '21 days';

    -- Auto dry-off reminder could trigger notifications (handled in app layer)
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER: Recalculate all denormalized fields for an animal
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_animal_metrics(p_animal_id UUID)
RETURNS void AS $$
DECLARE
    v_last_calving RECORD;
    v_last_breeding RECORD;
    v_last_heat RECORD;
    v_last_preg_check RECORD;
BEGIN
    -- Get last calving
    SELECT event_date INTO v_last_calving
    FROM public.events
    WHERE animal_id = p_animal_id AND event_type = 'calving'
    ORDER BY event_date DESC LIMIT 1;

    -- Get last breeding
    SELECT event_date INTO v_last_breeding
    FROM public.events
    WHERE animal_id = p_animal_id AND event_type = 'breeding'
    ORDER BY event_date DESC LIMIT 1;

    -- Get last heat
    SELECT event_date INTO v_last_heat
    FROM public.events
    WHERE animal_id = p_animal_id AND event_type = 'heat'
    ORDER BY event_date DESC LIMIT 1;

    -- Get last pregnancy check
    SELECT event_date, details INTO v_last_preg_check
    FROM public.events
    WHERE animal_id = p_animal_id AND event_type = 'pregnancy_check'
    ORDER BY event_date DESC LIMIT 1;

    -- Update animal
    UPDATE public.animals
    SET
        last_calving_date = v_last_calving.event_date,
        last_breeding_date = v_last_breeding.event_date,
        last_heat_date = v_last_heat.event_date,
        pregnancy_confirmed_date = CASE
            WHEN (v_last_preg_check.details->>'result')::text = 'pregnant'
            THEN v_last_preg_check.event_date
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = p_animal_id;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT recalculate_animal_metrics('animal-uuid-here');
