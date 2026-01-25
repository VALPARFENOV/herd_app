#!/bin/bash

# Apply HerdMaster Pro migrations to local Supabase instance

# Exit on error
set -e

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Applying HerdMaster Pro migrations...${NC}"

# Change to database directory
cd "$(dirname "$0")/../packages/database"

# Check if Supabase is running
if ! pgrep -f "supabase" > /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase does not appear to be running${NC}"
    echo "Please start it with: pnpm db:start"
    exit 1
fi

# Apply migrations in order
echo "📝 Applying migration 003_service_providers.sql..."
supabase db execute -f schema/003_service_providers.sql --local || true

echo "📝 Applying migration 004_import_wizard.sql..."
supabase db execute -f schema/004_import_wizard.sql --local || true

echo "📝 Applying migration 005_milk_readings.sql..."
supabase db execute -f schema/005_milk_readings.sql --local

echo -e "${GREEN}✅ Migrations applied successfully!${NC}"

# Apply seed data
echo ""
echo -e "${GREEN}🌱 Applying seed data...${NC}"

echo "📝 Loading development.sql..."
supabase db execute -f seed/development.sql --local

echo "📝 Loading milk_readings.sql..."
supabase db execute -f seed/milk_readings.sql --local

echo -e "${GREEN}✅ Seed data loaded successfully!${NC}"

# Refresh materialized views
echo ""
echo -e "${GREEN}🔄 Refreshing materialized views...${NC}"
supabase db execute --local <<SQL
SELECT count(*) FROM refresh_continuous_aggregate('milk_daily_per_animal', NULL, NULL);
SELECT count(*) FROM refresh_continuous_aggregate('milk_daily_per_tenant', NULL, NULL);
SQL

echo -e "${GREEN}✅ All done!${NC}"
