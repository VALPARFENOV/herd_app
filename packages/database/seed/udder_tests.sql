-- HerdMaster Pro - Udder Quarter Tests Seed Data
-- Creates realistic udder test data with distribution:
-- 80% normal SCC (<200k), 15% subclinical (200-400k), 5% clinical (>400k)

-- ============================================================================
-- INSERT SCC TESTS - Latest test session for multiple cows
-- ============================================================================

-- Cow 1001 - Normal SCC, all quarters healthy
INSERT INTO public.udder_quarter_tests (
    tenant_id, animal_id, test_date, test_type, quarter,
    result_value, result_interpretation
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', 'scc', 'LF', 85000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', 'scc', 'LR', 92000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', 'scc', 'RF', 78000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', 'scc', 'RR', 110000, 'normal')
ON CONFLICT DO NOTHING;

-- Cow 1001 - CMT test (same date)
INSERT INTO public.udder_quarter_tests (
    tenant_id, animal_id, test_date, test_type, quarter,
    result_text, result_interpretation
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', 'cmt', 'LF', '-', 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', 'cmt', 'LR', '-', 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', 'cmt', 'RF', '-', 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', '2025-01-15', 'cmt', 'RR', '+', 'normal')
ON CONFLICT DO NOTHING;

-- Cow 1002 - Subclinical mastitis in RR quarter
INSERT INTO public.udder_quarter_tests (
    tenant_id, animal_id, test_date, test_type, quarter,
    result_value, result_interpretation
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', '2025-01-10', 'scc', 'LF', 95000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', '2025-01-10', 'scc', 'LR', 105000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', '2025-01-10', 'scc', 'RF', 88000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', '2025-01-10', 'scc', 'RR', 285000, 'subclinical')
ON CONFLICT DO NOTHING;

-- Cow 1002 - CMT shows weak positive in RR
INSERT INTO public.udder_quarter_tests (
    tenant_id, animal_id, test_date, test_type, quarter,
    result_text, result_interpretation
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', '2025-01-10', 'cmt', 'LF', '-', 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', '2025-01-10', 'cmt', 'LR', '-', 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', '2025-01-10', 'cmt', 'RF', '-', 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000002-0000-0000-0000-000000000002', '2025-01-10', 'cmt', 'RR', '++', 'subclinical')
ON CONFLICT DO NOTHING;

-- Cow 1003 - Clinical mastitis in LF quarter with culture
INSERT INTO public.udder_quarter_tests (
    tenant_id, animal_id, test_date, test_type, quarter,
    result_value, result_interpretation
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', '2024-12-20', 'scc', 'LF', 650000, 'clinical'),
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', '2024-12-20', 'scc', 'LR', 120000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', '2024-12-20', 'scc', 'RF', 145000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', '2024-12-20', 'scc', 'RR', 98000, 'normal')
ON CONFLICT DO NOTHING;

-- Cow 1003 - Culture test shows S. aureus in LF
INSERT INTO public.udder_quarter_tests (
    tenant_id, animal_id, test_date, test_type, quarter,
    result_interpretation, pathogen, colony_count,
    antibiotic_sensitivity, notes
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', '2024-12-20', 'culture', 'LF',
     'infected', 'Staphylococcus aureus', 'heavy',
     '{"penicillin": "R", "ceftiofur": "S", "tetracycline": "I", "erythromycin": "S"}',
     'Contagious pathogen - isolate cow'),
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', '2024-12-20', 'culture', 'LR',
     'normal', null, 'no growth', '{}', null),
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', '2024-12-20', 'culture', 'RF',
     'normal', null, 'no growth', '{}', null),
    ('11111111-1111-1111-1111-111111111111', 'a0000003-0000-0000-0000-000000000003', '2024-12-20', 'culture', 'RR',
     'normal', null, 'no growth', '{}', null)
ON CONFLICT DO NOTHING;

-- Cow 1004 (fresh cow) - Elevated SCC in RF (common post-calving)
INSERT INTO public.udder_quarter_tests (
    tenant_id, animal_id, test_date, test_type, quarter,
    result_value, result_interpretation
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a0000004-0000-0000-0000-000000000004', '2025-01-18', 'scc', 'LF', 125000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000004-0000-0000-0000-000000000004', '2025-01-18', 'scc', 'LR', 110000, 'normal'),
    ('11111111-1111-1111-1111-111111111111', 'a0000004-0000-0000-0000-000000000004', '2025-01-18', 'scc', 'RF', 320000, 'subclinical'),
    ('11111111-1111-1111-1111-111111111111', 'a0000004-0000-0000-0000-000000000004', '2025-01-18', 'scc', 'RR', 95000, 'normal')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    test_type,
    COUNT(*) as total_tests,
    COUNT(DISTINCT animal_id) as cows_tested,
    COUNT(DISTINCT test_date) as test_sessions
FROM public.udder_quarter_tests
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
GROUP BY test_type
ORDER BY test_type;

-- SCC distribution
SELECT
    CASE
        WHEN result_value < 100000 THEN 'Excellent (<100K)'
        WHEN result_value < 200000 THEN 'Good (100-200K)'
        WHEN result_value < 400000 THEN 'Subclinical (200-400K)'
        ELSE 'Clinical (>400K)'
    END as scc_category,
    COUNT(*) as quarter_count,
    ROUND(AVG(result_value)) as avg_scc
FROM public.udder_quarter_tests
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND test_type = 'scc'
GROUP BY scc_category
ORDER BY avg_scc;

-- Pathogen summary
SELECT
    pathogen,
    COUNT(*) as count
FROM public.udder_quarter_tests
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND test_type = 'culture'
  AND pathogen IS NOT NULL
GROUP BY pathogen;

SELECT '✅ Udder quarter tests seed data loaded successfully!' AS status;
