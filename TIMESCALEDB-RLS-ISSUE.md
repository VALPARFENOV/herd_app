# TimescaleDB + RLS Compatibility Issue

## Problem

TimescaleDB continuous aggregates and compression are **incompatible** with PostgreSQL Row Level Security (RLS).

### Errors Encountered

```sql
-- Attempting to enable compression
ALTER TABLE milk_readings SET (timescaledb.compress, ...);
-- ERROR: columnstore cannot be used on table with row security

-- Attempting to create continuous aggregate
CREATE MATERIALIZED VIEW milk_daily_per_animal
WITH (timescaledb.continuous) AS ...
-- ERROR: cannot create continuous aggregate on hypertable with row security
```

## Root Cause

- **RLS (Row Level Security)** is essential for multi-tenancy isolation
- **TimescaleDB features** require direct table access without RLS filtering
- These two features are fundamentally incompatible in current TimescaleDB versions

## Our Solution

### What We Kept
✅ **Hypertable partitioning** - Works fine with RLS
✅ **time_bucket()** function - Works fine with RLS
✅ **Indexes on partitions** - Performance optimization intact

### What We Changed
❌ Removed **continuous aggregates** (pre-calculated views)
❌ Removed **compression policies** (automatic data compression)

✅ Added **direct aggregation in functions** using time_bucket()
✅ Functions use `SECURITY DEFINER` to bypass RLS when safe

## Performance Impact

### Before (planned with continuous aggregates)
- Query time: ~10-20ms
- Data refreshed: Every hour
- Storage: Compressed after 7 days

### After (direct queries)
- Query time: ~50-100ms (still fast!)
- Data aggregated: On demand
- Storage: No compression (manageable for MVP scale)

### Why This Is Acceptable
- **MVP scale:** < 500 cows = ~1500 readings/day = ~550K/year
- **Storage:** ~55MB/year uncompressed (trivial)
- **Query performance:** 100ms is imperceptible to users
- **Hypertable partitioning** still provides excellent query performance

## Alternative Solutions Considered

### 1. Disable RLS ❌
**Rejected** - Security is critical for SaaS multi-tenancy

### 2. Schema-per-tenant ❌
**Rejected** - Adds complexity, reduces scalability

### 3. Application-level filtering ❌
**Rejected** - Bypasses database security, risky

### 4. Separate TimescaleDB instance ❌
**Rejected** - Overengineering for MVP, operational overhead

### 5. Direct queries with time_bucket() ✅
**Selected** - Simple, secure, performant enough for MVP

## Future Optimization Options

If query performance becomes an issue at scale (1000+ cows), consider:

1. **Materialized views without continuous aggregation**
   - Manually refresh daily/hourly
   - RLS applied after materialization

2. **Caching layer** (Redis)
   - Cache daily aggregates for 1 hour
   - Invalidate on new data

3. **Read replicas**
   - Dedicated read replica for analytics queries
   - Main DB for transactional writes

4. **Upgrade TimescaleDB** when RLS support improves
   - Monitor: https://github.com/timescale/timescaledb/issues/1926

## Code Changes Made

### Functions Modified

```sql
-- Instead of querying continuous aggregate:
SELECT * FROM milk_daily_per_tenant WHERE ...

-- We query directly with time_bucket:
SELECT
    time_bucket('1 day', time)::DATE,
    SUM(milk_kg),
    COUNT(DISTINCT animal_id)
FROM milk_readings
WHERE tenant_id = p_tenant_id
  AND time >= CURRENT_DATE - p_days
GROUP BY time_bucket('1 day', time)
```

### Performance Verified

```sql
EXPLAIN ANALYZE
SELECT * FROM get_daily_milk_production(
    '11111111-1111-1111-1111-111111111111',
    30
);

-- Execution time: ~45ms (acceptable!)
-- Index usage: idx_milk_readings_tenant_time (optimal)
```

## Recommendations

### For MVP (Current)
✅ Use current implementation - performance is sufficient

### For Production (500+ cows)
- Monitor query times in production
- Add Redis caching if needed
- Consider materialized views with manual refresh

### For Enterprise (2000+ cows)
- Evaluate dedicated analytics database
- Consider ClickHouse or other OLAP solution
- Separate read/write workloads

## References

- TimescaleDB RLS Issue: https://github.com/timescale/timescaledb/issues/1926
- Supabase Multi-tenancy: https://supabase.com/docs/guides/database/postgres/row-level-security
- Our implementation: `packages/database/schema/005_milk_readings.sql`
