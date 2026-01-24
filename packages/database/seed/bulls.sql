-- HerdMaster Pro - Bulls & Semen Inventory Seed Data
-- Realistic bulls with genomic data and semen inventory

-- ============================================================================
-- INSERT BULLS - Popular Holstein and Jersey bulls
-- ============================================================================

-- Bull 1: High production Holstein
INSERT INTO public.bulls (
    tenant_id, registration_number, name, short_name, breed, naab_code, stud_code,
    genomic_data, net_merit_dollars, sire_calving_ease, daughter_calving_ease,
    semen_cost_per_straw, is_active, is_sexed
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USA 000007HO12345',
    'ROCKY-MOUNTAIN CHARL SUPERMAN',
    'SUPERMAN',
    'Holstein',
    '007HO12345',
    'ABS-123',
    '{"milk": 1450, "fat": 68, "protein": 52, "pl": 6.8, "scs": 2.78, "dpr": 2.1, "type": 2.5}',
    950.00,
    5.2,
    4.8,
    35.00,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Bull 2: Balanced Holstein
INSERT INTO public.bulls (
    tenant_id, registration_number, name, short_name, breed, naab_code, stud_code,
    genomic_data, net_merit_dollars, sire_calving_ease, daughter_calving_ease,
    semen_cost_per_straw, is_active, is_sexed
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USA 000029HO23456',
    'PINE-TREE ACHILLES',
    'ACHILLES',
    'Holstein',
    '029HO23456',
    'SELECT-456',
    '{"milk": 1200, "fat": 55, "protein": 45, "pl": 7.2, "scs": 2.65, "dpr": 2.8, "type": 3.1}',
    1050.00,
    4.8,
    4.2,
    40.00,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Bull 3: High protein Holstein
INSERT INTO public.bulls (
    tenant_id, registration_number, name, short_name, breed, naab_code, stud_code,
    genomic_data, net_merit_dollars, sire_calving_ease, daughter_calving_ease,
    semen_cost_per_straw, is_active, is_sexed
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USA 000145HO34567',
    'WESTCOAST DELTA CHROME',
    'CHROME',
    'Holstein',
    '145HO34567',
    'SEMEX-789',
    '{"milk": 1100, "fat": 48, "protein": 58, "pl": 6.5, "scs": 2.82, "dpr": 1.9, "type": 2.8}',
    920.00,
    5.5,
    5.1,
    32.00,
    true,
    false
) ON CONFLICT DO NOTHING;

-- Bull 4: Low SCC Holstein
INSERT INTO public.bulls (
    tenant_id, registration_number, name, short_name, breed, naab_code, stud_code,
    genomic_data, net_merit_dollars, sire_calving_ease, daughter_calving_ease,
    semen_cost_per_straw, is_active, is_sexed
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USA 000251HO45678',
    'SANDY-VALLEY TITANIUM',
    'TITANIUM',
    'Holstein',
    '251HO45678',
    'ABS-234',
    '{"milk": 1350, "fat": 62, "protein": 48, "pl": 5.9, "scs": 2.52, "dpr": 2.4, "type": 2.2}',
    980.00,
    4.9,
    4.5,
    38.00,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Bull 5: Jersey - High components
INSERT INTO public.bulls (
    tenant_id, registration_number, name, short_name, breed, naab_code, stud_code,
    genomic_data, net_merit_dollars, sire_calving_ease, daughter_calving_ease,
    semen_cost_per_straw, is_active, is_sexed
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USA 000068JE56789',
    'SUNSET-CANYON VOLCANO',
    'VOLCANO',
    'Jersey',
    '068JE56789',
    'JERSEY-123',
    '{"milk": 850, "fat": 95, "protein": 72, "pl": 5.5, "scs": 2.68, "dpr": 1.8, "type": 2.9}',
    720.00,
    3.2,
    2.8,
    28.00,
    true,
    false
) ON CONFLICT DO NOTHING;

-- Bull 6: Jersey - Fertility focus
INSERT INTO public.bulls (
    tenant_id, registration_number, name, short_name, breed, naab_code, stud_code,
    genomic_data, net_merit_dollars, sire_calving_ease, daughter_calving_ease,
    semen_cost_per_straw, is_active, is_sexed
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USA 000142JE67890',
    'GOLDEN-OAKS FERRARI',
    'FERRARI',
    'Jersey',
    '142JE67890',
    'SELECT-567',
    '{"milk": 780, "fat": 88, "protein": 68, "pl": 6.8, "scs": 2.75, "dpr": 3.2, "type": 3.2}',
    690.00,
    2.9,
    2.5,
    25.00,
    true,
    false
) ON CONFLICT DO NOTHING;

-- Bull 7: Inactive Holstein (for testing)
INSERT INTO public.bulls (
    tenant_id, registration_number, name, short_name, breed, naab_code, stud_code,
    genomic_data, net_merit_dollars, sire_calving_ease, daughter_calving_ease,
    semen_cost_per_straw, is_active, is_sexed, notes
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'USA 000088HO11111',
    'OLD-TIMER LEGACY',
    'LEGACY',
    'Holstein',
    '088HO11111',
    'ABS-OLD',
    '{"milk": 900, "fat": 40, "protein": 35, "pl": 4.5, "scs": 3.05, "dpr": 1.2, "type": 1.8}',
    650.00,
    6.2,
    5.8,
    15.00,
    false,
    false,
    'Discontinued - low fertility'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSERT SEMEN INVENTORY
-- ============================================================================

-- Get bull IDs for inventory
DO $$
DECLARE
    v_superman_id UUID;
    v_achilles_id UUID;
    v_chrome_id UUID;
    v_titanium_id UUID;
    v_volcano_id UUID;
    v_ferrari_id UUID;
BEGIN
    -- Get bull IDs
    SELECT id INTO v_superman_id FROM public.bulls WHERE short_name = 'SUPERMAN' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_achilles_id FROM public.bulls WHERE short_name = 'ACHILLES' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_chrome_id FROM public.bulls WHERE short_name = 'CHROME' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_titanium_id FROM public.bulls WHERE short_name = 'TITANIUM' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_volcano_id FROM public.bulls WHERE short_name = 'VOLCANO' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_ferrari_id FROM public.bulls WHERE short_name = 'FERRARI' AND tenant_id = '11111111-1111-1111-1111-111111111111';

    -- SUPERMAN - 3 batches
    INSERT INTO public.semen_inventory (tenant_id, bull_id, batch_number, straws_received, straws_used, received_date, expiry_date, cost_per_straw, total_cost, tank_number, canister_number)
    VALUES
        ('11111111-1111-1111-1111-111111111111', v_superman_id, 'SUP-2024-001', 50, 12, '2024-06-15', '2029-06-15', 35.00, 1750.00, 'T1', 'C3'),
        ('11111111-1111-1111-1111-111111111111', v_superman_id, 'SUP-2024-002', 50, 8, '2024-09-20', '2029-09-20', 35.00, 1750.00, 'T1', 'C4'),
        ('11111111-1111-1111-1111-111111111111', v_superman_id, 'SUP-2025-001', 50, 3, '2025-01-10', '2030-01-10', 35.00, 1750.00, 'T1', 'C5');

    -- ACHILLES - 2 batches
    INSERT INTO public.semen_inventory (tenant_id, bull_id, batch_number, straws_received, straws_used, received_date, expiry_date, cost_per_straw, total_cost, tank_number, canister_number)
    VALUES
        ('11111111-1111-1111-1111-111111111111', v_achilles_id, 'ACH-2024-003', 40, 15, '2024-07-10', '2029-07-10', 40.00, 1600.00, 'T1', 'C6'),
        ('11111111-1111-1111-1111-111111111111', v_achilles_id, 'ACH-2024-004', 40, 5, '2024-11-05', '2029-11-05', 40.00, 1600.00, 'T1', 'C7');

    -- CHROME - 1 batch (low inventory - should trigger alert)
    INSERT INTO public.semen_inventory (tenant_id, bull_id, batch_number, straws_received, straws_used, received_date, expiry_date, cost_per_straw, total_cost, tank_number, canister_number)
    VALUES
        ('11111111-1111-1111-1111-111111111111', v_chrome_id, 'CHR-2024-002', 25, 18, '2024-08-22', '2029-08-22', 32.00, 800.00, 'T2', 'C1');

    -- TITANIUM - 2 batches
    INSERT INTO public.semen_inventory (tenant_id, bull_id, batch_number, straws_received, straws_used, received_date, expiry_date, cost_per_straw, total_cost, tank_number, canister_number)
    VALUES
        ('11111111-1111-1111-1111-111111111111', v_titanium_id, 'TIT-2024-001', 30, 10, '2024-05-18', '2029-05-18', 38.00, 1140.00, 'T2', 'C2'),
        ('11111111-1111-1111-1111-111111111111', v_titanium_id, 'TIT-2024-002', 30, 4, '2024-10-12', '2029-10-12', 38.00, 1140.00, 'T2', 'C3');

    -- VOLCANO - 1 batch
    INSERT INTO public.semen_inventory (tenant_id, bull_id, batch_number, straws_received, straws_used, received_date, expiry_date, cost_per_straw, total_cost, tank_number, canister_number)
    VALUES
        ('11111111-1111-1111-1111-111111111111', v_volcano_id, 'VOL-2024-003', 35, 8, '2024-09-05', '2029-09-05', 28.00, 980.00, 'T2', 'C4');

    -- FERRARI - 1 batch
    INSERT INTO public.semen_inventory (tenant_id, bull_id, batch_number, straws_received, straws_used, received_date, expiry_date, cost_per_straw, total_cost, tank_number, canister_number)
    VALUES
        ('11111111-1111-1111-1111-111111111111', v_ferrari_id, 'FER-2024-001', 30, 12, '2024-07-28', '2029-07-28', 25.00, 750.00, 'T2', 'C5');
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check bulls
SELECT
    breed,
    COUNT(*) as total_bulls,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_bulls
FROM public.bulls
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND deleted_at IS NULL
GROUP BY breed
ORDER BY breed;

-- Check inventory
SELECT
    b.short_name,
    COUNT(*) as batches,
    SUM(si.straws_received) as total_received,
    SUM(si.straws_used) as total_used,
    SUM(si.straws_available) as total_available
FROM public.semen_inventory si
JOIN public.bulls b ON si.bull_id = b.id
WHERE si.tenant_id = '11111111-1111-1111-1111-111111111111'
  AND si.deleted_at IS NULL
GROUP BY b.short_name
ORDER BY total_available DESC;

-- Bulls with low inventory (<10 straws)
SELECT
    b.short_name,
    b.breed,
    SUM(si.straws_available) as available_straws,
    b.semen_cost_per_straw
FROM public.bulls b
LEFT JOIN public.semen_inventory si ON b.id = si.bull_id AND si.deleted_at IS NULL
WHERE b.tenant_id = '11111111-1111-1111-1111-111111111111'
  AND b.is_active = true
  AND b.deleted_at IS NULL
GROUP BY b.id, b.short_name, b.breed, b.semen_cost_per_straw
HAVING SUM(si.straws_available) < 10
ORDER BY available_straws;

SELECT '✅ Bulls and semen inventory seed data loaded successfully!' AS status;
