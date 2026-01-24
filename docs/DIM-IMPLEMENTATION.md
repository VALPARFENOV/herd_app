# DIM и вычисляемые поля - Реализация

## Проблема

Команда `LIST ID LACT DIM FOR RC=3 LACT>2` возвращала ошибку:
```
Error executing command
column animals.dim does not exist
```

## Причина

DIM (Days in Milk) - это вычисляемое поле, которого не было в таблице `animals`. DIM должен вычисляться как:
```
DIM = CURRENT_DATE - last_calving_date
```

## Решение

### 1. Создана database view `animals_with_calculated`

View автоматически вычисляет DIM и другие поля при каждом запросе:

```sql
CREATE OR REPLACE VIEW public.animals_with_calculated AS
SELECT
  a.*,

  -- DIM: Days in Milk
  CASE
    WHEN a.last_calving_date IS NOT NULL
    THEN (CURRENT_DATE - a.last_calving_date)
    ELSE NULL
  END AS dim,

  -- AGE: Age in months
  CASE
    WHEN a.birth_date IS NOT NULL
    THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.birth_date))::INTEGER * 12 +
         EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.birth_date))::INTEGER
    ELSE NULL
  END AS age_months,

  -- DOPN: Days Open
  CASE
    WHEN a.last_calving_date IS NOT NULL
         AND a.reproductive_status NOT IN ('preg', 'dry', 'blank')
    THEN (CURRENT_DATE - a.last_calving_date)
    ELSE NULL
  END AS days_open,

  -- DSLH: Days Since Last Heat
  CASE
    WHEN a.last_heat_date IS NOT NULL
    THEN (CURRENT_DATE - a.last_heat_date)
    ELSE NULL
  END AS days_since_last_heat

FROM public.animals a;
```

### 2. Обновлен executor.ts

Изменен источник данных с `animals` на `animals_with_calculated`:

```typescript
// Before
let query = supabase
  .from('animals')
  .select(selectFields, { count: 'exact' })

// After
let query = supabase
  .from('animals_with_calculated')
  .select(selectFields, { count: 'exact' })
```

### 3. Field mapping уже был готов

В `field-mapping.ts` уже была запись:
```typescript
{ dairyCompCode: 'DIM', dbField: 'dim', description: 'Days in milk', type: 'number', category: 'calculated' }
```

## Вычисляемые поля

Теперь доступны следующие calculated fields:

| DairyComp Code | DB Field | Формула | Описание |
|----------------|----------|---------|----------|
| **DIM** | dim | CURRENT_DATE - last_calving_date | Дней после отела |
| **AGE** | age_months | AGE in months | Возраст в месяцах |
| **DOPN** | days_open | DIM (для не-стельных) | Дней открыта |
| **DSLH** | days_since_last_heat | CURRENT_DATE - last_heat_date | Дней с последней охоты |

## Примеры использования

### Базовые команды с DIM

```bash
# Все коровы с DIM
LIST ID DIM FOR RC=3

# Свежие коровы (DIM < 21)
LIST ID DIM FOR DIM<21

# Коровы более 60 дней в молоке
LIST ID DIM FOR DIM>60

# Коровы 100-200 DIM
LIST ID DIM FOR DIM>100 DIM<200
```

### Команды из скриншота пользователя

```bash
# Опытные коровы готовые к осеменению
LIST ID LACT DIM FOR RC=3 LACT>2
# Результат: коровы в лактации 3+ со статусом OPEN и их DIM
```

### Комбинированные запросы

```bash
# Свежие коровы старше 21 дня (готовы к переводу в OPEN)
LIST ID PEN DIM FOR RC=2 DIM>21

# Высокопродуктивные в начале лактации
LIST ID DIM MILK FOR DIM<100 MILK>40

# Проблемные коровы - долго открыты
LIST ID DIM FOR RC=3 DIM>150

# Анализ по возрасту
LIST ID AGE LACT FOR LACT=1
```

## Тестирование

### Проверка view в БД

```sql
SELECT ear_tag, dim, reproductive_status, last_calving_date
FROM public.animals_with_calculated
WHERE last_calving_date IS NOT NULL
LIMIT 5;
```

**Ожидаемый результат:**
```
ear_tag | dim | reproductive_status | last_calving_date
--------|-----|---------------------|------------------
1001    | 380 | open               | 2024-01-10
1002    | 354 | bred               | 2024-02-05
1003    | 310 | preg               | 2024-03-20
1004    | 19  | fresh              | 2025-01-05
1005    | 12  | fresh              | 2025-01-12
```

### Проверка в CLI

1. Откройте http://localhost:3000
2. Нажмите `/` для фокуса на CLI
3. Введите команду:
   ```
   LIST ID DIM FOR RC=3 LACT>2
   ```
