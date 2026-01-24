-- HerdMaster Pro - Hoof Inspections Seed Data
-- Creates realistic hoof inspection data for 30% of cows

-- ============================================================================
-- INSERT HOOF INSPECTIONS
-- ============================================================================

-- Cow 1001 - Recent inspection with Digital Dermatitis
INSERT INTO public.hoof_inspections (
    id, tenant_id, animal_id, inspection_date, inspector_name,
    locomotion_score, has_lesions, needs_followup, overall_notes
) VALUES (
    'h0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'a0000001-0000-0000-0000-000000000001',
    '2025-12-15',
    'HoofCare Ltd',
    2,
    true,
    false,
    'Mild DD on RR outer, treated with topical'
) ON CONFLICT DO NOTHING;

-- Lesions for cow 1001
INSERT INTO public.hoof_zone_findings (
    inspection_id, leg, claw, zone, lesion_type, lesion_code, severity,
    treatment_type, treatment_product, is_new, is_healed
) VALUES
    -- RR outer claw - Digital Dermatitis at heel
    ('h0000001-0000-0000-0000-000000000001', 'RR', 'outer', 1, 'DD', 'M2', 2, 'topical', 'Copper sulfate', true, false),
    -- RR outer claw - Heel Horn Erosion
    ('h0000001-0000-0000-0000-000000000001', 'RR', 'outer', 2, 'HHE', null, 1, 'trim', null, false, false)
ON CONFLICT DO NOTHING;

-- Cow 1002 - Healthy, routine check
INSERT INTO public.hoof_inspections (
    id, tenant_id, animal_id, inspection_date, inspector_name,
    locomotion_score, has_lesions, needs_followup, overall_notes
) VALUES (
    'h0000002-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'a0000002-0000-0000-0000-000000000002',
    '2025-12-15',
    'HoofCare Ltd',
    1,
    false,
    false,
    'Healthy hooves, no issues'
) ON CONFLICT DO NOTHING;

-- Cow 1003 - Sole ulcer, needs block
INSERT INTO public.hoof_inspections (
    id, tenant_id, animal_id, inspection_date, inspector_name,
    locomotion_score, has_lesions, needs_followup, followup_date, overall_notes
) VALUES (
    'h0000003-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'a0000003-0000-0000-0000-000000000003',
    '2025-11-20',
    'HoofCare Ltd',
    3,
    true,
    true,
    '2026-02-20',
    'Sole ulcer LF outer, block applied'
) ON CONFLICT DO NOTHING;

-- Lesions for cow 1003
INSERT INTO public.hoof_zone_findings (
    inspection_id, leg, claw, zone, lesion_type, lesion_code, severity,
    treatment_type, treatment_product, is_new, is_healed
) VALUES
    -- LF outer claw - Sole Ulcer
    ('h0000003-0000-0000-0000-000000000003', 'LF', 'outer', 3, 'SU', null, 3, 'block', 'Wooden block', true, false),
    -- LF outer claw - White Line Disease
    ('h0000003-0000-0000-0000-000000000003', 'LF', 'outer', 4, 'WLD', null, 2, 'trim', null, false, false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    COUNT(*) as total_inspections,
    COUNT(DISTINCT animal_id) as cows_inspected,
    SUM(CASE WHEN has_lesions THEN 1 ELSE 0 END) as with_lesions,
    AVG(locomotion_score) as avg_locomotion_score
FROM public.hoof_inspections
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

SELECT
    COUNT(*) as total_lesions,
    COUNT(DISTINCT lesion_type) as lesion_types,
    AVG(severity) as avg_severity
FROM public.hoof_zone_findings hzf
JOIN public.hoof_inspections hi ON hi.id = hzf.inspection_id
WHERE hi.tenant_id = '11111111-1111-1111-1111-111111111111';

SELECT '✅ Hoof inspections seed data loaded successfully!' AS status;
