-- HerdMaster Pro - Development Seed Data
-- Run after migrations: psql $DATABASE_URL -f seed/development.sql

-- Create test tenant
INSERT INTO public.tenants (id, name, slug, tier, limits)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo Farm',
    'demo-farm',
    'professional',
    '{"animals": 500, "users": 10}'
) ON CONFLICT (slug) DO NOTHING;

-- Create barns
INSERT INTO public.barns (id, tenant_id, name, barn_type, capacity)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Barn 1 - Milking', 'milking', 200),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Barn 2 - Dry', 'dry', 100),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Barn 3 - Heifers', 'heifer', 150)
ON CONFLICT DO NOTHING;

-- Create pens
INSERT INTO public.pens (id, tenant_id, barn_id, name, pen_type, capacity)
VALUES
    ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pen 1A - High Producers', 'lactating', 50),
    ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pen 1B - Mid Producers', 'lactating', 50),
    ('33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pen 1C - Fresh Cows', 'fresh', 30),
    ('44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Pen 2A - Dry Cows', 'dry', 50),
    ('55555555-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pen 3A - Breeding Heifers', 'breeding', 75)
ON CONFLICT DO NOTHING;

-- Create sample animals
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score
)
VALUES
    -- Lactating cows in Pen 1A
    ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '1001', '2020-03-15', 'Holstein', 'female', 'lactating', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2024-01-10', 42.5, 3.25),
    ('a0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '1002', '2019-07-22', 'Holstein', 'female', 'lactating', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, '2024-02-05', 38.2, 3.0),
    ('a0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '1003', '2021-01-08', 'Holstein', 'female', 'lactating', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '2024-03-20', 45.8, 3.5),

    -- Fresh cows in Pen 1C
    ('a0000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '1004', '2020-11-30', 'Holstein', 'female', 'fresh', '33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2025-01-05', 35.0, 2.75),
    ('a0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '1005', '2021-05-12', 'Brown Swiss', 'female', 'fresh', '33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '2025-01-12', 32.5, 3.0),

    -- Dry cows in Pen 2A
    ('a0000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '1006', '2019-04-18', 'Holstein', 'female', 'dry', '44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, '2024-05-15', NULL, 3.75),
    ('a0000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '1007', '2020-08-25', 'Holstein', 'female', 'dry', '44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, '2024-06-01', NULL, 3.5),

    -- Heifers in Pen 3A
    ('a0000008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '1008', '2023-02-14', 'Holstein', 'female', 'heifer', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, 3.0),
    ('a0000009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', '1009', '2023-04-22', 'Holstein', 'female', 'heifer', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, 3.25),
    ('a0000010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', '1010', '2023-06-08', 'Brown Swiss', 'female', 'heifer', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, 3.0)
ON CONFLICT DO NOTHING;

-- Create sample events
INSERT INTO public.events (tenant_id, animal_id, event_type, event_date, details)
VALUES
    -- Calving events
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', 'calving', '2024-01-10', '{"calf_sex": "female", "calf_ear_tag": "2001", "calving_ease": 1}'),
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', 'calving', '2024-02-05', '{"calf_sex": "male", "calf_ear_tag": "2002", "calving_ease": 2}'),

    -- Breeding events
    ('11111111-1111-1111-1111-111111111111', 'a0000008-0000-0000-0000-000000000008', 'breeding', '2025-01-05', '{"sire_id": "HOUSA000123456789", "technician": "Ivan", "breeding_type": "AI"}'),
    ('11111111-1111-1111-1111-111111111111', 'a0000009-0000-0000-0000-000000000009', 'heat', '2025-01-10', '{"detection_method": "visual", "intensity": "strong"}'),

    -- Health events
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', 'treatment', '2025-01-08', '{"diagnosis": "mild_mastitis", "treatment": "Ceftiofur", "withdrawal_days": 3}')
ON CONFLICT DO NOTHING;

-- Create sample lactations
INSERT INTO public.lactations (
    tenant_id, animal_id, lactation_number, calving_date,
    days_in_milk, total_milk_kg, me_305_milk, avg_fat_percent, avg_protein_percent
)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', 2, '2022-12-20', 305, 12500, 13200, 3.8, 3.2),
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', 3, '2023-01-15', 305, 11800, 12400, 3.6, 3.1),
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', 1, '2023-02-28', 305, 10200, 11500, 3.9, 3.3)
ON CONFLICT DO NOTHING;

SELECT 'Seed data loaded successfully!' AS status;
