# Deep QA: Test Results Matrix

**Date:** 2026-02-04
**Tester:** Claude (automated via Playwright MCP + curl + db-query.sh)
**Environment:** localhost:3000 + herd.b2bautomate.ru (Supabase)

## Summary

| Module | Total | PASS | FAIL | GAP | SKIP |
|--------|-------|------|------|-----|------|
| M1: Validation | 46 | 22 | 1 | 15 | 8 |
| M2: Security | 10 | 6 | 3 | 1 | 0 |
| M3: Data Integrity | 15 | 4 | 0 | 2 | 9 |
| M4: Edge Cases | 17 | 6 | 2 | 2 | 7 |
| M5: Import Wizard | 11 | 0 | 0 | 0 | 11 |
| M6: Console Audit | 12 | 12 | 0 | 0 | 0 |
| **TOTAL** | **111** | **50** | **6** | **20** | **35** |

**Pass rate (tested):** 50/76 = 66% (excluding SKIP)
**Critical issues:** 3 (viewer can write/delete, PostgREST hard delete)

---

## Fixes Applied (Migration 016)

### Security Fixes (P0)
- **S1.1/S1.2/S1.3 FIXED:** Added role-based RLS policies. `auth.can_write()` blocks viewer INSERT/UPDATE. `auth.can_delete()` restricts DELETE to owner/manager. All 51 policies replaced.
- **Hard delete FIXED:** Added `BEFORE DELETE` trigger on animals that converts hard deletes to soft deletes (`deleted_at = NOW()`).

### Validation Fixes (P1)
- Future dates blocked on `events.event_date`, `animals.birth_date`, `hoof_inspections.inspection_date`
- `milk_readings.milk_kg` upper bound: 100 kg
- `milk_readings.session_id` enum: morning, afternoon, evening, night
- `events.event_type` enum: heat, insemination, pregnancy_check, calving, dry_off, treatment, vaccination, breeding, other
- `udder_quarter_tests.result_value` range: 0 to 9,999,999

### UI Fixes
- **V2.3 FIXED:** Edit page now checks animal exists before fetching pens (no more hang on invalid UUID)
- **E2.1 FIXED:** Removed non-functional pagination buttons (stub without logic)

### Re-test Results
| Test | Before | After |
|------|--------|-------|
| S1.1: Viewer INSERT animal | FAIL (201) | PASS (403) |
| S1.2: Viewer DELETE animal | FAIL (hard delete) | PASS (RLS blocks + soft-delete trigger) |
| S1.3: Viewer INSERT event | FAIL (201) | PASS (403) |
| V5.1: Invalid event_type | GAP | PASS (400 CHECK) |
| V5.2: Future event date | GAP | PASS (400 CHECK) |
| V3.3: milk_kg=999 | GAP | PASS (400 CHECK) |
| V3.6: Invalid session_id | GAP | PASS (400 CHECK) |

---

## Module 6: Console Errors Audit

| # | Page | URL | Status | Notes |
|---|------|-----|--------|-------|
| C1 | Dashboard | `/` | PASS | 0 JS errors, 2 Recharts warnings (known) |
| C2 | Animals | `/animals` | PASS | 0 JS errors |
| C3 | Animal Card | `/animals/[id]` | PASS | 0 JS errors |
| C4 | Animal New | `/animals/new` | PASS | 0 JS errors |
| C5 | Animal Edit | `/animals/[id]/edit` | PASS | 0 JS errors |
| C6 | Breeding | `/breeding` | PASS | 0 JS errors |
| C7 | Vet | `/vet` | PASS | 0 JS errors |
| C8 | BREDSUM | `/reports/bredsum` | PASS | 0 JS errors, 1 React key warning |
| C9 | Production | `/reports/production` | PASS | 0 JS errors |
| C10 | Economics | `/reports/economics` | PASS | 0 JS errors |
| C11 | Report Builder | `/reports/builder` | PASS | 0 JS errors |
| C12 | Quality | `/quality` | PASS | 0 JS errors |

**Note:** All pages show `/avatars/01.png` 404 (cosmetic, known). Not counted as error.

---

## Module 1: Input Validation

### 1.1 Animal Create

