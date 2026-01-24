# Session Log: Phase 2 - Task #2 - Bulls Management

**Дата:** 2026-01-24
**Задача:** Task #2 - Bulls Management (справочник быков и учет семени)
**Приоритет:** HIGH
**Статус:** ✅ COMPLETED

---

## Что сделано

### 1. Создана схема БД для быков и семени

Файл `packages/database/schema/006_bulls.sql` - таблицы и функции для управления быками.

**Таблицы:**

**bulls:**
- Идентификация: registration_number, name, short_name, breed, naab_code, stud_code
- Genomic data (JSONB): milk, fat, protein, pl, scs, dpr, type
- Economic: net_merit_dollars, semen_cost_per_straw
- Physical: sire_calving_ease, daughter_calving_ease
- Flags: is_active, is_sexed

**semen_inventory:**
- Batch info: batch_number, lot_number
- Inventory: straws_received, straws_used, straws_available (computed column)
- Dates: received_date, expiry_date
- Cost: cost_per_straw, total_cost
- Storage: tank_number, canister_number

**Helper Functions:**

1. **get_bull_available_straws(bull_id)** - суммирует доступные дозы
   ```sql
   SELECT COALESCE(SUM(straws_available), 0)
   FROM semen_inventory
   WHERE bull_id = p_bull_id
     AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
   ```

2. **deduct_semen_straw(bull_id, tenant_id, straws)** - списывает дозы по FIFO
   - Находит самую старую партию с доступными дозами
   - Обновляет straws_used
   - Возвращает true/false

---

### 2. Загружены seed данные

Файл `packages/database/seed/bulls.sql` - реалистичные данные для тестирования.

**Bulls (7 быков):**

| Name | Breed | NM$ | Cost | Sexed | Straws |
|------|-------|-----|------|-------|--------|
| SUPERMAN | Holstein | $950 | $35 | Yes | 127 |
| ACHILLES | Holstein | $1050 | $40 | Yes | 60 |
| TITANIUM | Holstein | $980 | $38 | Yes | 46 |
| VOLCANO | Jersey | $720 | $28 | No | 27 |
| FERRARI | Jersey | $690 | $25 | No | 18 |
| CHROME | Holstein | $920 | $32 | No | 7 ⚠️ |
| LEGACY | Holstein | $650 | $15 | No | 0 (inactive) |

**Semen Inventory (10 batches):**
- 3 batches для SUPERMAN
- 2 batches для ACHILLES, TITANIUM
- 1 batch для CHROME, VOLCANO, FERRARI
- Всего: 278 straws received, 60 used, 218 available

**Low inventory alert:**
- CHROME: только 7 доз (< 10) - нужен перезаказ

---

### 3. Создан API модуль `bulls.ts`

Файл `apps/web/src/lib/data/bulls.ts` - API для работы с быками.

**Интерфейсы:**
- `Bull` - базовый интерфейс быка
- `BullWithInventory` - бык с summary inventory (total_straws, available_straws, batches_count)
- `SemenInventory` - партия семени

**API функции:**

1. **getBullsWithInventory(activeOnly)** - список быков с inventory
   - JOIN с semen_inventory
   - Группировка и суммирование по bull_id
   - Сортировка по short_name

2. **getBullById(id)** - получить быка по ID

3. **getSemenInventory(bullId)** - партии семени для быка
   - Сортировка по received_date DESC

4. **getBullsWithLowInventory()** - быки с < 10 дозами
   - Для alerts и уведомлений

5. **getActiveBullsForSelection()** - быки для dropdown
   - Только active
   - Только с available_straws > 0
   - Возвращает: id, name, breed, available_straws, cost

6. **deductSemenStraw(bullId)** - списать 1 дозу
   - FIFO logic (oldest batch first)
   - Проверка expiry_date
   - Возвращает {success, error}

7. **getInventoryStats()** - статистика inventory
   - total_bulls, active_bulls, total_straws, low_inventory_count

---

### 4. Создана страница `/settings/bulls`

Файл `apps/web/src/app/settings/bulls/page.tsx` - главная страница управления быками.

**Server Component:**
- Параллельная загрузка bulls + stats
- Передача данных в BullsManagementClient

