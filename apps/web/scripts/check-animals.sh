#!/bin/bash

SUPABASE_URL="https://herd.b2bautomate.ru/rest/v1"
SERVICE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njg4NTA3NTQsImV4cCI6MjA4NDIxMDc1NH0.bj_Hu5ymhBZM2SMboLwAZ25E2TAKVrVlLNJKiXI1DXY"

echo "📊 Animals by RC Code:"
echo ""

echo "RC=0 (BLANK):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.blank&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "RC=1 (DNB):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.dnb&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "RC=2 (FRESH):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.fresh&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "RC=3 (OPEN):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.open&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "RC=4 (BRED):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.bred&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "RC=5 (PREG):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.preg&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "RC=6 (DRY):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.dry&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "RC=7 (SOLD):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.sold&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "RC=8 (BULLCALF):"
curl -s "${SUPABASE_URL}/animals?reproductive_status=eq.bullcalf&select=ear_tag" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq -r '.[].ear_tag' | tr '\n' ', ' && echo ""

echo ""
echo "Total animals:"
curl -s "${SUPABASE_URL}/animals?select=count" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Prefer: count=exact" | jq
