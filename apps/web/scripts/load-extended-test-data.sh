#!/bin/bash

# Load extended test data via Supabase REST API

SUPABASE_URL="https://herd.b2bautomate.ru/rest/v1"
SERVICE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njg4NTA3NTQsImV4cCI6MjA4NDIxMDc1NH0.bj_Hu5ymhBZM2SMboLwAZ25E2TAKVrVlLNJKiXI1DXY"

echo "🐄 Loading extended test data..."
echo ""

# RC=0 (BLANK) - Heifers
echo "📊 RC=0 (BLANK) - Young heifers..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000011-0000-0000-0000-000000000011","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1011","birth_date":"2024-03-15","breed":"Holstein","sex":"female","current_status":"heifer","pen_id":"55555555-cccc-cccc-cccc-cccccccccccc","lactation_number":0,"reproductive_status":"blank","bcs_score":2.5},
    {"id":"a0000012-0000-0000-0000-000000000012","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1012","birth_date":"2024-04-20","breed":"Holstein","sex":"female","current_status":"heifer","pen_id":"55555555-cccc-cccc-cccc-cccccccccccc","lactation_number":0,"reproductive_status":"blank","bcs_score":2.75},
    {"id":"a0000013-0000-0000-0000-000000000013","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1013","birth_date":"2024-05-10","breed":"Brown Swiss","sex":"female","current_status":"heifer","pen_id":"55555555-cccc-cccc-cccc-cccccccccccc","lactation_number":0,"reproductive_status":"blank","bcs_score":2.5}
  ]' 2>/dev/null && echo "✓ Added 3 heifers"

# RC=1 (DNB)
echo "📊 RC=1 (DNB) - Do Not Breed..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000014-0000-0000-0000-000000000014","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1014","birth_date":"2018-06-12","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":5,"last_calving_date":"2024-03-10","last_milk_kg":28.5,"reproductive_status":"dnb","bcs_score":2.5},
    {"id":"a0000015-0000-0000-0000-000000000015","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1015","birth_date":"2019-08-18","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":4,"last_calving_date":"2024-04-15","last_milk_kg":25.2,"reproductive_status":"dnb","bcs_score":2.25}
  ]' 2>/dev/null && echo "✓ Added 2 DNB cows"

# RC=2 (FRESH)
echo "📊 RC=2 (FRESH) - Fresh cows..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000016-0000-0000-0000-000000000016","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1016","birth_date":"2021-02-20","breed":"Holstein","sex":"female","current_status":"fresh","pen_id":"33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":2,"last_calving_date":"2025-01-18","last_milk_kg":30.5,"reproductive_status":"fresh","bcs_score":2.5},
    {"id":"a0000017-0000-0000-0000-000000000017","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1017","birth_date":"2020-09-14","breed":"Holstein","sex":"female","current_status":"fresh","pen_id":"33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2025-01-15","last_milk_kg":33.2,"reproductive_status":"fresh","bcs_score":2.75}
  ]' 2>/dev/null && echo "✓ Added 2 fresh cows"

# RC=3 (OPEN)
echo "📊 RC=3 (OPEN) - Ready to breed..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000018-0000-0000-0000-000000000018","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1018","birth_date":"2020-05-10","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-10-20","last_milk_kg":36.8,"reproductive_status":"open","bcs_score":3.0},
    {"id":"a0000019-0000-0000-0000-000000000019","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1019","birth_date":"2019-11-22","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":4,"last_calving_date":"2024-09-15","last_milk_kg":34.5,"reproductive_status":"open","bcs_score":3.0},
    {"id":"a0000020-0000-0000-0000-000000000020","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1020","birth_date":"2021-03-08","breed":"Brown Swiss","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":2,"last_calving_date":"2024-10-05","last_milk_kg":38.2,"reproductive_status":"open","bcs_score":3.25},
    {"id":"a0000021-0000-0000-0000-000000000021","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1021","birth_date":"2020-07-14","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-08-20","last_milk_kg":35.0,"reproductive_status":"open","bcs_score":3.0}
  ]' 2>/dev/null && echo "✓ Added 4 open cows"

# RC=4 (BRED)
echo "📊 RC=4 (BRED) - Inseminated..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000022-0000-0000-0000-000000000022","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1022","birth_date":"2020-04-12","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-08-10","last_milk_kg":37.5,"reproductive_status":"bred","bcs_score":3.0},
    {"id":"a0000023-0000-0000-0000-000000000023","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1023","birth_date":"2019-09-25","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":4,"last_calving_date":"2024-07-20","last_milk_kg":35.8,"reproductive_status":"bred","bcs_score":3.25},
    {"id":"a0000024-0000-0000-0000-000000000024","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1024","birth_date":"2021-01-18","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":2,"last_calving_date":"2024-09-05","last_milk_kg":40.2,"reproductive_status":"bred","bcs_score":3.5}
  ]' 2>/dev/null && echo "✓ Added 3 bred cows"

