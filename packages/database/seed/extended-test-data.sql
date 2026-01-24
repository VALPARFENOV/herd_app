-- Extended Test Data for RC Code Testing
-- Adds more animals to cover all RC codes (0-8)
-- Run after development.sql

-- RC=0 (BLANK) - Young heifers, no breeding status yet
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000011-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', '1011', '2024-03-15', 'Holstein', 'female', 'heifer', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, 2.5, 'blank'),
    ('a0000012-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', '1012', '2024-04-20', 'Holstein', 'female', 'heifer', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, 2.75, 'blank'),
    ('a0000013-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111', '1013', '2024-05-10', 'Brown Swiss', 'female', 'heifer', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, 2.5, 'blank')
ON CONFLICT DO NOTHING;

-- RC=1 (DNB) - Do Not Breed - cows with problems
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000014-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', '1014', '2018-06-12', 'Holstein', 'female', 'lactating', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, '2024-03-10', 28.5, 2.5, 'dnb'),
    ('a0000015-0000-0000-0000-000000000015', '11111111-1111-1111-1111-111111111111', '1015', '2019-08-18', 'Holstein', 'female', 'lactating', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, '2024-04-15', 25.2, 2.25, 'dnb')
ON CONFLICT DO NOTHING;

-- RC=2 (FRESH) - Recently calved (already have some, adding more)
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000016-0000-0000-0000-000000000016', '11111111-1111-1111-1111-111111111111', '1016', '2021-02-20', 'Holstein', 'female', 'fresh', '33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '2025-01-18', 30.5, 2.5, 'fresh'),
    ('a0000017-0000-0000-0000-000000000017', '11111111-1111-1111-1111-111111111111', '1017', '2020-09-14', 'Holstein', 'female', 'fresh', '33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2025-01-15', 33.2, 2.75, 'fresh')
ON CONFLICT DO NOTHING;

-- RC=3 (OPEN) - Ready to breed (DIM > 60)
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000018-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', '1018', '2020-05-10', 'Holstein', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2024-10-20', 36.8, 3.0, 'open'),
    ('a0000019-0000-0000-0000-000000000019', '11111111-1111-1111-1111-111111111111', '1019', '2019-11-22', 'Holstein', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, '2024-09-15', 34.5, 3.0, 'open'),
    ('a0000020-0000-0000-0000-000000000020', '11111111-1111-1111-1111-111111111111', '1020', '2021-03-08', 'Brown Swiss', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '2024-10-05', 38.2, 3.25, 'open'),
    ('a0000021-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', '1021', '2020-07-14', 'Holstein', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2024-08-20', 35.0, 3.0, 'open')
ON CONFLICT DO NOTHING;

-- RC=4 (BRED) - Inseminated, awaiting preg check
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000022-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', '1022', '2020-04-12', 'Holstein', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2024-08-10', 37.5, 3.0, 'bred'),
    ('a0000023-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', '1023', '2019-09-25', 'Holstein', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, '2024-07-20', 35.8, 3.25, 'bred'),
    ('a0000024-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111111', '1024', '2021-01-18', 'Holstein', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '2024-09-05', 40.2, 3.5, 'bred')
ON CONFLICT DO NOTHING;

-- RC=5 (PREG) - Pregnant (already have some, adding more)
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000025-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111111', '1025', '2020-02-14', 'Holstein', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '2024-05-10', 32.5, 3.5, 'preg'),
    ('a0000026-0000-0000-0000-000000000026', '11111111-1111-1111-1111-111111111111', '1026', '2019-10-20', 'Holstein', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, '2024-04-22', 30.8, 3.75, 'preg'),
    ('a0000027-0000-0000-0000-000000000027', '11111111-1111-1111-1111-111111111111', '1027', '2021-05-08', 'Brown Swiss', 'female', 'lactating', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '2024-06-15', 34.2, 3.5, 'preg')
ON CONFLICT DO NOTHING;

-- RC=6 (DRY) - Dry cows (already have some, adding more)
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000028-0000-0000-0000-000000000028', '11111111-1111-1111-1111-111111111111', '1028', '2019-03-20', 'Holstein', 'female', 'dry', '44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, '2024-03-18', NULL, 4.0, 'dry'),
    ('a0000029-0000-0000-0000-000000000029', '11111111-1111-1111-1111-111111111111', '1029', '2020-06-12', 'Holstein', 'female', 'dry', '44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, '2024-04-25', NULL, 3.75, 'dry')
ON CONFLICT DO NOTHING;

-- RC=7 (SOLD/DIED) - Culled animals
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000030-0000-0000-0000-000000000030', '11111111-1111-1111-1111-111111111111', '1030', '2017-08-15', 'Holstein', 'female', 'sold', NULL, 6, '2023-12-10', NULL, NULL, 'sold'),
    ('a0000031-0000-0000-0000-000000000031', '11111111-1111-1111-1111-111111111111', '1031', '2018-11-22', 'Holstein', 'female', 'died', NULL, 5, '2024-02-14', NULL, NULL, 'sold')
ON CONFLICT DO NOTHING;

-- RC=8 (BULLCALF) - Bull calves
INSERT INTO public.animals (
    id, tenant_id, ear_tag, birth_date, breed, sex, current_status,
    pen_id, lactation_number, last_calving_date, last_milk_kg, bcs_score, reproductive_status
)
VALUES
    ('a0000032-0000-0000-0000-000000000032', '11111111-1111-1111-1111-111111111111', '2001', '2025-01-10', 'Holstein', 'male', 'calf', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, NULL, 'bullcalf'),
    ('a0000033-0000-0000-0000-000000000033', '11111111-1111-1111-1111-111111111111', '2002', '2025-01-14', 'Holstein', 'male', 'calf', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, NULL, 'bullcalf'),
    ('a0000034-0000-0000-0000-000000000034', '11111111-1111-1111-1111-111111111111', '2003', '2025-01-18', 'Brown Swiss', 'male', 'calf', '55555555-cccc-cccc-cccc-cccccccccccc', 0, NULL, NULL, NULL, 'bullcalf')
ON CONFLICT DO NOTHING;

-- Summary of test data
SELECT 'Extended test data loaded!' AS status;

SELECT
    reproductive_status,
    COUNT(*) as count,
    string_agg(ear_tag, ', ' ORDER BY ear_tag) as animals
FROM public.animals
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
GROUP BY reproductive_status
ORDER BY
    CASE reproductive_status
        WHEN 'blank' THEN 0
        WHEN 'dnb' THEN 1
        WHEN 'fresh' THEN 2
        WHEN 'open' THEN 3
        WHEN 'bred' THEN 4
        WHEN 'preg' THEN 5
        WHEN 'dry' THEN 6
        WHEN 'sold' THEN 7
        WHEN 'bullcalf' THEN 8
        ELSE 99
    END;