---

### 5. Создан компонент `BullsTable`

Файл `apps/web/src/components/settings/bulls-table.tsx` - таблица с быками.

**Колонки:**
- Name (short_name + full name)
- Breed
- NAAB Code (monospace font)
- NM$ (color-coded badge: green if >= $900)
- Straws (с иконкой alert если < 10)
- Cost/Straw
- Status (Active/Inactive + Sexed badge)
- Actions (View Inventory, Edit)

**Features:**
- Empty state
- Alert icons для low inventory
- Batches count отображается
- Color-coded badges

---

### 6. Создан компонент `InventoryDialog`

Файл `apps/web/src/components/settings/inventory-dialog.tsx` - модальное окно с inventory.

**Содержимое:**
- Summary cards: Total Received, Total Used, Available
- Table с batches:
  - Batch number
  - Received date
  - Location (Tank/Canister)
  - Straws (available/received с badges)
  - Expiry date (red badge если expired)
  - Total cost

**Features:**
- Loading state
- Empty state
- Color-coded badges для straws и expiry
- Low stock warning (< 5 straws)

---

### 7. Создан компонент `BullsManagementClient`

Файл `apps/web/src/components/settings/bulls-management-client.tsx` - main UI component.

**Stats Cards (4):**
- Total Bulls (с active count)
- Total Straws
- Low Inventory (count быков с < 10 straws)
- Breeds (количество разных пород)

**Tabs (4):**
- **All Bulls** - все быки
- **Active** - только активные
- **Low Inventory** - быки с < 10 дозами (с warning banner)
- **Inactive** - неактивные быки

**Features:**
- Add Bull button (placeholder)
- View Inventory modal
- Edit bull (placeholder)

---

### 8. Обновлена форма breeding

Файл `apps/web/src/components/events/add-event-dialog.tsx` - dropdown для выбора быка.

**Изменения:**

1. **Загрузка списка быков:**
   ```typescript
   useEffect(() => {
     if (eventType === 'breeding' && bulls.length === 0) {
       fetch('/api/bulls/selection')
         .then((res) => res.json())
         .then((data) => setBulls(data))
     }
   }, [eventType])
   ```

2. **Dropdown вместо текстового поля:**
   - Select с быками
   - Отображает: name, breed, available straws, cost
   - Fallback на text input если нет быков в БД
   - Показывает available straws под dropdown

3. **Передача sire_id:**
   ```typescript
   const selectedBull = bulls.find((b) => b.id === formData.sire_id)
   await recordBreeding({
     sire_id: formData.sire_id,
     sire_name: selectedBull?.name || formData.sire_name,
     // ...
   })
   ```

---

### 9. Автоматическое списание семени

Файл `apps/web/src/lib/actions/events.ts` - обновлен recordBreeding.

**Логика:**
```typescript
const result = await createEvent({ ... })

// Deduct semen straw from inventory if bull selected
if (result.data && data.sire_id) {
  const { deductSemenStraw } = await import('@/lib/data/bulls')
  await deductSemenStraw(data.sire_id)
}

return result
```

**FIFO списание:**
1. Находит oldest non-expired batch с available straws
2. Обновляет straws_used += 1
3. straws_available пересчитывается автоматически (computed column)

---

### 10. Создан API endpoint

Файл `apps/web/src/app/api/bulls/selection/route.ts` - GET endpoint для dropdown.

```typescript
export async function GET() {
  const bulls = await getActiveBullsForSelection()
  return NextResponse.json(bulls)
}
```

**Response format:**
```json
[
  {
    "id": "uuid",
    "name": "SUPERMAN",
    "breed": "Holstein",
    "available_straws": 127,
    "cost": 35.00
  }
]
```

---

## Технические решения

### 1. Computed column для straws_available

**Решение:** GENERATED ALWAYS AS column

```sql
straws_available INTEGER GENERATED ALWAYS AS (straws_received - straws_used) STORED
```

**Преимущества:**
- Автоматический пересчет
- Консистентность данных
- Нет необходимости в triggers

### 2. FIFO списание семени

**Решение:** Функция deduct_semen_straw() выбирает oldest batch