# RC=5 (PREG)
echo "📊 RC=5 (PREG) - Pregnant..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000025-0000-0000-0000-000000000025","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1025","birth_date":"2020-02-14","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":3,"last_calving_date":"2024-05-10","last_milk_kg":32.5,"reproductive_status":"preg","bcs_score":3.5},
    {"id":"a0000026-0000-0000-0000-000000000026","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1026","birth_date":"2019-10-20","breed":"Holstein","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":4,"last_calving_date":"2024-04-22","last_milk_kg":30.8,"reproductive_status":"preg","bcs_score":3.75},
    {"id":"a0000027-0000-0000-0000-000000000027","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1027","birth_date":"2021-05-08","breed":"Brown Swiss","sex":"female","current_status":"lactating","pen_id":"22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa","lactation_number":2,"last_calving_date":"2024-06-15","last_milk_kg":34.2,"reproductive_status":"preg","bcs_score":3.5}
  ]' 2>/dev/null && echo "✓ Added 3 pregnant cows"

# RC=6 (DRY)
echo "📊 RC=6 (DRY) - Dry cows..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000028-0000-0000-0000-000000000028","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1028","birth_date":"2019-03-20","breed":"Holstein","sex":"female","current_status":"dry","pen_id":"44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb","lactation_number":4,"last_calving_date":"2024-03-18","reproductive_status":"dry","bcs_score":4.0},
    {"id":"a0000029-0000-0000-0000-000000000029","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1029","birth_date":"2020-06-12","breed":"Holstein","sex":"female","current_status":"dry","pen_id":"44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb","lactation_number":3,"last_calving_date":"2024-04-25","reproductive_status":"dry","bcs_score":3.75}
  ]' 2>/dev/null && echo "✓ Added 2 dry cows"

# RC=7 (SOLD)
echo "📊 RC=7 (SOLD) - Culled animals..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000030-0000-0000-0000-000000000030","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1030","birth_date":"2017-08-15","breed":"Holstein","sex":"female","current_status":"sold","lactation_number":6,"last_calving_date":"2023-12-10","reproductive_status":"sold"},
    {"id":"a0000031-0000-0000-0000-000000000031","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"1031","birth_date":"2018-11-22","breed":"Holstein","sex":"female","current_status":"died","lactation_number":5,"last_calving_date":"2024-02-14","reproductive_status":"sold"}
  ]' 2>/dev/null && echo "✓ Added 2 culled animals"

# RC=8 (BULLCALF)
echo "📊 RC=8 (BULLCALF) - Bull calves..."
curl -X POST "${SUPABASE_URL}/animals" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[
    {"id":"a0000032-0000-0000-0000-000000000032","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"2001","birth_date":"2025-01-10","breed":"Holstein","sex":"male","current_status":"calf","pen_id":"55555555-cccc-cccc-cccc-cccccccccccc","lactation_number":0,"reproductive_status":"bullcalf"},
    {"id":"a0000033-0000-0000-0000-000000000033","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"2002","birth_date":"2025-01-14","breed":"Holstein","sex":"male","current_status":"calf","pen_id":"55555555-cccc-cccc-cccc-cccccccccccc","lactation_number":0,"reproductive_status":"bullcalf"},
    {"id":"a0000034-0000-0000-0000-000000000034","tenant_id":"11111111-1111-1111-1111-111111111111","ear_tag":"2003","birth_date":"2025-01-18","breed":"Brown Swiss","sex":"male","current_status":"calf","pen_id":"55555555-cccc-cccc-cccc-cccccccccccc","lactation_number":0,"reproductive_status":"bullcalf"}
  ]' 2>/dev/null && echo "✓ Added 3 bull calves"

echo ""
echo "✅ Extended test data loaded successfully!"
echo ""
echo "Summary:"
echo "RC=0 (BLANK):    6 animals (1008-1013)"
echo "RC=1 (DNB):      2 animals (1014-1015)"
echo "RC=2 (FRESH):    4 animals (1004-1005, 1016-1017)"
echo "RC=3 (OPEN):     5 animals (1001, 1018-1021)"
echo "RC=4 (BRED):     4 animals (1002, 1022-1024)"
echo "RC=5 (PREG):     5 animals (1003, 1007, 1025-1027)"
echo "RC=6 (DRY):      4 animals (1006, 1007, 1028-1029)"
echo "RC=7 (SOLD):     2 animals (1030-1031)"
echo "RC=8 (BULLCALF): 3 animals (2001-2003)"
echo ""
echo "Total: 34 animals"
