# Phase 2: BREDSUM — Breeding Management

**Status:** ✅ Complete
**Period:** January 2026

## What was built
- 12 BREDSUM variants (basic, by sire, by tech, by month, by DIM, etc.)
- Breeding outcomes VIEW
- Conception rate, pregnancy rate, heat detection rate calculations
- Breeding dashboard page (/breeding)
- BREDSUM report page (/reports/bredsum)

## Key Files
- `packages/database/schema/012_breeding_outcomes_view.sql`
- `packages/database/functions/bredsum_basic.sql`
- `packages/database/functions/bredsum_variants.sql`
- `apps/web/src/app/breeding/page.tsx`
- `apps/web/src/app/reports/bredsum/page.tsx`

## Decisions
- 12 variants cover all DairyComp BREDSUM commands
- DNB (Do Not Breed) as separate function
- Days parameter with 365 default
