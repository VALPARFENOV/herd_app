# CONVENTIONS.md — HerdMaster Pro

## Язык

- Код, комментарии в коде, названия переменных, Git-коммиты — **English**
- UI-тексты, документация фич, хэндоффы — **Russian** (целевая аудитория — российские фермы)
- Файлы `spec.md`, `handoffs/` — Russian

## TypeScript

### Общие правила
- Strict mode (`"strict": true` в tsconfig)
- Path alias `@/` → `./src/`
- Никаких `any` — используй `unknown` + type guards
- Интерфейсы для объектов, `type` для unions/intersections
- Импорты: абсолютные через `@/`, сортировка: внешние → внутренние → типы

### Naming
- Файлы компонентов: `PascalCase.tsx` (AnimalCard.tsx)
- Файлы утилит/хуков: `camelCase.ts` (useAnimals.ts, formatDate.ts)
- Файлы страниц: `page.tsx` (Next.js App Router convention)
- Константы: `UPPER_SNAKE_CASE`
- Типы/интерфейсы: `PascalCase` с суффиксом по контексту (`AnimalRow`, `CreateAnimalInput`)
- Enums: не использовать — предпочитаем union types (`type Status = 'active' | 'inactive'`)

### Типы БД
- Все типы таблиц: `apps/web/src/types/database.ts`
- Row/Insert/Update паттерн из Supabase
- Генерация типов: `pnpm db:generate-types`

## SQL / PostgreSQL

### Schema conventions
- Все таблицы имеют `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- PK: `id UUID DEFAULT uuid_generate_v4() PRIMARY KEY`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
- Soft delete: `deleted_at TIMESTAMPTZ` (где применимо)
- Индексы: всегда включай `tenant_id` первым в составных индексах

### RLS (Row Level Security)
- КАЖДАЯ таблица должна иметь RLS policies
- Helper: `auth.tenant_id()` — tenant из JWT
- Helper: `auth.has_role(role)` — проверка роли
- Паттерн policy:
  ```sql
  CREATE POLICY "tenant_isolation" ON table_name
    FOR ALL USING (tenant_id = auth.tenant_id());
  ```

### RPC Functions
- Размещение: `packages/database/functions/{module_name}.sql`
- Naming: `{module}_{action}()` (например `econ_calculate_iofc`, `bredsum_basic`)
- SECURITY DEFINER для функций с доступом к данным
- Всегда фильтруй по `auth.tenant_id()` внутри функции
- Возвращай JSON через `json_build_object` / `json_agg`
- Используй `STABLE` для read-only функций

### Миграции
- Файлы: `packages/database/schema/NNN_description.sql` (NNN — порядковый номер)
- Каждая миграция — идемпотентная (`IF NOT EXISTS`, `CREATE OR REPLACE`)
- Деплой: `./scripts/apply-migration.sh <path>` или `./scripts/apply-all-migrations.sh`

## React / Next.js

### Компоненты
- Server Components по умолчанию
- Client Components: только с `'use client'` — для интерактивности, хуков, browser API
- UI-библиотека: **shadcn/ui** (button, card, table, tabs, badge, select, dialog, sheet...)
- Стилизация: **Tailwind CSS** — утилитарные классы, без кастомного CSS
- Иконки: `lucide-react`

### Структура компонентов
```
src/components/
├── ui/          # shadcn/ui primitives (не редактируем вручную)
├── layout/      # Header, Sidebar, AppLayout
├── dashboard/   # Виджеты дашборда
├── animals/     # Компоненты для животных
├── reports/     # Компоненты отчётов
└── shared/      # Переиспользуемые компоненты проекта
```

### Страницы (App Router)
- `src/app/{section}/page.tsx` — страница раздела
- `src/app/{section}/[id]/page.tsx` — детальная страница
- `src/app/{section}/layout.tsx` — layout раздела (если нужен)

### Data Fetching
- Supabase client: `@/lib/supabase/client` (browser) / `@/lib/supabase/server` (RSC)
- RPC вызовы: `supabase.rpc('function_name', { params })`
- Типизация: используй типы из `@/types/database`

## CLI Module (DairyComp 305 parity)

### Команды
- Файлы: `apps/web/src/lib/cli/commands/{command}.ts`
- Naming: lowercase (list.ts, count.ts, econ.ts, cowval.ts)
- Каждая команда экспортирует функцию-обработчик
- Паттерн команд с вариантами: `COMMAND\VARIANT` (BREDSUM\S, ECON\PEN)

### Calculated Fields
- VIEW: `animals_with_calculated` — 32 вычисляемых поля
- Маппинг полей: `apps/web/src/lib/cli/field-mapping.ts`
- Коды RC: 0-8 (DairyComp standard)

## Git

### Commits
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Scope по модулю: `feat(econ):`, `fix(bredsum):`, `feat(schema):`
- Co-authored by Claude: добавляется автоматически
- Один коммит = одна логическая единица

### Branches
- `main` — основная ветка
- Фичи: `feat/{feature-name}` (например `feat/milk-production-module`)
- Фиксы: `fix/{issue-description}`

## Тестирование

### Структура
- `apps/web/__tests__/` — тесты Next.js приложения
- `packages/database/__tests__/` — тесты БД/RLS
- `test_*.py` — Python-скрипты для E2E тестирования API

### Инструменты
- **Playwright MCP** — для UI-тестирования через браузер
- **Supabase MCP** — для тестирования SQL и RPC напрямую
- curl — для ручного тестирования API endpoints

## Деплой

### Scripts (в корне `scripts/`)
| Script | Назначение |
|--------|-----------|
| `supabase-status.sh` | Статус Docker-сервисов |
| `supabase-logs.sh` | Логи сервисов |
| `db-query.sh` | Выполнить SQL |
| `deploy-edge-function.sh` | Деплой одной функции |
| `deploy-all-functions.sh` | Деплой всех функций |
| `apply-migration.sh` | Применить одну миграцию |
| `apply-all-migrations.sh` | Применить все миграции |
| `create-user.sh` | Создать пользователя |

### Slash command
- `/supabase status` — проверить статус
- `/supabase deploy all` — задеплоить функции
- `/supabase migrate all` — применить миграции
- `/supabase query "SQL"` — выполнить SQL
