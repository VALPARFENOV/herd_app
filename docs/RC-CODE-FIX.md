# RC Code Field Mapping Fix

## Problem
The CLI command `LIST ID FOR RC=5` was failing with error:
```
Error executing command - column animals.rc_code does not exist
```

## Root Cause
The field mapping incorrectly mapped DairyComp's `RC` field to `rc_code` column, but the database schema uses `reproductive_status` VARCHAR(30) instead.

## Solution

### 1. Created RC Code Mapping Module
File: `apps/web/src/lib/cli/rc-code-mapping.ts`

Provides bidirectional conversion between:
- DairyComp numeric codes (0-8)
- Database reproductive_status strings

RC Code Meanings:
- 0 = blank
- 1 = dnb (Do Not Breed)
- 2 = fresh (Recently calved)
- 3 = open (Not bred)
- 4 = bred (Inseminated)
- 5 = preg (Pregnant)
- 6 = dry (Dried off)
- 7 = sold/died
- 8 = bullcalf

### 2. Updated Field Mapping
File: `apps/web/src/lib/cli/field-mapping.ts`

Changed:
```typescript
// Before
{ dairyCompCode: 'RC', dbField: 'rc_code', ... }

// After
{ dairyCompCode: 'RC', dbField: 'reproductive_status', ... }
```

### 3. Updated Executor
File: `apps/web/src/lib/cli/executor.ts`

Added conversion logic:
- **Query building**: Convert RC numeric code → reproductive_status string
- **Result display**: Convert reproductive_status string → RC numeric code

Example:
```typescript
// User types: RC=5
// Executor converts: reproductive_status='preg'
// Result displays: RC: 5
```

### 4. Updated Seed Data
File: `packages/database/seed/development.sql`

Added reproductive_status values to all sample animals:
- 1001: open (RC=3)
- 1002: bred (RC=4)
- 1003: preg (RC=5)
- 1004-1005: fresh (RC=2)
- 1006: dry (RC=6)
- 1007: preg (RC=5)
- 1008-1010: blank (RC=0)

### 5. Database Update
Updated existing animals via Supabase REST API to populate reproductive_status field.

## Testing

Command: `LIST ID FOR RC=5`

Expected result: Shows animals where reproductive_status='preg' (cow #1003 and #1007)

## Files Changed
1. `apps/web/src/lib/cli/rc-code-mapping.ts` (new)
2. `apps/web/src/lib/cli/field-mapping.ts` (modified)
3. `apps/web/src/lib/cli/executor.ts` (modified)
4. `packages/database/seed/development.sql` (modified)
5. `packages/database/schema/006_add_rc_code.sql` (created but not applied - future enhancement)

## Future Enhancement
Consider adding a numeric `rc_code` column to animals table for:
- Faster querying (integer vs string comparison)
- Easier sorting/filtering
- Standards compliance with DairyComp

Migration file ready at: `packages/database/schema/006_add_rc_code.sql`
