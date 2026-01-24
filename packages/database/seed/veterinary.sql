-- HerdMaster Pro - Veterinary Module Seed Data
-- Drugs and treatment protocols for common dairy cow diseases

-- ============================================================================
-- INSERT DRUGS - Common dairy medications
-- ============================================================================

-- Intramammary antibiotics (for mastitis)
INSERT INTO public.drugs (
    tenant_id, name, generic_name, active_ingredient, manufacturer,
    withdrawal_milk_days, withdrawal_meat_days,
    dosage_per_kg, dosage_unit, route,
    package_size, package_unit,
    cost_per_package, cost_per_dose,
    requires_prescription, is_active
) VALUES
    -- Ceftiofur intramammary
    ('11111111-1111-1111-1111-111111111111', 'Spectramast LC', 'Ceftiofur HCl', 'Ceftiofur', 'Zoetis',
     2, 2, NULL, 'tube', 'intramammary',
     12, 'tubes', 84.00, 7.00, true, true),

    -- Pirlimycin intramammary
    ('11111111-1111-1111-1111-111111111111', 'Pirsue', 'Pirlimycin HCl', 'Pirlimycin', 'Zoetis',
     9, 9, NULL, 'tube', 'intramammary',
     12, 'tubes', 96.00, 8.00, true, true),

    -- Cephapirin intramammary
    ('11111111-1111-1111-1111-111111111111', 'Today', 'Cephapirin Sodium', 'Cephapirin', 'Boehringer',
     4, 4, NULL, 'tube', 'intramammary',
     12, 'tubes', 72.00, 6.00, true, true)
ON CONFLICT DO NOTHING;

-- Systemic antibiotics
INSERT INTO public.drugs (
    tenant_id, name, generic_name, active_ingredient, manufacturer,
    withdrawal_milk_days, withdrawal_meat_days,
    dosage_per_kg, dosage_unit, route,
    package_size, package_unit,
    cost_per_package, cost_per_dose,
    requires_prescription, is_active
) VALUES
    -- Ceftiofur injectable
    ('11111111-1111-1111-1111-111111111111', 'Excede', 'Ceftiofur Crystalline Free Acid', 'Ceftiofur', 'Zoetis',
     2, 2, 1.0, 'mg/kg', 'SC',
     100, 'ml', 350.00, 14.00, true, true),

    -- Oxytetracycline
    ('11111111-1111-1111-1111-111111111111', 'LA-200', 'Oxytetracycline', 'Oxytetracycline', 'Zoetis',
     7, 28, 20.0, 'mg/kg', 'IM',
     500, 'ml', 180.00, 9.00, true, true),

    -- Penicillin
    ('11111111-1111-1111-1111-111111111111', 'Penicillin G Procaine', 'Penicillin G', 'Penicillin', 'Various',
     4, 10, 6600, 'IU/kg', 'IM',
     100, 'ml', 45.00, 3.00, true, true)
ON CONFLICT DO NOTHING;

-- Anti-inflammatories
INSERT INTO public.drugs (
    tenant_id, name, generic_name, active_ingredient, manufacturer,
    withdrawal_milk_days, withdrawal_meat_days,
    dosage_per_kg, dosage_unit, route,
    package_size, package_unit,
    cost_per_package, cost_per_dose,
    requires_prescription, is_active
) VALUES
    -- Flunixin meglumine
    ('11111111-1111-1111-1111-111111111111', 'Banamine', 'Flunixin Meglumine', 'Flunixin', 'Merck',
     2, 4, 2.2, 'mg/kg', 'IV',
     100, 'ml', 120.00, 6.00, true, true),

    -- Meloxicam
    ('11111111-1111-1111-1111-111111111111', 'Metacam', 'Meloxicam', 'Meloxicam', 'Boehringer',
     5, 15, 0.5, 'mg/kg', 'SC',
     100, 'ml', 150.00, 7.50, true, true)
ON CONFLICT DO NOTHING;

-- Reproductive hormones
INSERT INTO public.drugs (
    tenant_id, name, generic_name, active_ingredient, manufacturer,
    withdrawal_milk_days, withdrawal_meat_days,
    dosage_per_kg, dosage_unit, route,
    package_size, package_unit,
    cost_per_package, cost_per_dose,
    requires_prescription, is_active
) VALUES
    -- Prostaglandin
    ('11111111-1111-1111-1111-111111111111', 'Lutalyse', 'Dinoprost Tromethamine', 'Prostaglandin F2a', 'Zoetis',
     0, 0, NULL, 'ml', 'IM',
     30, 'ml', 90.00, 3.00, true, true),

    -- GnRH
    ('11111111-1111-1111-1111-111111111111', 'Factrel', 'Gonadorelin', 'GnRH', 'Zoetis',
     0, 0, NULL, 'ml', 'IM',
     10, 'ml', 60.00, 6.00, true, true),

    -- Oxytocin
    ('11111111-1111-1111-1111-111111111111', 'Oxytocin', 'Oxytocin', 'Oxytocin', 'Various',
     0, 0, NULL, 'IU', 'IM',
     100, 'ml', 25.00, 1.00, true, true)
