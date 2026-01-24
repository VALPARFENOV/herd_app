-- HerdMaster Pro - Milk Readings Seed Data
-- Generates realistic milk production data for last 60 days
-- Run after development.sql: psql $DATABASE_URL -f seed/milk_readings.sql

-- ============================================================================
-- HELPER FUNCTION: Generate milk readings for a cow
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_milk_readings_for_cow(
    p_tenant_id UUID,
    p_animal_id UUID,
    p_base_milk_kg DECIMAL,
    p_days INTEGER DEFAULT 60
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_date DATE;
    v_session VARCHAR(20);
    v_sessions TEXT[] := ARRAY['morning', 'afternoon', 'evening'];
    v_milk_kg DECIMAL;
    v_variation DECIMAL;
    v_time TIMESTAMPTZ;
BEGIN
    -- Loop through each day
    FOR i IN 0..(p_days - 1) LOOP
        v_date := CURRENT_DATE - i;

        -- Generate 3 milkings per day (morning, afternoon, evening)
        FOREACH v_session IN ARRAY v_sessions LOOP
            -- Calculate milk with some random variation (±15%)
            v_variation := (random() * 0.3 - 0.15);
            v_milk_kg := GREATEST(p_base_milk_kg * (1 + v_variation), 5.0);

            -- Set realistic time for each session
            v_time := CASE
                WHEN v_session = 'morning' THEN v_date + INTERVAL '6 hours'
                WHEN v_session = 'afternoon' THEN v_date + INTERVAL '14 hours'
                ELSE v_date + INTERVAL '20 hours'
            END;

            -- Add some time jitter (±30 minutes)
            v_time := v_time + (random() * INTERVAL '1 hour' - INTERVAL '30 minutes');

            -- Insert reading
            INSERT INTO public.milk_readings (
                time,
                tenant_id,
                animal_id,
                session_id,
                milk_kg,
                duration_seconds,
                avg_flow_rate,
                peak_flow_rate,
                conductivity,
                temperature,
                blood_detected,
                color_abnormal,
                source
            ) VALUES (
                v_time,
                p_tenant_id,
                p_animal_id,
                v_session,
                ROUND(v_milk_kg, 2),
                -- Duration: 5-8 minutes
                300 + FLOOR(random() * 180)::INTEGER,
                -- Flow rate based on milk amount (kg/min)
                ROUND((v_milk_kg / (5 + random() * 3)), 2),
                -- Peak flow slightly higher
                ROUND((v_milk_kg / (4 + random() * 2)), 2),
                -- Conductivity: normal is 5.0-5.5 mS/cm per quarter
                jsonb_build_object(
                    'LF', ROUND((5.0 + random() * 0.5)::NUMERIC, 2),
                    'LR', ROUND((5.0 + random() * 0.5)::NUMERIC, 2),
                    'RF', ROUND((5.0 + random() * 0.5)::NUMERIC, 2),
                    'RR', ROUND((5.0 + random() * 0.5)::NUMERIC, 2)
                ),
                -- Temperature: 35-38°C is normal
                ROUND((35.5 + random() * 2.5)::NUMERIC, 1),
                -- 1% chance of blood detection
                random() < 0.01,
                -- 0.5% chance of color abnormality
                random() < 0.005,
                CASE
                    WHEN random() < 0.7 THEN 'delaval'
                    WHEN random() < 0.9 THEN 'manual'
                    ELSE 'lely'
                END
            );
        END LOOP;
    END LOOP;
END;
$$;

-- ============================================================================
-- GENERATE DATA FOR ALL LACTATING COWS
-- ============================================================================

DO $$
DECLARE
    v_cow RECORD;
BEGIN
    -- Get all lactating and fresh cows from Demo Farm
    FOR v_cow IN
        SELECT
            id,
            tenant_id,
            ear_tag,
            last_milk_kg,
            current_status
        FROM public.animals
        WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
          AND current_status IN ('lactating', 'fresh')
    LOOP
        RAISE NOTICE 'Generating milk readings for cow %', v_cow.ear_tag;

        -- Generate readings with base milk from animal record
        -- If no last_milk_kg, use default based on status
        PERFORM generate_milk_readings_for_cow(
            v_cow.tenant_id,
            v_cow.id,
            COALESCE(v_cow.last_milk_kg,
                CASE
                    WHEN v_cow.current_status = 'fresh' THEN 30.0
                    ELSE 35.0
                END
            ),
            60  -- 60 days of history
        );
    END LOOP;

    RAISE NOTICE 'Milk readings generation complete!';
END $$;

-- ============================================================================
-- VERIFY DATA
-- ============================================================================

-- Check total records
SELECT
    COUNT(*) as total_readings,
    COUNT(DISTINCT animal_id) as cows_with_readings,
    MIN(time) as earliest_reading,
    MAX(time) as latest_reading,
    ROUND(AVG(milk_kg), 2) as avg_milk_kg
FROM public.milk_readings;

-- Check daily totals (should use continuous aggregate if already created)
SELECT
    time_bucket('1 day', time)::DATE as date,
    COUNT(DISTINCT animal_id) as cows_milked,
    COUNT(*) as total_milkings,
    ROUND(SUM(milk_kg), 2) as total_milk_kg,
    ROUND(AVG(milk_kg), 2) as avg_per_milking
FROM public.milk_readings
WHERE time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC
LIMIT 7;

-- Drop helper function (cleanup)
DROP FUNCTION IF EXISTS generate_milk_readings_for_cow;

SELECT '✅ Milk readings seed data loaded successfully!' AS status;
