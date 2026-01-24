#!/bin/bash

# Comprehensive test data for ALL CLI fields and commands

SUPABASE_URL="https://herd.b2bautomate.ru/rest/v1"
SERVICE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njg4NTA3NTQsImV4cCI6MjA4NDIxMDc1NH0.bj_Hu5ymhBZM2SMboLwAZ25E2TAKVrVlLNJKiXI1DXY"

echo "🧪 Loading comprehensive test data for ALL CLI commands..."
echo ""

# High SCC cows - for testing SCC filters
echo "📊 Adding high SCC cows (for SCC testing)..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000040-0000-0000-0000-000000000040","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1040","birth_date":"2020-03-10","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-08-15","last_milk_kg":32.5,"reproductive_status":"open","bcs_score":2.75,"last_scc":450000},
    {"id":"a0000041-0000-0000-0000-000000000041","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1041","birth_date":"2019-07-20","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":4,"last_calving_date":"2024-07-10","last_milk_kg":28.2,"reproductive_status":"open","bcs_score":2.5,"last_scc":780000},
    {"id":"a0000042-0000-0000-0000-000000000042","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1042","birth_date":"2020-11-05","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-09-20","last_milk_kg":30.8,"reproductive_status":"bred","bcs_score":2.75,"last_scc":320000}
  ]' 2>/dev/null && echo "✓ Added 3 high SCC cows"

# Low SCC cows - for comparison
echo "📊 Adding normal SCC cows..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000043-0000-0000-0000-000000000043","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1043","birth_date":"2021-01-15","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":2,"last_calving_date":"2024-10-10","last_milk_kg":42.5,"reproductive_status":"open","bcs_score":3.5,"last_scc":85000},
    {"id":"a0000044-0000-0000-0000-000000000044","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1044","birth_date":"2021-04-22","breed":"Brown Swiss","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":2,"last_calving_date":"2024-11-05","last_milk_kg":45.2,"reproductive_status":"open","bcs_score":3.75,"last_scc":65000}
  ]' 2>/dev/null && echo "✓ Added 2 normal SCC cows"

# Different lactation numbers - for LACT testing
echo "📊 Adding cows with varied lactations..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000045-0000-0000-0000-000000000045","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1045","birth_date":"2019-02-14","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":5,"last_calving_date":"2024-06-20","last_milk_kg":28.5,"reproductive_status":"preg","bcs_score":3.5,"last_scc":125000},
    {"id":"a0000046-0000-0000-0000-000000000046","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1046","birth_date":"2018-09-10","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":6,"last_calving_date":"2024-05-15","last_milk_kg":26.2,"reproductive_status":"preg","bcs_score":3.25,"last_scc":145000},
    {"id":"a0000047-0000-0000-0000-000000000047","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1047","birth_date":"2022-03-08","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":1,"last_calving_date":"2024-12-01","last_milk_kg":38.5,"reproductive_status":"fresh","bcs_score":3.0,"last_scc":92000}
  ]' 2>/dev/null && echo "✓ Added 3 cows (LACT 1, 5, 6)"

# Different milk yields - for MILK testing
echo "📊 Adding high and low producers..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000048-0000-0000-0000-000000000048","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1048","birth_date":"2020-06-18","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-09-10","last_milk_kg":52.8,"reproductive_status":"open","bcs_score":3.25,"last_scc":95000},
    {"id":"a0000049-0000-0000-0000-000000000049","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1049","birth_date":"2020-08-25","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-08-22","last_milk_kg":48.5,"reproductive_status":"open","bcs_score":3.5,"last_scc":78000},
    {"id":"a0000050-0000-0000-0000-000000000050","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1050","birth_date":"2019-10-12","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":4,"last_calving_date":"2024-07-05","last_milk_kg":22.3,"reproductive_status":"open","bcs_score":2.25,"last_scc":210000},
    {"id":"a0000051-0000-0000-0000-000000000051","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1051","birth_date":"2019-12-20","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":4,"last_calving_date":"2024-06-18","last_milk_kg":19.8,"reproductive_status":"dnb","bcs_score":2.0,"last_scc":380000}
  ]' 2>/dev/null && echo "✓ Added 4 cows (high/low milk)"

# Different breeds - for BREED testing
echo "📊 Adding different breeds..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000052-0000-0000-0000-000000000052","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1052","birth_date":"2021-02-10","breed":"Jersey","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":2,"last_calving_date":"2024-10-15","last_milk_kg":28.5,"reproductive_status":"open","bcs_score":3.0,"last_scc":105000},
    {"id":"a0000053-0000-0000-0000-000000000053","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1053","birth_date":"2020-07-22","breed":"Ayrshire","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-09-08","last_milk_kg":36.2,"reproductive_status":"bred","bcs_score":3.25,"last_scc":88000}
  ]' 2>/dev/null && echo "✓ Added 2 cows (Jersey, Ayrshire)"

# Different BCS scores - for BCS testing
echo "📊 Adding cows with varied BCS..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000054-0000-0000-0000-000000000054","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1054","birth_date":"2020-04-15","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-08-20","last_milk_kg":35.5,"reproductive_status":"open","bcs_score":4.0,"last_scc":92000},
    {"id":"a0000055-0000-0000-0000-000000000055","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1055","birth_date":"2020-06-08","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-09-05","last_milk_kg":38.2,"reproductive_status":"open","bcs_score":1.75,"last_scc":115000}
  ]' 2>/dev/null && echo "✓ Added 2 cows (BCS 1.75 and 4.0)"

# Different calving dates - for FDAT testing
echo "📊 Adding cows with various calving dates..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000056-0000-0000-0000-000000000056","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1056","birth_date":"2019-11-10","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":4,"last_calving_date":"2024-01-15","last_milk_kg":25.8,"reproductive_status":"preg","bcs_score":3.5,"last_scc":105000},
    {"id":"a0000057-0000-0000-0000-000000000057","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1057","birth_date":"2020-03-22","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-12-20","last_milk_kg":40.5,"reproductive_status":"fresh","bcs_score":2.75,"last_scc":82000}
  ]' 2>/dev/null && echo "✓ Added 2 cows (early/late calving)"

echo ""
echo "✅ Comprehensive test data loaded!"
echo ""
echo "Summary by category:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SCC Testing:"
echo "  - High SCC (>200k): 1040, 1041, 1042, 1050, 1051"
echo "  - Normal SCC (<200k): 1043, 1044"
echo ""
echo "Lactation Testing:"
echo "  - LACT=1: 1047"
echo "  - LACT=2-3: Most cows"
echo "  - LACT=5: 1045"
echo "  - LACT=6: 1046"
echo ""
echo "Milk Yield Testing:"
echo "  - High (>45 kg): 1043, 1044, 1048, 1049"
echo "  - Medium (25-40 kg): Most cows"
echo "  - Low (<23 kg): 1050, 1051"
echo ""
echo "Breed Testing:"
echo "  - Holstein: Most cows"
echo "  - Brown Swiss: 1010, 1013, 1020, 1027, 1044"
echo "  - Jersey: 1052"
echo "  - Ayrshire: 1053"
echo ""
echo "BCS Testing:"
echo "  - Low BCS (1.75): 1055"
echo "  - Normal (2.5-3.5): Most cows"
echo "  - High BCS (4.0): 1054"
echo ""
echo "Total animals: ~47"