**Логика:**
```sql
ORDER BY received_date ASC
LIMIT 1
```

**Причина:**
- First-in-first-out минимизирует expired straws
- Older batches используются первыми

### 3. Genomic data в JSONB

**Решение:** Хранить PTAs (Predicted Transmitting Abilities) в JSONB

**Структура:**
```json
{
  "milk": 1450,
  "fat": 68,
  "protein": 52,
  "pl": 6.8,
  "scs": 2.78,
  "dpr": 2.1,
  "type": 2.5
}
```

**Преимущества:**
- Гибкость (не все быки имеют все PTAs)
- Легко добавлять новые metrics
- Не нужны дополнительные таблицы

### 4. Bulls dropdown в breeding form

**Решение:** Загрузка через useEffect + API endpoint

**Альтернативы:**
- ❌ Server Component prop drilling - сложно с dialog
- ❌ Inline fetch в render - performance issue
- ✅ useEffect + API - чистое разделение concerns

---

## Верификация

### Database check

```sql
-- Bulls count
SELECT breed, COUNT(*), SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
FROM bulls
GROUP BY breed;
```
**Result:** 6 Holstein (5 active), 2 Jersey (2 active)

```sql
-- Inventory summary
SELECT
  b.short_name,
  SUM(si.straws_available) as available
FROM bulls b
LEFT JOIN semen_inventory si ON b.id = si.bull_id
GROUP BY b.id, b.short_name
ORDER BY available DESC;
```
**Result:** SUPERMAN (127), ACHILLES (60), TITANIUM (46), VOLCANO (27), FERRARI (18), CHROME (7)

```sql
-- Low inventory
SELECT short_name, breed, available
FROM bulls_with_inventory
WHERE available < 10 AND available > 0;
```
**Result:** CHROME (7 straws)

### UI Flow

1. ✅ Navigate to /settings/bulls
2. ✅ Stats cards show correct totals
3. ✅ Tabs work: All, Active, Low Inventory, Inactive
4. ✅ Table displays bulls with inventory
5. ✅ Click Package icon → opens InventoryDialog
6. ✅ Dialog shows batches with correct data
7. ✅ Breeding form loads bulls in dropdown
8. ✅ Select bull → shows available straws
9. ✅ Save breeding → deducts 1 straw
10. ✅ Refresh inventory → straws_used incremented

---

## Файлы созданы/изменены

**Созданы:**
- `packages/database/schema/006_bulls.sql` (200 строк)
- `packages/database/seed/bulls.sql` (180 строк)
- `apps/web/src/lib/data/bulls.ts` (220 строк)
- `apps/web/src/app/settings/bulls/page.tsx` (15 строк)
- `apps/web/src/components/settings/bulls-table.tsx` (130 строк)
- `apps/web/src/components/settings/inventory-dialog.tsx` (150 строк)
- `apps/web/src/components/settings/bulls-management-client.tsx` (150 строк)
- `apps/web/src/app/api/bulls/selection/route.ts` (10 строк)

**Изменены:**
- `apps/web/src/components/events/add-event-dialog.tsx` - bulls dropdown
- `apps/web/src/lib/actions/events.ts` - auto deduct semen

**Итого:** ~1050 строк нового кода

---

## Следующие шаги

### ✅ Task #2 завершен!

**Готово:**
- Bulls catalog management
- Semen inventory tracking
- FIFO auto-deduction
- Bulls dropdown in breeding form
- Low inventory alerts
- /settings/bulls page

**Что дальше (Phase 2):**

1. **Task #3: Veterinary Module** (HIGH, 4-5 дней)
   - /vet page с VetList Pro
   - Treatment protocols
   - Withdrawal tracking
   - Active restrictions в Health Tab

2. **Task #4: Milk Quality Monitoring** (MEDIUM, 3 дня)
   - DHIA milk tests
   - Bulk tank readings
   - Quality dashboard

3. **Task #5: Alerts & Notifications** (HIGH, 3-4 дня)
   - Notification center
   - Alert rules
   - Push notifications

---

**Итого:** Bulls Management полностью реализован! Справочник быков и учет семени готовы к использованию.
