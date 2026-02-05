# Validation Gaps Catalog — HerdMaster Pro QA

**Date:** 2026-02-04
**Key finding:** Zero server-side validation in any API route or server action. All validation relies on HTML5 `required` attributes (client-side) and PostgreSQL CHECK/NOT NULL constraints (DB-level).

---

## Priority Scale

- **P1:** Data corruption risk, should fix soon
- **P2:** Data quality issue, fix when convenient
- **P3:** Nice-to-have, low risk

---

## 1. Missing Date Validation (Future Dates Accepted)

All date fields across the system accept future dates (e.g., 2030-01-01).

| Table | Column | Test | Priority |
|-------|--------|------|----------|
| animals | birth_date | V1.5 | P1 |
| milk_readings | time | V3.4 | P1 |
| hoof_inspections | inspection_date | V4.4 | P2 |
| events | event_date | V5.2 | P1 |

**Recommended fix (DB-level):**
```sql
ALTER TABLE animals ADD CONSTRAINT chk_birth_date_not_future
  CHECK (birth_date <= CURRENT_DATE);

ALTER TABLE events ADD CONSTRAINT chk_event_date_not_future
  CHECK (event_date <= CURRENT_DATE + INTERVAL '1 day');

ALTER TABLE hoof_inspections ADD CONSTRAINT chk_inspection_date_not_future
  CHECK (inspection_date <= CURRENT_DATE + INTERVAL '1 day');

-- milk_readings uses TimescaleDB hypertable — CHECK on hypertable may need special handling
```

---

## 2. Missing Numeric Bounds

| Table | Column | Current | Gap | Priority |
|-------|--------|---------|-----|----------|
| animals | ear_tag | varchar, no CHECK | Accepts negative: `-1` (V1.3) | P2 |
| animals | birth_date | date, no range | Accepts 1990 (36-yr-old cow) (V1.6) | P3 |
| milk_readings | milk_kg | CHECK >= 0 | No upper bound: 999 accepted (V3.3) | P1 |
| udder_quarter_tests | result_value | numeric, no CHECK | Accepts -100 (V6.2) and 99999999 (V6.3) | P2 |

**Recommended fix:**
```sql
-- Reasonable upper bound for daily milk yield (~80 kg world record)
ALTER TABLE milk_readings ADD CONSTRAINT chk_milk_kg_upper
  CHECK (milk_kg <= 100);

-- SCC/culture results should be non-negative
ALTER TABLE udder_quarter_tests ADD CONSTRAINT chk_result_value_range
  CHECK (result_value >= 0 AND result_value <= 99999);
```

---

## 3. Missing ENUM/CHECK on Text Fields

| Table | Column | Accepted | Valid Values | Priority |
|-------|--------|----------|-------------|----------|
| milk_readings | session_id | Any string (V3.6) | morning, evening, night | P1 |
| events | event_type | Any string (V5.1) | heat, insemination, pregnancy_check, calving, dry_off, treatment, vaccination, other | P1 |

**Recommended fix:**
```sql
ALTER TABLE milk_readings ADD CONSTRAINT chk_session_id_enum
  CHECK (session_id IN ('morning', 'evening', 'night'));

ALTER TABLE events ADD CONSTRAINT chk_event_type_enum
  CHECK (event_type IN (
    'heat', 'insemination', 'pregnancy_check', 'calving',
    'dry_off', 'treatment', 'vaccination', 'other'
  ));
```

---

## 4. Missing Uniqueness Constraints

| Table | Columns | Issue | Priority |
|-------|---------|-------|----------|
| events | animal_id + event_type + event_date | Duplicate heat events on same day accepted (V5.4) | P2 |

**Recommended fix:**
```sql
-- Prevent duplicate events of same type on same day for same animal
CREATE UNIQUE INDEX idx_events_no_dup_per_day
  ON events (tenant_id, animal_id, event_type, event_date)
  WHERE event_type IN ('heat', 'insemination', 'dry_off', 'calving');
```

Note: Some event types (treatment, vaccination) may legitimately occur multiple times per day, so the constraint should be selective.

---

## 5. Missing Input Sanitization

| Table | Column | Issue | Priority |
|-------|--------|-------|----------|
| hoof_inspections | overall_notes | Raw HTML stored (V4.6): `<img onerror=alert(1)>` | P2 |

**Mitigation:** React auto-escapes on display, so no active XSS risk in the web app. However, if data is consumed by other clients (mobile app, reports, exports), raw HTML could be dangerous.

**Recommended fix:** Sanitize HTML in API route before INSERT, or add a DB trigger to strip tags.

---

## 6. Soft Delete Cascade Gaps

| Parent | Child Table | Issue | Priority |
|--------|------------|-------|----------|
| animals (deleted_at) | events | Events for deleted animals still accessible via API (D1.1) | P1 |
| animals (deleted_at) | milk_readings | Readings for deleted animals still accessible via API (D1.2) | P1 |

**Root cause:** Child table RLS policies don't join to `animals` to check `deleted_at`.

**Recommended fix:** Add to child table RLS policies:
```sql
-- Option A: Join-based filter in RLS
CREATE POLICY "events_select" ON events FOR SELECT
  USING (
    tenant_id = auth.tenant_id()
    AND EXISTS (
      SELECT 1 FROM animals
      WHERE animals.id = events.animal_id
      AND animals.deleted_at IS NULL
    )
  );

-- Option B: Cascade deleted_at to child tables via trigger
-- (simpler queries but requires trigger maintenance)
```

---

## 7. UI/UX Validation Gaps

| Page | Issue | Test | Priority |
|------|-------|------|----------|
| `/animals/[id]/edit` | Page hangs for non-existent UUID (no 404) | V2.3 | P1 |
| `/animals` | Next pagination button enabled but non-functional | E2.1 | P2 |
| `/animals` | Search "ZZZZZ" shows 1 row instead of empty state | E2.5 | P2 |
| Animal card | No "No data" message for empty milk production | E1.2 | P3 |

---

## Summary by Priority

| Priority | Count | Description |
|----------|-------|-------------|
| P1 | 9 | Future dates (4), milk_kg upper bound, session_id enum, event_type enum, soft delete cascade (2) |
| P2 | 8 | Negative ear_tag, result_value bounds, duplicate events, HTML in notes, pagination bug, search bug, edit hang |
| P3 | 3 | Old birth dates, empty state message, cosmetic issues |
| **Total** | **20** | |