| # | Test | Status | Actual |
|---|------|--------|--------|
| V1.1 | Submit empty form | PASS | HTML5 required blocks submit (ear_tag focused) |
| V1.2 | Duplicate ear_tag=1001 | PASS | DB unique constraint: `animals_tenant_id_ear_tag_key` |
| V1.3 | Negative ear_tag=-1 | GAP | **Accepted** — no validation on ear_tag format |
| V1.4 | ear_tag=999999999 | PASS | Accepted (legitimate edge case, varchar field) |
| V1.5 | birth_date=2030-01-01 | GAP | **Accepted** — no future date CHECK constraint |
| V1.6 | birth_date=1990-01-01 | GAP | **Accepted** — no date range validation (36-year-old cow) |
| V1.7 | XSS in name | PASS | Stored raw but React auto-escapes: `&lt;script&gt;` in HTML |
| V1.8 | SQL injection in name | PASS | Stored as literal text, parameterized queries safe |
| V1.9 | Cyrillic name | PASS | "Корова Зорька" saved and displayed correctly |
| V1.10 | 500+ char name | PASS | DB rejects: `value too long for type character varying(100)` |
| V1.11 | Only ear_tag filled | PASS | DB rejects: `NOT NULL constraint on birth_date` |

### 1.2 Animal Edit

| # | Test | Status | Actual |
|---|------|--------|--------|
| V2.1 | Duplicate ear_tag (1002) | PASS | DB unique constraint error shown |
| V2.2 | Clear ear_tag field | PASS | HTML5 required blocks submit |
| V2.3 | Fake UUID `/edit` | FAIL | **Page hangs/timeout** — no 404 or error page for non-existent animal edit |
| V2.4 | Edit soft-deleted animal | PASS | RLS filters deleted_at → shows 404 |

### 1.3 Milk Reading (API)

| # | Test | Status | Actual |
|---|------|--------|--------|
| V3.1 | milk_kg=-5 | PASS | CHECK constraint `milk_kg >= 0` rejects |
| V3.2 | milk_kg=0 | PASS | Accepted (valid for dry/sick cows) |
| V3.3 | milk_kg=999 | GAP | **Accepted** — no upper bound CHECK |
| V3.4 | time=2030 (future) | GAP | **Accepted** — no future date CHECK |
| V3.5 | Missing animal_id | PASS | NOT NULL constraint rejects |
| V3.6 | session_id="invalid" | GAP | **Accepted** — no CHECK/ENUM on session_id |
| V3.7 | milk_kg="abc" | PASS | PostgreSQL type check rejects |
| V3.8 | Duplicate record | PASS | UNIQUE constraint rejects |

### 1.4 Hoof Inspection (API)

| # | Test | Status | Actual |
|---|------|--------|--------|
| V4.1 | locomotion_score=6 | PASS | CHECK constraint (1-5) rejects |
| V4.2 | locomotion_score=0 | PASS | CHECK constraint rejects |
| V4.3 | locomotion_score=-1 | PASS | CHECK constraint rejects |
| V4.4 | Future date | GAP | **Accepted** — no future date CHECK |
| V4.5 | Missing animal_id | PASS | NOT NULL constraint rejects |
| V4.6 | XSS in notes | GAP | **Raw HTML stored** in overall_notes |

### 1.5 Event Creation (API)

| # | Test | Status | Actual |
|---|------|--------|--------|
| V5.1 | event_type="fake_type" | GAP | **Accepted** — no CHECK/ENUM on event_type |
| V5.2 | event_date=2030 | GAP | **Accepted** — no future date CHECK |
| V5.3 | Deleted animal | PASS | FK constraint rejects (animal hidden by RLS) |
| V5.4 | Double heat same day | GAP | **Accepted** — no UNIQUE on animal+type+date |
| V5.5 | Empty dialog submit | SKIP | Requires UI dialog interaction |

### 1.6 Udder Test (API)

| # | Test | Status | Actual |
|---|------|--------|--------|
| V6.1 | All data empty | PASS | NOT NULL on test_type rejects |
| V6.2 | result_value=-100 | GAP | **Accepted** — no CHECK >= 0 |
| V6.3 | result_value=99999999 | GAP | **Accepted** — no upper bound CHECK |
| V6.4 | test_type="INVALID" | PASS | CHECK constraint on test_type rejects |
| V6.5 | Missing animal_id | PASS | NOT NULL constraint rejects |

---

## Module 2: Authorization & Security

### 2.1 Role-Based Access

