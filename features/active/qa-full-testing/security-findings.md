# Security Findings — HerdMaster Pro QA

**Date:** 2026-02-04
**Severity Scale:** CRITICAL > HIGH > MEDIUM > LOW

---

## CRITICAL: No Role-Based Access Control in RLS (S1.1, S1.2, S1.3)

**Impact:** Any authenticated user within a tenant (including `viewer` role) can INSERT, UPDATE, and DELETE data on ALL tables.

**Root Cause:** All RLS policies only verify `tenant_id = auth.tenant_id()` but never check user role via `auth.has_role()`.

**Current RLS policies:**
```sql
-- animals (ALL policy)
(tenant_id = auth.tenant_id()) AND (deleted_at IS NULL)

-- events (ALL policy)
(tenant_id = auth.tenant_id())

-- milk_readings (ALL policy)
(tenant_id = auth.tenant_id())

-- hoof_inspections (4 separate SELECT/INSERT/UPDATE/DELETE policies)
-- All only check: (tenant_id = auth.tenant_id())

-- lactations (ALL policy)
(tenant_id = auth.tenant_id())
```

**Proof of exploit:**
```bash
# Viewer creates animal — SUCCESS (should be blocked)
curl -X POST .../rest/v1/animals \
  -H "Authorization: Bearer $VIEWER_JWT" \
  -d '{"ear_tag":"HACK","tenant_id":"...","birth_date":"2023-01-01",...}'
# → 201 Created

# Viewer deletes animal — SUCCESS (hard delete!)
curl -X DELETE .../rest/v1/animals?ear_tag=eq.1001 \
  -H "Authorization: Bearer $VIEWER_JWT"
# → 204 No Content — animal permanently gone
```

**Recommended fix:** Split each `ALL` policy into separate SELECT/INSERT/UPDATE/DELETE policies:
```sql
-- SELECT: all tenant users can read
CREATE POLICY "animals_select" ON animals FOR SELECT
  USING (tenant_id = auth.tenant_id() AND deleted_at IS NULL);

-- INSERT: only owner, admin, vet, zootechnician
CREATE POLICY "animals_insert" ON animals FOR INSERT
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND auth.has_role('owner') OR auth.has_role('admin')
        OR auth.has_role('vet') OR auth.has_role('zootechnician')
  );

-- UPDATE: same as INSERT
-- DELETE: only owner, admin
```

**Priority:** P0 — must fix before any production use.

---

## CRITICAL: PostgREST Allows Hard Delete (S1.2)

**Impact:** DELETE via PostgREST REST API permanently removes rows. The app uses soft delete (`deleted_at` timestamp) but PostgREST bypasses this.

**Root Cause:** No BEFORE DELETE trigger to convert hard deletes to soft deletes. RLS DELETE policy exists and allows the operation.

**Recommended fix (choose one):**
1. **Remove DELETE from RLS policies** — no user should ever hard-delete via API
2. **Add BEFORE DELETE trigger** that sets `deleted_at = NOW()` and cancels the DELETE
3. **Restrict DELETE to service_role only** via RLS

**Priority:** P0

---

## PASS: Tenant Isolation Works (S1.4, S3.1, S3.2)

- Cross-tenant queries return empty results (RLS correctly filters)
- Fake `tenant_id` in POST body blocked: `403 new row violates row-level security`
- Anon key INSERT blocked by RLS

---

## PASS: Unauthenticated Access Blocked (S2.1–S2.4)

- All API routes return 307 redirect to `/auth/login` when no session cookie
- Next.js middleware properly protects all `/api/*` routes
- Fake/expired JWT tokens are rejected

---

## MEDIUM: Error Messages Expose Policy Details (S3.2)

**Impact:** When anon key attempts INSERT, error message includes RLS policy name and details.

**Recommended fix:** Configure PostgREST to return generic 403 messages in production.

**Priority:** P2

---

## Summary

| Finding | Severity | Status | Fix Priority |
|---------|----------|--------|-------------|
| No role-based RLS | CRITICAL | OPEN | P0 |
| Hard delete via PostgREST | CRITICAL | OPEN | P0 |
| Tenant isolation | — | PASS | — |
| Unauthenticated access | — | PASS | — |
| Verbose error messages | MEDIUM | OPEN | P2 |
