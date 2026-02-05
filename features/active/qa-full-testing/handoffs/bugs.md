# Bug Registry - QA Full Testing

## Summary
| Severity | Open | Fixed | Verified |
|----------|------|-------|----------|
| Critical | 3 | 0 | 0 |
| Major | 4 | 0 | 0 |
| Minor | 3 | 0 | 0 |

---

## Bugs

### BUG-1: Missing `breeding_outcomes` table — all BREDSUM RPCs fail
- Severity: **critical**
- Component: backend
- Steps: `SELECT public.calculate_bredsum_basic(...)` or any `calculate_bredsum_*` function
- Expected: JSON result with breeding statistics
- Actual: `ERROR: relation "public.breeding_outcomes" does not exist`
- Affected functions: ALL 12 BREDSUM variants (basic, by_service, by_month, by_technician, by_sire, by_pen, by_dim, by_dow, 21day, heat_detection, qsum)
- Status: **OPEN**

### BUG-2: Missing `lactation_performance` view — all GRAPH RPCs fail
- Severity: **critical**
- Component: backend
- Steps: `SELECT * FROM public.graph_histogram(...)` or any `graph_*` function
- Expected: JSON result with histogram/scatter/statistics data
- Actual: `ERROR: relation "public.lactation_performance" does not exist`
- Affected functions: graph_histogram, graph_scatter, graph_field_statistics
- Status: **OPEN**

### BUG-3: Missing `milk_test_series` view — all PLOT RPCs fail
- Severity: **critical**
- Component: backend
- Steps: `SELECT * FROM public.plot_by_dim(...)` or any `plot_*` function
- Expected: JSON result with plot data points
- Actual: `ERROR: relation "public.milk_test_series" does not exist`
- Affected functions: plot_by_dim, plot_by_date, plot_by_lactation, plot_by_pen
- Status: **OPEN**

### BUG-4: Missing economics RPC functions
- Severity: **major**
- Component: backend
- Steps: Search for `calculate_economics`, `calculate_iofc_by_pen`, `calculate_profitability_trends`, `get_cost_breakdown`
- Expected: Functions exist in public schema
- Actual: None of the 4 economics functions exist
- Note: Economics Dashboard UI renders but shows placeholder/mock data
- Status: **OPEN**

### BUG-5: Missing COWVAL RPC functions
- Severity: **major**
- Component: backend
- Steps: Search for `calculate_cow_value`, `update_cow_valuations`, `get_cowval_report`, `get_valuation_summary`
- Expected: Functions exist in public schema
- Actual: None of the 4 COWVAL functions exist
- Status: **OPEN**

### BUG-6: Report Builder — PEN shows raw UUIDs instead of pen names
- Severity: **major**
- Component: frontend
- Steps: `/reports/builder` -> Run Report with PEN field
- Expected: Pen names like "Pen 1A - High Producers"
- Actual: Raw UUIDs like `11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
- Status: **OPEN**

### BUG-7: Report Builder — DIM column always shows "-"
- Severity: **major**
- Component: frontend/backend
- Steps: `/reports/builder` -> Run Report with DIM field
- Expected: Calculated DIM values (e.g., 756, 730, etc. as shown on Animals page)
- Actual: All rows show "-" for DIM
- Note: DIM is a calculated field (from `animals_with_calculated` view or last_calving_date)
- Status: **OPEN**

### BUG-8: Missing `report_templates` table
- Severity: **minor**
- Component: backend
- Steps: Navigate to `/reports/builder`
- Expected: Template library loads
- Actual: Console error "Failed to load report templates" — 404 on `report_templates` table
- Status: **OPEN**

### BUG-9: Missing `get_unread_notification_count` RPC — 404 on every page
- Severity: **minor**
- Component: backend
- Steps: Navigate to any page
- Expected: Notification count loads
- Actual: 404 on `/rest/v1/rpc/get_unread_notification_count` (2 calls per page)
- Note: Function exists in DB but PostgREST may not expose it; OR anon role lacks EXECUTE permission
- Status: **OPEN**

### BUG-10: Login `?next=` redirect not working
- Severity: **minor**
- Component: frontend
- Steps: Navigate to `/animals` while unauthenticated -> redirects to `/auth/login?next=%2Fanimals` -> login -> should redirect to `/animals`
- Expected: After login, redirect to `/animals`
- Actual: Redirects to `/` (dashboard) instead
- Status: **OPEN**

### BUG-11: 201 TypeScript errors (noEmit)
- Severity: **major** (overall code quality)
- Component: frontend
- Steps: `npx tsc --noEmit`
- Expected: 0 errors
- Actual: 201 errors across 20 files
- Top offenders: vet-lists.ts (38), monitor/page.tsx (30), economics/page.tsx (23), hoof-care.ts (17), udder-health.ts (16)
- Root cause: DB generated types out of sync with code — many tables/views referenced in code don't exist in DB types
- Status: **OPEN**
