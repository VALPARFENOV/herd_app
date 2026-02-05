# Product Agent Handoff — QA Bugfix Sprint

## Summary

QA Full Testing completed on 2026-02-04. **11 bugs found** (3 critical, 4 major, 3 minor).
Overall: 34 PASS / 16 FAIL / 5 SKIP = 62% pass rate.

**Root cause:** Migration files 012-015 and RPC function SQL files exist locally but were NEVER deployed to the remote Supabase database. This single root cause accounts for 10 of 16 test failures.

## Bug Assignment Matrix

| Bug | Severity | Agent | Root Cause | Fix |
|-----|----------|-------|------------|-----|
| BUG-1 | critical | Backend | `breeding_outcomes` view not deployed | Deploy `012_breeding_outcomes_view.sql` |
| BUG-2 | critical | Backend | `lactation_performance` view not deployed | Deploy `013_production_analysis.sql` |
| BUG-3 | critical | Backend | `milk_test_series` view not deployed | Deploy `013_production_analysis.sql` |
| BUG-4 | major | Backend | Economics functions not deployed | Deploy `014_economics.sql` + `econ_functions.sql` |
| BUG-5 | major | Backend | COWVAL functions not deployed | Deploy `014_economics.sql` + `cowval_functions.sql` |
| BUG-6 | major | Frontend | PEN shows raw UUIDs | Join pen names in report builder query |
| BUG-7 | major | Frontend | DIM shows "-" | Use calculated DIM from `animals_with_calculated` view |
| BUG-8 | minor | Backend | `report_templates` table missing | Deploy `015_report_templates.sql` |
| BUG-9 | minor | Backend | `get_unread_notification_count` 404 | Grant EXECUTE or create function |
| BUG-10 | minor | Frontend | `?next=` redirect broken | Fix redirect logic in auth callback |
| BUG-11 | major | Frontend | 201 TypeScript errors | Regenerate DB types, fix type mismatches |

## Execution Order

### Phase 1: Backend Agent (BLOCKING — must complete first)
1. Deploy migration `012_breeding_outcomes_view.sql` → fixes BUG-1
2. Deploy migration `013_production_analysis.sql` → fixes BUG-2, BUG-3
3. Deploy migration `014_economics.sql` → creates economics tables for BUG-4, BUG-5
4. Deploy migration `015_report_templates.sql` → fixes BUG-8
5. Deploy all RPC function files:
   - `bredsum_basic.sql` + `bredsum_variants.sql` → 12 BREDSUM functions
   - `plot_functions.sql` → 4 PLOT functions
   - `graph_functions.sql` → 3 GRAPH functions
   - `econ_functions.sql` → 4 economics functions (fixes BUG-4)
   - `cowval_functions.sql` → 4 COWVAL functions (fixes BUG-5)
6. Fix BUG-9: `get_unread_notification_count` — investigate and fix PostgREST exposure
7. Restart PostgREST to pick up new schema

### Phase 2: Frontend Agent (after backend fixes)
1. Regenerate TypeScript types from updated DB schema
2. Fix BUG-6: Report Builder PEN display — replace UUID with pen name via JOIN
3. Fix BUG-7: Report Builder DIM display — use calculated DIM field
4. Fix BUG-10: `?next=` redirect — fix auth callback to honor `next` param
5. Fix BUG-11: TypeScript errors — update types and fix remaining type mismatches

### Phase 3: QA Agent (verification)
Re-run full test matrix, verify all 11 bugs resolved.

## Files Reference

### Migrations (local, NOT deployed)
- `packages/database/schema/012_breeding_outcomes_view.sql`
- `packages/database/schema/013_production_analysis.sql`
- `packages/database/schema/014_economics.sql`
- `packages/database/schema/015_report_templates.sql`

### Functions (local, NOT deployed)
- `packages/database/functions/bredsum_basic.sql`
- `packages/database/functions/bredsum_variants.sql`
- `packages/database/functions/plot_functions.sql`
- `packages/database/functions/graph_functions.sql`
- `packages/database/functions/econ_functions.sql`
- `packages/database/functions/cowval_functions.sql`

### Deployment Scripts
- `./scripts/apply-migration.sh <file>` — apply single migration
- `./scripts/apply-all-migrations.sh` — apply all pending
- `./scripts/db-query.sh "SQL"` — execute SQL directly

## Success Criteria
- All 11 bugs marked VERIFIED in bugs.md
- Test pass rate >= 90% (from current 62%)
- `npx tsc --noEmit` = 0 errors
- 0 console errors on all pages