4. Нажмите Enter

**Ожидаемый результат:**
- ✅ Команда выполняется без ошибок
- ✅ Таблица с результатами показывает ID, DIM
- ✅ Отфильтрованы только RC=3 (OPEN) и LACT>2
- ✅ DIM отображается как число дней

### Тестовые данные

В базе есть коровы с разными DIM:

| Ear Tag | RC | LACT | Last Calving | DIM (примерно) |
|---------|----|----|--------------|----------------|
| 1001 | 3 (OPEN) | 3 | 2024-01-10 | ~380 дней |
| 1004 | 2 (FRESH) | 3 | 2025-01-05 | ~19 дней |
| 1005 | 2 (FRESH) | 2 | 2025-01-12 | ~12 дней |
| 1018 | 3 (OPEN) | 3 | 2024-10-20 | ~96 дней |
| 1019 | 3 (OPEN) | 4 | 2024-09-15 | ~131 день |

## Команды для тестирования DIM

```bash
# 1. Все животные с DIM
LIST ID DIM

# 2. Свежие коровы (DIM < 21)
LIST ID DIM FOR DIM<21
# Ожидается: 1004, 1005, 1016, 1017, 1047, 1057

# 3. Готовые к осеменению (DIM > 60)
LIST ID DIM FOR RC=3 DIM>60
# Ожидается: коровы OPEN со DIM > 60 дней

# 4. Пиковая лактация (60-120 DIM)
LIST ID DIM MILK FOR DIM>60 DIM<120

# 5. Позже в лактации (DIM > 200)
LIST ID DIM MILK FOR DIM>200

# 6. Опытные свежие (LACT > 2 и DIM < 30)
LIST ID LACT DIM FOR LACT>2 DIM<30

# 7. Долго открытые (проблема!)
LIST ID DIM FOR RC=3 DIM>150

# 8. Сортировка по DIM
LIST ID DIM FOR RC=3 SORT DIM
LIST ID DIM FOR RC=2 SORT DIM DESC
```

## Производительность

- **View overhead:** Минимальный, вычисления простые (дата - дата)
- **Caching:** PostgreSQL кеширует execution plan
- **Indexing:** Базовые индексы на `last_calving_date` уже есть
- **Expected response time:** < 300ms

## Будущие улучшения

### Добавить DCC (Days Carrying Calf)

Требуется добавить поле `conception_date` в таблицу `animals`:

```sql
ALTER TABLE public.animals
ADD COLUMN conception_date DATE;
```

Затем добавить в view:
```sql
-- DCC: Days Carrying Calf (days pregnant)
CASE
  WHEN a.conception_date IS NOT NULL AND a.reproductive_status IN ('preg', 'dry')
  THEN (CURRENT_DATE - a.conception_date)
  ELSE NULL
END AS days_carrying_calf,

-- DUE: Days to Calving
CASE
  WHEN a.conception_date IS NOT NULL AND a.reproductive_status IN ('preg', 'dry')
  THEN 280 - (CURRENT_DATE - a.conception_date)
  ELSE NULL
END AS days_to_calving
```

### Добавить DDRY (Days Dry)

```sql
-- DDRY: Days Dry
CASE
  WHEN a.dry_date IS NOT NULL
  THEN (CURRENT_DATE - a.dry_date)
  ELSE NULL
END AS days_dry
```

## Файлы изменены

1. ✅ `packages/database/schema/007_calculated_fields_view.sql` - SQL для создания view
2. ✅ `apps/web/src/lib/cli/executor.ts` - изменен источник с `animals` → `animals_with_calculated`
3. ✅ View создан через MCP в production БД

## Статус

- ✅ DIM работает
- ✅ AGE работает
- ✅ DOPN работает
- ✅ DSLH работает
- 🔄 DCC - требует добавления conception_date
- 🔄 DUE - требует conception_date
- 🔄 DDRY - требует dry_date

## Troubleshooting

### Ошибка: "relation animals_with_calculated does not exist"

**Решение:** View не создан. Выполнить:
```sql
-- See 007_calculated_fields_view.sql
```

### DIM показывает NULL для всех коров

**Причина:** У коров нет `last_calving_date`

**Решение:** Добавить calving events или заполнить поле вручную

### DIM показывает отрицательное число

**Причина:** `last_calving_date` в будущем (ошибка в данных)

**Решение:** Исправить дату в БД

## Итог

✅ **Проблема решена!** Теперь команда `LIST ID LACT DIM FOR RC=3 LACT>2` работает корректно.

Все вычисляемые поля DairyComp теперь доступны через database view без необходимости дублировать данные или сложных триггеров.
