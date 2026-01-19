# CLAUDE.md - HerdMaster Pro

## Project Overview

HerdMaster Pro is a modern SaaS herd management system for dairy farms, built as a next-generation replacement for DairyComp 305. The system targets Russian dairy farms with 50-5000 head of cattle.

## Tech Stack

- **Frontend:** Next.js 14 + React 18 + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + PostgREST + GoTrue Auth + Realtime)
- **Database:** PostgreSQL 15 + TimescaleDB (for time-series data)
- **Mobile:** React Native + Expo + WatermelonDB (offline-first)
- **ML Services:** FastAPI + Python (planned)
- **Cache/Queue:** Redis + BullMQ

## Project Structure

```
herd_app/
├── apps/
│   └── web/                    # Next.js web application
│       └── src/
│           ├── app/            # App Router pages
│           │   ├── page.tsx            # Dashboard
│           │   ├── animals/page.tsx    # Animals list
│           │   └── animals/[id]/       # Animal card with tabs
│           ├── components/
│           │   ├── ui/                 # shadcn/ui components
│           │   ├── layout/             # Header, Sidebar, AppLayout
│           │   ├── dashboard/          # Dashboard widgets
│           │   └── animals/            # Animals-specific components
│           ├── lib/            # Utilities, Supabase client
│           └── types/          # TypeScript types
├── packages/
│   └── database/
│       ├── schema/             # SQL migrations
│       ├── seed/               # Development seed data
│       └── supabase/           # Supabase CLI config
├── services/                   # Backend services (planned)
│   ├── api/                    # NestJS custom API
│   ├── ml/                     # FastAPI ML service
│   └── integrations/           # Equipment integrations
├── deploy/
│   └── docker-compose.yml      # Local development
└── docs/                       # Documentation
```

## Key Concepts

### Multi-tenancy

The system uses a hybrid multi-tenancy approach:
- **Starter/Professional:** Row Level Security (RLS) with `tenant_id` column
- **Enterprise (cloud):** Schema-per-tenant
- **Enterprise (dedicated):** Full Supabase installation on client servers

All tables have `tenant_id` and RLS policies enforcing isolation.

### Core Entities

1. **Tenants** - Organizations/farms using the system
2. **Animals** - Cattle with 33 stored + 109 calculated metrics
3. **Events** - All animal events (breeding, calving, treatments, etc.)
4. **Lactations** - Production records per lactation
5. **Pens/Barns** - Farm structure

### Database Helper Functions

```sql
auth.tenant_id()     -- Get current user's tenant from JWT
auth.has_role(role)  -- Check if user has specific role
```

## Development Commands

```bash
# Start development
pnpm install
pnpm dev                    # Start Next.js dev server

# Database (requires Supabase CLI)
cd packages/database
supabase start              # Start local Supabase
supabase db reset           # Reset and run migrations
supabase gen types typescript --local > ../apps/web/src/types/database.generated.ts

# Docker (alternative to Supabase CLI)
cd deploy
docker-compose up -d        # Start PostgreSQL, Redis, MinIO
```

## Environment Variables

Required for `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start>
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Use `@/` path alias for imports
- Database types in `src/types/database.ts`

### SQL
- All tables have `tenant_id` for multi-tenancy
- Use `uuid_generate_v4()` for primary keys
- Include `created_at`, `updated_at` timestamps
- Soft delete with `deleted_at` where applicable

### Components
- Using shadcn/ui component library (button, card, table, tabs, badge, etc.)
- Tailwind CSS for styling
- Server Components by default, Client Components with 'use client'
- Path alias `@/` maps to `./src/`

### UI Structure
- `AppLayout` - Main layout with Header and Sidebar
- `Header` - Navigation, search, notifications, user menu
- `Sidebar` - Quick access lists (Fresh cows, To breed, etc.)
- Dashboard: StatCard, TaskCounters, AlertsList, RCDistributionChart
- Animals: AnimalsTable, QuickFilters
- Animal Card: Tabbed interface (Overview, Reproduction, Production, Health, History)

## Important Files

- `packages/database/schema/001_core_tables.sql` - Main database schema with RLS
- `packages/database/seed/development.sql` - Test data for development
- `apps/web/src/lib/supabase/` - Supabase client (server/client)
- `apps/web/src/types/database.ts` - Database TypeScript types

## Planned Features (Phase 2+)

1. **Milk Production Module** - Daily milk tracking with TimescaleDB
2. **Mobile App** - React Native with offline sync
3. **Equipment Integrations** - DeLaval, Lely, GEA adapters
4. **ML Models** - Pregnancy prediction, disease detection
5. **VetIS Integration** - Russian veterinary reporting

## Testing

Tests should be placed in:
- `apps/web/__tests__/` - Next.js app tests
- `packages/database/__tests__/` - Database/RLS tests

## Deployment

- **Development:** Supabase CLI locally or docker-compose
- **Production:** Supabase self-hosted on Beget VPS
- **Enterprise:** Dedicated installation via `deploy/docker-compose.dedicated.yml`

## References

- Product specification: `saas_concept.md`
- Feature hierarchy: `features_hierarchy.md`
- User stories: `docs/user-stories.md`
- Screen designs: `docs/screens.md`
- Architecture: `docs/architecture.md`
- Architecture plan: `.claude/plans/generic-beaming-melody.md`
