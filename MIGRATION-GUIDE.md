# Migration Guide - Phase 1: Milk Production Module

This guide explains how to apply the Phase 1 database migrations for the HerdMaster Pro milk production module.

## Files Created

### Database Schema
- `packages/database/schema/005_milk_readings.sql` - TimescaleDB table for milk readings
  - Creates `milk_readings` hypertable with time-series partitioning
  - Creates continuous aggregates for fast queries (`milk_daily_per_animal`, `milk_daily_per_tenant`)
  - Creates helper functions (`get_daily_milk_production`, `get_animal_milk_production`, `get_latest_milking`)
  - Sets up compression policies and RLS

### Seed Data
- `packages/database/seed/milk_readings.sql` - Generates 60 days of realistic milk production data
  - Creates helper function `generate_milk_readings_for_cow`
  - Generates 3 milkings per day (morning, afternoon, evening) for all lactating cows
  - Includes realistic variations and edge cases

### API Layer
- `apps/web/src/lib/data/milk-production.ts` - API functions for milk production data
  - `getDailyMilkProduction(days)` - Get herd-level daily milk production
  - `getAnimalMilkProduction(animalId, days)` - Get individual cow production
  - `getLatestMilking(animalId)` - Get most recent milking session
  - `getMilkProductionStats()` - Get aggregated statistics with trends
  - `getMilkQualityAlerts()` - Get cows with abnormal milk readings

### Frontend Changes
- `apps/web/src/app/page.tsx` - Updated Dashboard to use real data instead of mocks
  - Replaced `generateSampleMilkProductionData` with `getDailyMilkProduction`
  - Chart now displays real time-series data from TimescaleDB

### Scripts
- `scripts/apply-migrations.sh` - Automated migration script (requires local Supabase)

## Prerequisites

1. **Supabase Running**: Your Supabase instance must be running
   ```bash
   cd packages/database
   pnpm db:start
   ```

2. **TimescaleDB Extension**: Already installed ✅

## Manual Migration Steps

If the automated script doesn't work, you can apply migrations manually:

### Step 1: Apply Schema Migration

```bash
cd packages/database

# Apply the migration using Supabase CLI
supabase db execute -f schema/005_milk_readings.sql --local
```

**OR** if using direct PostgreSQL connection:

```bash
# Get your DATABASE_URL from Supabase
supabase status

# Apply migration
psql $DATABASE_URL -f schema/005_milk_readings.sql
```

### Step 2: Load Seed Data

```bash
# Load development seed data (if not already loaded)
supabase db execute -f seed/development.sql --local

# Load milk readings seed data
supabase db execute -f seed/milk_readings.sql --local
```

### Step 3: Verify Installation

```sql
-- Check that the table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'milk_readings';

-- Check hypertable status
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_name = 'milk_readings';

-- Check continuous aggregates
SELECT view_name FROM timescaledb_information.continuous_aggregates;

-- Verify data
SELECT COUNT(*) FROM milk_readings;

-- Test daily aggregate
SELECT day, total_milk_kg, cows_milked
FROM milk_daily_per_tenant
ORDER BY day DESC
LIMIT 7;
```

### Step 4: Refresh Continuous Aggregates

After loading seed data, refresh the materialized views:

```sql
-- Refresh aggregates to include seed data
CALL refresh_continuous_aggregate('milk_daily_per_animal', NULL, NULL);
CALL refresh_continuous_aggregate('milk_daily_per_tenant', NULL, NULL);
```

## Automated Script Usage

```bash
chmod +x scripts/apply-migrations.sh
./scripts/apply-migrations.sh
```

The script will:
1. Check if Supabase is running
2. Apply migrations 003, 004, and 005
3. Load development and milk_readings seed data
4. Refresh continuous aggregates

## Verification Checklist

After migration, verify:

- [ ] `milk_readings` table exists
- [ ] Table is a TimescaleDB hypertable (check `timescaledb_information.hypertables`)
- [ ] Continuous aggregates exist (`milk_daily_per_animal`, `milk_daily_per_tenant`)
- [ ] Helper functions exist (`get_daily_milk_production`, etc.)
- [ ] Seed data loaded (query `SELECT COUNT(*) FROM milk_readings`)
- [ ] Dashboard displays real milk production chart (no errors in browser console)
- [ ] Chart shows data for last 30 days
- [ ] Load time < 500ms

## Troubleshooting

### Error: "relation milk_readings already exists"
The table was already created. You can skip the schema migration or use `DROP TABLE milk_readings CASCADE;` to recreate.

### Error: "function auth.tenant_id() does not exist"
Your auth schema is missing the tenant_id() helper function. Check `001_core_tables.sql` for the function definition.

### Error: "continuous aggregate policy already exists"
This is safe to ignore - the policy was already created.

### No data in dashboard chart
1. Check that seed data was loaded: `SELECT COUNT(*) FROM milk_readings;`
2. Refresh continuous aggregates manually (see Step 4 above)
3. Check browser console for API errors
4. Verify tenant_id is correctly set in your user session

### Slow queries
1. Check that hypertable was created properly
2. Ensure continuous aggregates are refreshed
3. Check compression policy status: `SELECT * FROM timescaledb_information.jobs;`

## Next Steps

After completing Phase 1, Task #1, proceed to:
- **Task #2**: Implement hoof care with real data
- **Task #3**: Implement udder health tests
- **Task #4**: Implement dynamic sidebar counters

See the main development plan in `CLAUDE.md` for full roadmap.