ON CONFLICT DO NOTHING;

-- Vitamins and supplements
INSERT INTO public.drugs (
    tenant_id, name, generic_name, active_ingredient, manufacturer,
    withdrawal_milk_days, withdrawal_meat_days,
    dosage_per_kg, dosage_unit, route,
    package_size, package_unit,
    cost_per_package, cost_per_dose,
    requires_prescription, is_active
) VALUES
    -- Calcium
    ('11111111-1111-1111-1111-111111111111', 'Calcium Gluconate 23%', 'Calcium Gluconate', 'Calcium', 'Various',
     0, 0, NULL, 'ml', 'IV',
     500, 'ml', 45.00, 4.50, false, true),

    -- B-complex
    ('11111111-1111-1111-1111-111111111111', 'Vitamin B Complex', 'B Vitamins', 'B-Complex', 'Various',
     0, 0, NULL, 'ml', 'SC',
     100, 'ml', 30.00, 1.50, false, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSERT TREATMENT PROTOCOLS
-- ============================================================================

DO $$
DECLARE
    v_spectramast_id UUID;
    v_pirsue_id UUID;
    v_excede_id UUID;
    v_banamine_id UUID;
    v_la200_id UUID;
    v_penicillin_id UUID;
    v_meloxicam_id UUID;
BEGIN
    -- Get drug IDs
    SELECT id INTO v_spectramast_id FROM public.drugs WHERE name = 'Spectramast LC' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_pirsue_id FROM public.drugs WHERE name = 'Pirsue' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_excede_id FROM public.drugs WHERE name = 'Excede' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_banamine_id FROM public.drugs WHERE name = 'Banamine' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_la200_id FROM public.drugs WHERE name = 'LA-200' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_penicillin_id FROM public.drugs WHERE name = 'Penicillin G Procaine' AND tenant_id = '11111111-1111-1111-1111-111111111111';
    SELECT id INTO v_meloxicam_id FROM public.drugs WHERE name = 'Metacam' AND tenant_id = '11111111-1111-1111-1111-111111111111';

    -- Protocol 1: Clinical Mastitis - Mild (intramammary only)
    INSERT INTO public.treatment_protocols (
        tenant_id, name, disease_code, description,
        protocol_steps, withdrawal_milk_days, withdrawal_meat_days,
        estimated_cost, is_active, is_default
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Clinical Mastitis - Mild',
        'MAST_CLINICAL_MILD',
        'Intramammary antibiotic treatment for mild clinical mastitis (watery milk, no systemic signs)',
        jsonb_build_array(
            jsonb_build_object('day', 1, 'drug_id', v_spectramast_id, 'dose', 1, 'route', 'intramammary', 'instructions', 'Treat affected quarter'),
            jsonb_build_object('day', 2, 'drug_id', v_spectramast_id, 'dose', 1, 'route', 'intramammary', 'instructions', 'Treat affected quarter'),
            jsonb_build_object('day', 3, 'drug_id', v_spectramast_id, 'dose', 1, 'route', 'intramammary', 'instructions', 'Treat affected quarter')
        ),
        2, 2, 21.00, true, true
    );

    -- Protocol 2: Clinical Mastitis - Moderate (systemic + intramammary)
    INSERT INTO public.treatment_protocols (
        tenant_id, name, disease_code, description,
        protocol_steps, withdrawal_milk_days, withdrawal_meat_days,
        estimated_cost, is_active, is_default
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Clinical Mastitis - Moderate',
        'MAST_CLINICAL_MOD',
        'Systemic + intramammary treatment for moderate mastitis (clots, mild fever)',
        jsonb_build_array(
            jsonb_build_object('day', 1, 'drug_id', v_excede_id, 'dose', 1.5, 'route', 'SC', 'instructions', '1.5 ml/50kg body weight'),
            jsonb_build_object('day', 1, 'drug_id', v_spectramast_id, 'dose', 1, 'route', 'intramammary'),
            jsonb_build_object('day', 1, 'drug_id', v_banamine_id, 'dose', 1.1, 'route', 'IV', 'instructions', '1.1 mg/kg'),
            jsonb_build_object('day', 2, 'drug_id', v_spectramast_id, 'dose', 1, 'route', 'intramammary'),
            jsonb_build_object('day', 3, 'drug_id', v_spectramast_id, 'dose', 1, 'route', 'intramammary')
        ),
        2, 2, 48.00, true, true
    );

    -- Protocol 3: Clinical Mastitis - Severe (aggressive treatment)
    INSERT INTO public.treatment_protocols (
        tenant_id, name, disease_code, description,
        protocol_steps, withdrawal_milk_days, withdrawal_meat_days,
        estimated_cost, is_active, is_default
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Clinical Mastitis - Severe',
        'MAST_CLINICAL_SEV',
        'Aggressive treatment for severe mastitis (high fever, dehydration, toxemia)',
        jsonb_build_array(
            jsonb_build_object('day', 1, 'drug_id', v_excede_id, 'dose', 1.5, 'route', 'SC'),
            jsonb_build_object('day', 1, 'drug_id', v_banamine_id, 'dose', 2.2, 'route', 'IV', 'instructions', '2.2 mg/kg'),
            jsonb_build_object('day', 2, 'drug_id', v_banamine_id, 'dose', 2.2, 'route', 'IV'),
            jsonb_build_object('day', 3, 'drug_id', v_banamine_id, 'dose', 2.2, 'route', 'IV')
        ),
        2, 2, 64.00, true, true
    );

    -- Protocol 4: Subclinical Mastitis (dry cow treatment)
    INSERT INTO public.treatment_protocols (
        tenant_id, name, disease_code, description,
        protocol_steps, withdrawal_milk_days, withdrawal_meat_days,
        estimated_cost, is_active, is_default
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Subclinical Mastitis - High SCC',
        'MAST_SUBCLINICAL',
        'Treatment for high SCC without clinical signs (SCC > 400K)',
        jsonb_build_array(
            jsonb_build_object('day', 1, 'drug_id', v_pirsue_id, 'dose', 1, 'route', 'intramammary', 'instructions', 'Treat affected quarter(s)'),
            jsonb_build_object('day', 2, 'drug_id', v_pirsue_id, 'dose', 1, 'route', 'intramammary'),
            jsonb_build_object('day', 3, 'drug_id', v_pirsue_id, 'dose', 1, 'route', 'intramammary')
        ),
        9, 9, 24.00, true, true
    );

    -- Protocol 5: Metritis (uterine infection)
    INSERT INTO public.treatment_protocols (
        tenant_id, name, disease_code, description,
        protocol_steps, withdrawal_milk_days, withdrawal_meat_days,
        estimated_cost, is_active, is_default
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Metritis - Acute',
        'METRITIS',
        'Treatment for acute metritis in fresh cows (fever, foul discharge)',
        jsonb_build_array(
            jsonb_build_object('day', 1, 'drug_id', v_excede_id, 'dose', 1.5, 'route', 'SC'),
            jsonb_build_object('day', 1, 'drug_id', v_banamine_id, 'dose', 2.2, 'route', 'IV'),
            jsonb_build_object('day', 3, 'drug_id', v_excede_id, 'dose', 1.5, 'route', 'SC')
        ),
        2, 2, 40.00, true, true
    );

    -- Protocol 6: Lameness - Foot Rot
    INSERT INTO public.treatment_protocols (
        tenant_id, name, disease_code, description,
        protocol_steps, withdrawal_milk_days, withdrawal_meat_days,
        estimated_cost, is_active, is_default
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Lameness - Foot Rot',
        'LAME_FOOTROT',
        'Treatment for infectious foot rot (swelling, foul smell)',
        jsonb_build_array(
            jsonb_build_object('day', 1, 'drug_id', v_la200_id, 'dose', 20, 'route', 'IM', 'instructions', '20 mg/kg'),
            jsonb_build_object('day', 1, 'drug_id', v_meloxicam_id, 'dose', 0.5, 'route', 'SC', 'instructions', '0.5 mg/kg'),
            jsonb_build_object('day', 3, 'drug_id', v_la200_id, 'dose', 20, 'route', 'IM')
        ),
        7, 28, 32.00, true, true
    );

    -- Protocol 7: Respiratory Disease
    INSERT INTO public.treatment_protocols (
        tenant_id, name, disease_code, description,
        protocol_steps, withdrawal_milk_days, withdrawal_meat_days,
        estimated_cost, is_active, is_default
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Respiratory Disease - BRD',
        'RESP_BRD',
        'Treatment for bovine respiratory disease (cough, fever, nasal discharge)',
        jsonb_build_array(
            jsonb_build_object('day', 1, 'drug_id', v_excede_id, 'dose', 1.5, 'route', 'SC'),
            jsonb_build_object('day', 1, 'drug_id', v_banamine_id, 'dose', 2.2, 'route', 'IV')
        ),
        2, 2, 20.00, true, true
    );

END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check drugs
SELECT
    route,
    COUNT(*) as drug_count,
    AVG(withdrawal_milk_days) as avg_milk_withdrawal
FROM public.drugs
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND deleted_at IS NULL
GROUP BY route
ORDER BY route;

-- Check protocols
SELECT
    disease_code,
    name,
    withdrawal_milk_days,
    withdrawal_meat_days,
    estimated_cost,
    jsonb_array_length(protocol_steps) as steps_count
FROM public.treatment_protocols
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND deleted_at IS NULL
ORDER BY disease_code;

SELECT '✅ Veterinary seed data loaded successfully!' AS status;
