#!/bin/bash

SUPABASE_URL="https://herd.b2bautomate.ru"
SERVICE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njg4NTA3NTQsImV4cCI6MjA4NDIxMDc1NH0.bj_Hu5ymhBZM2SMboLwAZ25E2TAKVrVlLNJKiXI1DXY"

echo "🔧 Creating animals_with_calculated view..."

# Create the view using Supabase RPC
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE OR REPLACE VIEW public.animals_with_calculated AS SELECT a.*, CASE WHEN a.last_calving_date IS NOT NULL THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_calving_date))::INTEGER ELSE NULL END AS dim, CASE WHEN a.conception_date IS NOT NULL AND a.reproductive_status IN ('\''preg'\'', '\''dry'\'') THEN 280 - EXTRACT(DAY FROM (CURRENT_DATE - a.conception_date))::INTEGER ELSE NULL END AS dcc, CASE WHEN a.birth_date IS NOT NULL THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.birth_date))::INTEGER * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.birth_date))::INTEGER ELSE NULL END AS age_months, CASE WHEN a.last_calving_date IS NOT NULL AND a.reproductive_status NOT IN ('\''preg'\'', '\''dry'\'', '\''blank'\'') THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_calving_date))::INTEGER ELSE NULL END AS days_open, CASE WHEN a.last_heat_date IS NOT NULL THEN EXTRACT(DAY FROM (CURRENT_DATE - a.last_heat_date))::INTEGER ELSE NULL END AS days_since_last_heat FROM public.animals a; GRANT SELECT ON public.animals_with_calculated TO anon, authenticated, service_role;"
  }' 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ View created successfully!"
else
    echo ""
    echo "❌ Error creating view"
fi
