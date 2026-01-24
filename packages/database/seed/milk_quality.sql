-- HerdMaster Pro - Milk Quality Seed Data
-- DHIA test results and bulk tank readings for development

-- ============================================================================
-- INSERT MILK TESTS - Last 3 months of test data
-- ============================================================================

DO $$
DECLARE
    v_animal RECORD;
    v_test_date DATE;
    v_dim INTEGER;
    v_milk_kg DECIMAL;
    v_fat_percent DECIMAL;
    v_protein_percent DECIMAL;
    v_scc INTEGER;
    v_test_number INTEGER;
BEGIN
    -- Generate test data for lactating cows
    FOR v_animal IN
        SELECT id, ear_tag, current_lactation, last_calving_date
        FROM public.animals
        WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
          AND current_status IN ('lactating', 'fresh')
          AND last_calving_date IS NOT NULL
          AND deleted_at IS NULL
        LIMIT 50 -- Limit to 50 cows for seed data
    LOOP
        v_test_number := 1;

        -- Generate 3 monthly tests (90, 60, 30 days ago)
        FOR v_test_date IN
            SELECT CURRENT_DATE - (days || ' days')::INTERVAL::DATE
            FROM unnest(ARRAY[90, 60, 30]) AS days
        LOOP
            -- Calculate DIM at test date
            v_dim := v_test_date - v_animal.last_calving_date;

            -- Skip if DIM is negative or > 365
            IF v_dim < 0 OR v_dim > 365 THEN
                CONTINUE;
            END IF;

            -- Generate milk yield based on lactation curve (peak at ~60 DIM)
            IF v_dim < 60 THEN
                v_milk_kg := 25 + (v_dim / 60.0) * 15 + (random() * 5 - 2.5);
            ELSIF v_dim < 150 THEN
                v_milk_kg := 40 - ((v_dim - 60) / 90.0) * 8 + (random() * 4 - 2);
            ELSE
                v_milk_kg := 32 - ((v_dim - 150) / 215.0) * 10 + (random() * 4 - 2);
            END IF;

            -- Ensure positive milk
            v_milk_kg := GREATEST(v_milk_kg, 15);

            -- Generate fat % (3.5-4.5%, higher in early and late lactation)
            IF v_dim < 30 OR v_dim > 250 THEN
                v_fat_percent := 4.0 + (random() * 0.8 - 0.4);
            ELSE
                v_fat_percent := 3.7 + (random() * 0.6 - 0.3);
            END IF;

            -- Generate protein % (3.0-3.6%, similar pattern to fat)
            IF v_dim < 30 OR v_dim > 250 THEN
                v_protein_percent := 3.4 + (random() * 0.4 - 0.2);
            ELSE
                v_protein_percent := 3.2 + (random() * 0.4 - 0.2);
            END IF;

            -- Generate SCC (80% normal <200k, 15% elevated 200-400k, 5% high >400k)
            DECLARE
                v_scc_category DECIMAL := random();
            BEGIN
                IF v_scc_category < 0.80 THEN
                    -- Normal: 50k - 180k
                    v_scc := 50000 + (random() * 130000)::INTEGER;
                ELSIF v_scc_category < 0.95 THEN
                    -- Elevated (subclinical mastitis): 200k - 400k
                    v_scc := 200000 + (random() * 200000)::INTEGER;
                ELSE
                    -- High (clinical mastitis risk): 400k - 1000k
                    v_scc := 400000 + (random() * 600000)::INTEGER;
                END IF;
            END;

            -- Insert test record
            INSERT INTO public.milk_tests (
                tenant_id, animal_id, test_date, test_number,
                dim, lactation_number,
                milk_kg, fat_percent, protein_percent, scc,
                fat_kg, protein_kg,
                mun, bhn,
                fat_protein_ratio, energy_corrected_milk,
                lab_name, sample_id
            ) VALUES (
                '11111111-1111-1111-1111-111111111111',
                v_animal.id,
                v_test_date,
                v_test_number,
                v_dim,
                v_animal.current_lactation,
                ROUND(v_milk_kg, 2),
                ROUND(v_fat_percent, 2),
                ROUND(v_protein_percent, 2),
                v_scc,
                ROUND(v_milk_kg * v_fat_percent / 100, 2), -- fat_kg
                ROUND(v_milk_kg * v_protein_percent / 100, 2), -- protein_kg
                ROUND(12 + (random() * 8 - 4), 1), -- MUN: 8-20 mg/dL
                (600 + (random() * 400 - 200))::INTEGER, -- BHN: 400-1000 (normal <1200)
                ROUND(v_fat_percent / v_protein_percent, 2), -- F:P ratio
                public.calculate_ecm(v_milk_kg, v_fat_percent, v_protein_percent), -- ECM
                'DHIA Regional Lab',
                'SMPL-' || v_animal.ear_tag || '-' || TO_CHAR(v_test_date, 'YYMMDD')
            );

            v_test_number := v_test_number + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Milk tests inserted successfully';
END $$;

-- ============================================================================
-- INSERT BULK TANK READINGS - Daily pickups for last 30 days
-- ============================================================================

DO $$
DECLARE
    v_date DATE;
    v_time TIMESTAMPTZ;
    v_volume DECIMAL;
    v_fat DECIMAL;
    v_protein DECIMAL;
    v_scc INTEGER;
    v_price DECIMAL;
    v_day_of_week INTEGER;
