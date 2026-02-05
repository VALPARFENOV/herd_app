# API Reference — HerdMaster Pro

## Base URL
- **Production:** `https://herd.b2bautomate.ru/rest/v1/rpc/`
- **Local:** `http://localhost:54321/rest/v1/rpc/`

## Authentication
```
Headers:
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <USER_JWT_TOKEN>
  Content-Type: application/json
```

## Supabase Client (TypeScript)
```typescript
const { data, error } = await supabase.rpc('function_name', { params })
```

---

## Implemented RPC Functions

### Module: LIST / COUNT / SUM
**File:** `packages/database/functions/count_and_aggregate.sql`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `list_animals()` | p_fields TEXT[], p_filter TEXT, p_sort TEXT, p_limit INT, p_offset INT | JSON | Список животных с фильтрацией |
| `count_animals()` | p_filter TEXT, p_group_by TEXT | JSON | Подсчёт с группировкой |
| `sum_animals()` | p_field TEXT, p_filter TEXT, p_group_by TEXT | JSON | Суммирование поля |

### Module: BREDSUM (Breeding Summary)
**File:** `packages/database/functions/bredsum_basic.sql`, `bredsum_variants.sql`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `bredsum_basic()` | p_days INT DEFAULT 365 | JSON | Базовая сводка осеменений |
| `bredsum_by_sire()` | p_days INT | JSON | По быкам |
| `bredsum_by_tech()` | p_days INT | JSON | По техникам |
| `bredsum_by_month()` | p_days INT | JSON | По месяцам |
| `bredsum_by_service_number()` | p_days INT | JSON | По номеру осеменения |
| `bredsum_by_dim()` | p_days INT | JSON | По DIM |
| `bredsum_by_lactation()` | p_days INT | JSON | По лактации |
| `bredsum_by_pen()` | p_days INT | JSON | По загону |
| `bredsum_conception_trend()` | p_days INT | JSON | Тренд зачатия |
| `bredsum_heat_detection()` | p_days INT | JSON | Детекция охоты |
| `bredsum_pregnancy_risk()` | p_days INT | JSON | Риск стельности |
| `bredsum_do_not_breed()` | | JSON | DNB список |

### Module: PLOT (Production Plots)
**File:** `packages/database/functions/plot_functions.sql`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `plot_lactation_curve()` | p_animal_id UUID, p_lactation INT | JSON | Кривая лактации |
| `plot_herd_lactation_curve()` | p_lactation INT, p_group_by TEXT | JSON | Средняя кривая стада |
| `plot_production_trend()` | p_field TEXT, p_days INT | JSON | Тренд продуктивности |
| `plot_scc_trend()` | p_days INT | JSON | Тренд соматических клеток |
| `plot_dim_distribution()` | | JSON | Распределение DIM |

### Module: GRAPH (Statistical Graphs)
**File:** `packages/database/functions/graph_functions.sql`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `graph_histogram()` | p_field TEXT, p_bins INT, p_filter TEXT | JSON | Гистограмма распределения |
| `graph_scatter()` | p_x_field TEXT, p_y_field TEXT, p_filter TEXT | JSON | Scatter plot |
| `graph_field_statistics()` | p_field TEXT, p_filter TEXT | JSON | Статистика поля |

### Module: ECON (Economics)
**File:** `packages/database/functions/econ_functions.sql`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `calculate_economics()` | p_days INT DEFAULT 30 | JSON | Выручка, затраты, IOFC, прибыль |
| `calculate_iofc_by_pen()` | p_days INT | JSON | IOFC по загонам |
| `calculate_profitability_trends()` | p_period TEXT, p_days INT | JSON | Тренды рентабельности |
| `get_cost_breakdown()` | p_days INT, p_group_by TEXT | JSON | Структура затрат |

### Module: COWVAL (Cow Valuation)
**File:** `packages/database/functions/cowval_functions.sql`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `calculate_cow_value()` | p_animal_id UUID | JSON | Оценка стоимости коровы |
| `update_cow_valuations()` | | JSON | Пакетное обновление всех оценок |
| `get_cowval_report()` | p_sort_by TEXT, p_limit INT | JSON | Отчёт COWVAL |
| `get_valuation_summary()` | | JSON | Сводная статистика стоимости стада |

---

## Database Views

| View | Description | Key Fields |
|------|-------------|------------|
| `animals_with_calculated` | 32 вычисляемых поля | DIM, LACT, MILK, FAT, PROT, SCC, REPRO, RC, CWVAL... |
| `milk_test_series` | Серии контрольных доек | test_date, milk, fat, protein, scc |
| `lactation_performance` | Показатели по лактации | 305ME, peak, persistency |
| `production_trends` | Тренды продуктивности | daily, weekly, monthly aggregates |
| `breeding_outcomes` | Результаты осеменений | conception_rate, services_per_conception |

---

## Database Tables (Core)

| Table | Description | RLS |
|-------|-------------|-----|
| `tenants` | Организации/фермы | ✅ |
| `profiles` | Пользователи | ✅ |
| `animals` | Животные (33 stored fields) | ✅ |
| `events` | Все события | ✅ |
| `lactations` | Лактации | ✅ |
| `milk_readings` | Контрольные дойки | ✅ |
| `barns` | Корпуса | ✅ |
| `pens` | Загоны | ✅ |
| `bulls` | Быки | ✅ |
| `treatments` | Лечения | ✅ |
| `economic_settings` | Настройки экономики | ✅ |
| `cost_entries` | Записи затрат | ✅ |
| `milk_sales` | Продажи молока | ✅ |
| `cow_valuations` | Оценки стоимости (кэш) | ✅ |
| `report_templates` | Шаблоны отчётов (JSONB) | ✅ |

---

## Helper Functions

| Function | Description |
|----------|-------------|
| `auth.tenant_id()` | UUID текущего tenant из JWT |
| `auth.has_role(role)` | Проверка роли пользователя |

---

## Adding New Functions

При добавлении новой RPC-функции:
1. Создай файл: `packages/database/functions/{module}_functions.sql`
2. Naming: `{module}_{action}()` — уникальное имя с модульным префиксом
3. Добавь в эту таблицу выше
4. Обнови `contracts/types.ts` с типом ответа
5. Задеплой: `./scripts/db-query.sh --file <path>` или MCP `execute_sql`
