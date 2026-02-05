# Session: Deep QA — Validation, Security & Edge Cases

**Date:** 2026-02-04
**Role:** QA Agent (Playwright MCP + curl + db-query.sh)

## What was done

Executed comprehensive Deep QA program: 6 modules, 111 test cases covering input validation, authorization, data integrity, edge cases, import wizard, and console audit.

### Results Summary

| Module | PASS | FAIL | GAP | SKIP |
|--------|------|------|-----|------|
| M1: Validation | 22 | 1 | 15 | 8 |
| M2: Security | 6 | 3 | 1 | 0 |
| M3: Data Integrity | 4 | 0 | 2 | 9 |
| M4: Edge Cases | 6 | 2 | 2 | 7 |
| M5: Import Wizard | 0 | 0 | 0 | 11 |
| M6: Console Audit | 12 | 0 | 0 | 0 |
| **Total** | **50** | **6** | **20** | **35** |

**Pass rate (tested):** 50/76 = 66%

### Critical Findings

1. **No role-based RLS** (S1.1-S1.3): All RLS policies only check `tenant_id`, never user role. Viewer can INSERT, UPDATE, DELETE on all tables.
2. **PostgREST hard delete** (S1.2): DELETE via REST API permanently removes rows, bypassing soft-delete pattern.
3. **Soft delete cascade missing** (D1.1-D1.2): Events and milk_readings for deleted animals remain accessible.

### Other Findings

- 15 validation gaps: no future date checks, no upper bounds on numerics, no ENUM on event_type/session_id
- Edit page hangs for non-existent UUID (V2.3)
- Pagination Next button enabled but non-functional (E2.1)
- Search returns results for non-matching query (E2.5)

## Schema Discoveries

- Table is `udder_quarter_tests` (not `udder_tests`)
- `milk_readings` uses `time` (not `reading_date`), `session_id` (not `session_number`)
- `hoof_inspections` uses `overall_notes` (not `notes`)

## Deliverables

- `features/active/qa-full-testing/deep-test-results.md` — Full PASS/FAIL/GAP matrix
- `features/active/qa-full-testing/security-findings.md` — Security issues with fix recommendations
- `features/active/qa-full-testing/validation-gaps.md` — 20 gaps cataloged with SQL fix suggestions

## Key Decisions

- Classified issues as BUG (must fix) vs GAP (missing validation, acceptable risk)
- XSS in notes fields classified as P2 GAP since React auto-escapes on display
- Duplicate event prevention scoped to specific event types only (heat, insemination, dry_off, calving)

## Next Steps

1. **P0:** Fix RLS policies — add role-based restrictions (viewer = SELECT only)
2. **P0:** Prevent hard delete via PostgREST (remove DELETE from RLS or add trigger)
3. **P1:** Add DB CHECK constraints for future dates and numeric bounds
4. **P1:** Add ENUM constraints for event_type and session_id
5. **P1:** Fix edit page 404 handling for non-existent animals
6. **P2:** Fix pagination and search bugs