BEGIN
    -- Generate daily tank readings for last 30 days
    FOR v_date IN
        SELECT CURRENT_DATE - (days || ' days')::INTERVAL::DATE
        FROM generate_series(0, 29) AS days
    LOOP
        v_day_of_week := EXTRACT(DOW FROM v_date);

        -- Skip Sundays (no pickup)
        IF v_day_of_week = 0 THEN
            CONTINUE;
        END IF;

        -- Pickup time: 6:00 AM
        v_time := v_date + INTERVAL '6 hours';

        -- Volume varies by day (higher on Mon/Wed/Fri - longer intervals)
        IF v_day_of_week IN (1, 3, 5) THEN
            v_volume := 3500 + (random() * 500 - 250); -- 3250-3750 liters
        ELSE
            v_volume := 1800 + (random() * 300 - 150); -- 1650-1950 liters
        END IF;

        -- Fat %: 3.7-4.1%
        v_fat := 3.85 + (random() * 0.4 - 0.2);

        -- Protein %: 3.2-3.5%
        v_protein := 3.35 + (random() * 0.3 - 0.15);

        -- Average SCC: mostly 150k-250k (good quality)
        v_scc := 150000 + (random() * 100000)::INTEGER;

        -- Occasionally spike to 300k (1 in 10 days)
        IF random() < 0.1 THEN
            v_scc := 280000 + (random() * 50000)::INTEGER;
        END IF;

        -- Price per liter: base $0.40 + quality bonuses
        v_price := 0.40;

        -- Bonus for low SCC (<200k): +$0.02
        IF v_scc < 200000 THEN
            v_price := v_price + 0.02;
        END IF;

        -- Bonus for high protein (>3.4%): +$0.01
        IF v_protein > 3.4 THEN
            v_price := v_price + 0.01;
        END IF;

        -- Bonus for high fat (>3.9%): +$0.01
        IF v_fat > 3.9 THEN
            v_price := v_price + 0.01;
        END IF;

        -- Penalty for high SCC (>250k): -$0.03
        IF v_scc > 250000 THEN
            v_price := v_price - 0.03;
        END IF;

        -- Insert tank reading
        INSERT INTO public.bulk_tank_readings (
            time, tenant_id,
            volume_liters, temperature,
            fat_percent, protein_percent, lactose_percent, solids_percent,
            scc_avg, bacteria_count, coliform_count,
            beta_lactam_test, tetracycline_test,
            truck_number, driver_name, destination,
            price_per_liter, total_value
        ) VALUES (
            v_time,
            '11111111-1111-1111-1111-111111111111',
            ROUND(v_volume, 2),
            ROUND(3.5 + (random() * 1.0 - 0.5), 1), -- Temp: 3.0-4.0°C
            ROUND(v_fat, 2),
            ROUND(v_protein, 2),
            ROUND(4.7 + (random() * 0.2 - 0.1), 2), -- Lactose: ~4.7%
            ROUND(12.5 + (random() * 0.5 - 0.25), 2), -- Solids: ~12.5%
            v_scc,
            (8000 + (random() * 4000 - 2000))::INTEGER, -- Bacteria: 6k-10k (excellent <10k)
            (5 + (random() * 10 - 5))::INTEGER, -- Coliform: 0-10 (excellent <10)
            'negative',
            'negative',
            'TRK-' || LPAD((1 + floor(random() * 3))::TEXT, 2, '0'), -- TRK-01, TRK-02, TRK-03
            CASE (floor(random() * 3))::INTEGER
                WHEN 0 THEN 'John Smith'
                WHEN 1 THEN 'Mike Johnson'
                ELSE 'Dave Williams'
            END,
            'ABC Dairy Processor',
            ROUND(v_price, 3),
            ROUND(v_volume * v_price, 2)
        );
    END LOOP;

    RAISE NOTICE 'Bulk tank readings inserted successfully';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify milk tests
SELECT
    DATE_TRUNC('month', test_date) as month,
    COUNT(*) as test_count,
    ROUND(AVG(milk_kg), 1) as avg_milk,
    ROUND(AVG(fat_percent), 2) as avg_fat,
    ROUND(AVG(protein_percent), 2) as avg_protein,
    ROUND(AVG(scc)) as avg_scc,
    COUNT(*) FILTER (WHERE scc > 200000) as high_scc_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE scc > 200000) / COUNT(*), 1) as pct_high_scc
FROM public.milk_tests
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND deleted_at IS NULL
GROUP BY DATE_TRUNC('month', test_date)
ORDER BY month DESC;

-- Verify bulk tank readings
SELECT
    DATE_TRUNC('week', time) as week,
    COUNT(*) as pickup_count,
    ROUND(SUM(volume_liters), 0) as total_volume,
    ROUND(AVG(fat_percent), 2) as avg_fat,
    ROUND(AVG(protein_percent), 2) as avg_protein,
    ROUND(AVG(scc_avg)) as avg_scc,
    ROUND(AVG(price_per_liter), 3) as avg_price,
    ROUND(SUM(total_value), 2) as total_revenue
FROM public.bulk_tank_readings
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
GROUP BY DATE_TRUNC('week', time)
ORDER BY week DESC;

-- Check animals with high SCC
SELECT * FROM public.get_animals_with_high_scc(
    '11111111-1111-1111-1111-111111111111',
    200000
)
LIMIT 10;

SELECT '✅ Milk quality seed data loaded successfully!' AS status;
