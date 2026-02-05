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

## Completed Phases

- **Phase 1:** CLI Foundation — LIST, COUNT, SUM, calculated fields, RC codes
- **Phase 2:** BREDSUM — 12 breeding summary variants
- **Phase 3:** PLOT, GRAPH, EVENTS — production analysis, 8 chart functions
- **Phase 4:** ECON, COWVAL — economics, cow valuation, custom report builder
- **DairyComp 305 parity:** 90% (9/10 modules)

See `features/done/` for detailed summaries of each phase.

## Planned Features (Next)

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

## Supabase Agent (`/supabase`)

Slash command for managing the self-hosted Supabase instance.

### Usage

```
/supabase deploy <function-name>
/supabase deploy all
/supabase status
/supabase logs <service> [lines]
/supabase restart <service>
/supabase query "SELECT ..."
/supabase migrate <file>
/supabase migrate all
/supabase create user
/supabase seed
/supabase env
```

### Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/supabase-status.sh` | Docker services, disk, memory status |
| `scripts/supabase-logs.sh` | View service logs |
| `scripts/db-query.sh` | Execute SQL (inline or `--file`) |
| `scripts/deploy-edge-function.sh` | Deploy single function (`--no-restart`, `--dry-run`) |
| `scripts/deploy-all-functions.sh` | Deploy all functions with single restart |
| `scripts/apply-migration.sh` | Apply single migration to REMOTE server |
| `scripts/apply-all-migrations.sh` | Apply all migrations (`--from`, `--include-initial`) |
| `scripts/create-user.sh` | Create auth + profile user (`--tenant` required) |

## Agent Pipeline

### Feature Development Workflow
Каждая фича проходит через пайплайн агентов:

```
User Story → Product Agent → Backend Agent → QA Agent → Frontend Agent → Release Agent
```

### Файловая структура пайплайна
```
.agents/
├── prompts/           # Системные промпты агентов
│   ├── product.md     # Product Agent
│   ├── backend.md     # Backend Agent
│   ├── qa.md          # QA Agent
│   ├── frontend.md    # Frontend Agent
│   └── release.md     # Release Agent
└── templates/         # Шаблоны документов
    ├── feature-spec.md
    ├── handoff.md
    └── user-story.md

features/
├── active/            # Фичи в работе
│   └── feat-xxx/
│       ├── spec.md
│       ├── decisions.md
│       └── handoffs/
│           ├── 01-product.md
│           ├── 02-backend.md
│           ├── 03-qa.md
│           └── 04-frontend.md
└── done/              # Завершённые фичи

contracts/
├── types.ts           # Общие типы контрактов
└── api-reference.md   # API reference (RPC functions)
```

### Перед началом работы как агент
1. Прочитай свой промпт: `.agents/prompts/{role}.md`
2. Прочитай спеку фичи: `features/active/{feat-name}/spec.md`
3. Прочитай предыдущий хэндофф (если есть)
4. Прочитай `CONVENTIONS.md`
5. Прочитай `contracts/` для понимания текущих контрактов

### Золотые правила
- Контракты в `contracts/` — источник правды для типов и API
- Не меняй контракты без документирования в хэндоффе
- Каждый агент завершает работу хэндоффом
- Код должен компилироваться после каждого этапа
- Следуй паттернам существующего кода

### Доступные MCP-серверы и плагины

#### Supabase MCP (`mcp__supabase-self-hosted__*`)
- `execute_sql` — выполнить SQL на production PostgreSQL
- `list_tables` — список таблиц
- `list_migrations` — список миграций
- `apply_migration` — применить миграцию
- `generate_typescript_types` — генерация типов
- `list_auth_users` / `create_auth_user` — управление пользователями
- `list_extensions` — расширения PostgreSQL
- `get_project_url` — URL проекта

#### Playwright MCP (`mcp__plugin_playwright_playwright__*`)
Браузерная автоматизация и тестирование:
- `browser_navigate` — перейти на URL
- `browser_snapshot` — accessibility snapshot (лучше скриншота для анализа)
- `browser_take_screenshot` — визуальный скриншот
- `browser_click` / `browser_type` / `browser_fill_form` — взаимодействие
- `browser_evaluate` — выполнить JavaScript
- `browser_console_messages` — ошибки в консоли
- `browser_network_requests` — сетевые запросы
- `browser_wait_for` — ожидание элементов

#### Figma MCP (`mcp__figma__*`)
- `get_figma_data` — получить структуру и данные из Figma-файла
- `download_figma_images` — скачать изображения/иконки

### Быстрый запуск фичи
```bash
# 1. Создай фичу
./.agents/run.sh product feat-my-feature

# 2. Или вручную в Claude Code:
# "Ты — Product Agent. Прочитай .agents/prompts/product.md
#  Фича: features/active/feat-my-feature/
#  User Story: ..."
```

## Session Logs

После каждой рабочей сессии перед коммитом записывай краткий итог в файл:
- Папка: `.claude/sessions/`
- Формат имени: `YYYY-MM-DD-краткое-описание.md`
- Содержимое: дата, что сделано (кратко), важные решения, следующие шаги

При старте новой сессии читай последние 2-3 файла из этой папки для контекста.

## References

- Product specification: `saas_concept.md`
- Feature hierarchy: `features_hierarchy.md`
- User stories: `docs/user-stories.md`
- Screen designs: `docs/screens.md`
- Architecture: `docs/architecture.md`
- Architecture plan: `.claude/plans/generic-beaming-melody.md`
- Session logs: `.claude/sessions/`
- **Code conventions:** `CONVENTIONS.md`
- **Agent prompts:** `.agents/prompts/`
- **Agent templates:** `.agents/templates/`
- **API contracts:** `contracts/api-reference.md`
- **Type contracts:** `contracts/types.ts`
- **Completed features:** `features/done/`
- **Active features:** `features/active/`
- **Pipeline docs:** `docs/future_pipelain.md`