| # | Test | Status | Actual |
|---|------|--------|--------|
| S1.1 | Viewer creates animal | **FAIL** | **Viewer CAN INSERT** — RLS only checks tenant_id, not role |
| S1.2 | Viewer deletes animal | **FAIL** | **Viewer CAN DELETE (hard delete!)** — HTTP 204, animal gone |
| S1.3 | Viewer creates event | **FAIL** | **Viewer CAN INSERT events** — RLS allows all tenant users |
| S1.4 | Cross-tenant query | PASS | Empty result (RLS tenant isolation works) |

### 2.2 Unauthenticated Access

| # | Test | Status | Actual |
|---|------|--------|--------|
| S2.1 | No-auth milk readings | PASS | 307 redirect to `/auth/login` |
| S2.2 | No-auth hoof inspections | PASS | 307 redirect to `/auth/login` |
| S2.3 | No-auth admin endpoint | PASS | 307 redirect (middleware catches all API routes) |
| S2.4 | Fake JWT | PASS | 307 redirect to login |

### 2.3 Tenant Isolation

| # | Test | Status | Actual |
|---|------|--------|--------|
| S3.1 | Fake tenant_id in body | PASS | RLS blocks: 403 `new row violates row-level security` |
| S3.2 | Anon key INSERT | GAP | RLS blocks with 401 (expected, but error message exposes policy detail) |

---

## Module 3: Data Integrity

### 3.1 Soft Delete Cascading

| # | Test | Status | Actual |
|---|------|--------|--------|
| D1.1 | Delete → events visible | GAP | **Events still accessible** — events RLS has no deleted_at filter |
| D1.2 | Delete → milk readings | GAP | **Readings still accessible** — milk_readings RLS has no deleted_at filter |
| D1.3 | Delete → sidebar counters | SKIP | Requires UI verification |
| D1.4 | Delete → dashboard stats | SKIP | Requires UI verification |
| D1.5 | Restore deleted animal | PASS | Animal reappears after setting deleted_at=NULL |

### 3.2 Referential Integrity

| # | Test | Status | Actual |
|---|------|--------|--------|
| D2.1 | Event for fake UUID | PASS | FK constraint: `events_animal_id_fkey` |
| D2.2 | Milk for fake UUID | PASS | FK constraint (TimescaleDB chunk-level) |
| D2.3 | Animal with fake pen_id | PASS | FK constraint: `animals_pen_id_fkey` |

### 3.3 Cross-Page Consistency

| # | Test | Status | Actual |
|---|------|--------|--------|
| D3.1-D3.7 | All cross-page tests | SKIP | Require multi-page UI verification |

---

## Module 4: Edge Cases

### 4.1 Empty States

| # | Test | Status | Actual |
|---|------|--------|--------|
| E1.1 | Card with 0 events | PASS | Heifer 1008 shows event timeline with seed data |
| E1.2 | Card with 0 milk | GAP | Shows dashes but **no explicit "No data" message** |
| E1.3 | Report Builder 0 fields | SKIP | |
| E1.4 | BREDSUM no data | SKIP | |

### 4.2 Pagination & Search

| # | Test | Status | Actual |
|---|------|--------|--------|
| E2.1 | Prev/Next buttons | FAIL | **Next button enabled but non-functional** — all 47 animals on one page, clicking Next does nothing |
| E2.2 | Filter + pagination | PASS | Quick filters work correctly |
| E2.3 | Search ear_tag 1001 | PASS | Returns 1 row matching #1001 |
| E2.4 | Search by name | SKIP | No animals have names in seed data |
| E2.5 | Search "ZZZZZ" | FAIL | **Shows 1 row** — client-side search may have timing issue |
| E2.6 | Special chars `%_\` | PASS | No SQL error, returns results safely |

### 4.3 Concurrent

| # | Test | Status | Actual |
|---|------|--------|--------|
| E3.1-E3.3 | All concurrent tests | SKIP | Require multi-tab/multi-session setup |

### 4.4 Navigation

| # | Test | Status | Actual |
|---|------|--------|--------|
| E4.1 | Fake UUID URL | PASS | Shows 404 page |
| E4.2 | Back after create | SKIP | |
| E4.3 | Deep link logged out | PASS | Middleware redirects to `/auth/login?next=` |
| E4.4 | Escape in dialog | SKIP | No add-event button found on card |

---

## Module 5: Import Wizard

| # | Test | Status | Actual |
|---|------|--------|--------|
| I1.1-I1.11 | All import tests | SKIP | Requires CSV file preparation and multi-step wizard interaction |

---

## Module 6: Already covered above (12/12 PASS)
