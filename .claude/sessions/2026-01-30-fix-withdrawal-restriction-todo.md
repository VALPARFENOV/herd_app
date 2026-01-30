# 2026-01-30 - Fix TODO: Active Withdrawal Restriction Calculation

## Date
2026-01-30

## What was done
- Searched codebase for TODO comments, found 3 total
- Selected and implemented the TODO in `health-tab.tsx:35`: calculating active withdrawal restrictions from treatment events
- Replaced `const hasActiveRestriction = false` with actual logic that:
  - Filters treatment events with a `withdrawal_date` in their JSONB details
  - Checks if the withdrawal date is today or in the future
  - Extracts drug name, diagnosis, withdrawal end date, and treatment date for display
- Enhanced the restriction card UI to show:
  - The latest withdrawal end date
  - List of treatments causing the restriction (drug/diagnosis + treatment date)

## Key decisions
- Used client-side date comparison (comparing withdrawal_date from event details against `new Date()`) since the data is already loaded
- Normalized today's date to midnight (`setHours(0,0,0,0)`) so a withdrawal ending today still shows as active
- When multiple treatments have active withdrawals, the card shows the latest end date and lists all causing treatments

## Files modified
- `apps/web/src/components/animals/card/health-tab.tsx` (+48, -6)

## Next steps
- Remaining TODOs in codebase:
  - `docs/CLI-TESTING-GUIDE.md:297` - Create cleanup script for test data
  - `.claude/sessions/2026-01-24-phase2-task5-alerts-notifications.md:267` - API endpoint for mark-all-read notifications
