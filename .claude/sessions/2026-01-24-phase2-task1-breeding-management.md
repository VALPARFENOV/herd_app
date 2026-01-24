# Session Log: Phase 2 - Task #1 - Breeding Management

**Дата:** 2026-01-24
**Задача:** Task #1 - Breeding Management Page
**Приоритет:** CRITICAL
**Статус:** ✅ COMPLETED

---

## Что сделано

### 1. Создан API модуль `breeding-lists.ts`

Файл `apps/web/src/lib/data/breeding-lists.ts` с функциями для получения breeding lists из БД.

**Интерфейсы:**
- `BreedingListAnimal` - расширяет `AnimalWithComputed` дополнительными breeding-specific полями:
  - `times_bred` - количество осеменений
  - `days_since_last_breeding` - дней с последнего осеменения
  - `days_since_last_heat` - дней с последней охоты
  - `days_to_calving` - дней до отела
  - `days_carried` - дней стельности

**API функции:**

1. **getToBreedList()** - коровы готовые к осеменению
   ```typescript
   WHERE current_status IN ('lactating', 'fresh')
   AND last_breeding_date IS NULL
   AND last_calving_date <= today - 60 days
   ORDER BY last_calving_date ASC
   ```

2. **getPregCheckList()** - коровы требующие проверки стельности
   ```typescript
   WHERE last_breeding_date IS NOT NULL
   AND pregnancy_confirmed_date IS NULL
   AND last_breeding_date BETWEEN (today - 45 days) AND (today - 35 days)
   ORDER BY last_breeding_date ASC
   ```
   - Дополнительно: загружает количество осеменений из events

3. **getDryOffList()** - коровы готовые к запуску
   ```typescript
   WHERE expected_calving_date IS NOT NULL
   AND expected_calving_date <= today + 60 days
   AND current_status = 'lactating'
   ORDER BY expected_calving_date ASC
   ```

4. **getFreshCowsList()** - свежие коровы
   ```typescript
   WHERE current_status IN ('lactating', 'fresh')
   AND last_calving_date >= today - 21 days
   ORDER BY last_calving_date DESC
   ```

5. **getBreedingListCounts()** - счетчики для всех списков
   - Параллельные запросы для производительности
   - Возвращает объект с 4 count полями

---

### 2. Создан компонент `BreedingTable`

Файл `apps/web/src/components/breeding/breeding-table.tsx` - универсальная таблица для всех 4 типов breeding lists.

**Props:**
- `animals: BreedingListAnimal[]` - массив животных
- `type: 'to_breed' | 'preg_check' | 'dry_off' | 'fresh'` - тип списка
- `onAction?: (animalId: string) => void` - callback для action кнопки

**Функционал:**
- Динамические колонки в зависимости от типа
- Color-coded badges для DIM, days since breeding, days to calving
- Action кнопки: Breed, Preg Check, Dry Off
- Ссылка на animal card (External Link icon)
- Empty state когда нет животных

**Колонки по типам:**

**To Breed:**
- ID, Name, Pen, Lact, DIM, Last Heat, Times Bred, Actions

**Preg Check:**
- ID, Name, Pen, Lact, DIM, Last Bred, Days Since, Times Bred, Actions

**Dry Off:**
- ID, Name, Pen, Lact, DIM, Expected Calving, Days to Calving, Days Carried, Actions

**Fresh:**
- ID, Name, Pen, Lact, DIM, Calving Date, RC, Actions

---

### 3. Создан компонент `BreedingListTabs`

Файл `apps/web/src/components/breeding/breeding-list-tabs.tsx` - tabbed interface для breeding management.

**Props:**
- `toBreedList`, `pregCheckList`, `dryOffList`, `freshList` - данные для каждого таба
- `counts` - счетчики для badges на табах

**Функционал:**
- 4 таба с badges показывающими count
- Описание для каждого таба
- Интеграция с `AddEventDialog` для quick actions
- Mapping event types: `preg_check` → `pregnancy_check` для dialog

**Event handling:**
- Клик на кнопку "Breed" → открывает AddEventDialog с defaultEventType='breeding'
- Клик на кнопку "Preg Check" → defaultEventType='pregnancy_check'
- Клик на кнопку "Dry Off" → defaultEventType='dry_off'
- После сохранения события → router.refresh() обновляет списки

---

### 4. Создана страница `/breeding`

Файл `apps/web/src/app/breeding/page.tsx` - главная страница breeding management.

**Server Component:**
- Параллельная загрузка всех 5 data sources через Promise.all
- Передача данных в BreedingListTabs client component

**Структура:**
```typescript
const [toBreedList, pregCheckList, dryOffList, freshList, counts] = await Promise.all([
  getToBreedList(),
  getPregCheckList(),
  getDryOffList(),
  getFreshCowsList(),
  getBreedingListCounts(),
])
```

---

### 5. Обновлен `AddEventDialog`

Файл `apps/web/src/components/events/add-event-dialog.tsx` - добавлена поддержка controlled mode.

**Изменения:**
- Добавлены props: `open?: boolean`, `onOpenChange?: (open: boolean) => void`
- `trigger` теперь опционален
- Controlled/uncontrolled mode: использует внешний state если передан, иначе internal
- Conditional DialogTrigger: рендерится только если передан trigger

**Логика:**
```typescript
const open = controlledOpen !== undefined ? controlledOpen : internalOpen
const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen
```

**Использование:**

*Uncontrolled mode (старый способ):*
```tsx
<AddEventDialog
  animalId={id}
  animalEarTag={earTag}
  trigger={<Button>Add Event</Button>}
  defaultEventType="breeding"
/>
```

*Controlled mode (новый для breeding lists):*
```tsx
<AddEventDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  animalId={id}
  animalEarTag={earTag}
  defaultEventType="breeding"
/>
```

---

### 6. Добавлена навигация

Файл `apps/web/src/components/layout/header.tsx` - добавлен пункт "Breeding" в navigation.

```typescript
const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Animals", href: "/animals" },
  { name: "Breeding", href: "/breeding" },  // NEW
  { name: "Tasks", href: "/tasks" },
  { name: "Reports", href: "/reports" },
]
```

---

## Технические решения

### 1. Универсальный BreedingTable component

**Решение:** Один компонент для всех 4 типов списков с условными колонками

**Альтернативы:**
- ❌ 4 отдельных компонента - много дублирования
- ❌ Полностью configurable - сложный API
- ✅ Type-based switching - балансирует DRY и читаемость

### 2. Breeding counts calculation

**Решение:** JOIN с events table для подсчета breeding events

**Причина:**
- `animals` таблица не хранит breeding count
- Нужен реальный подсчет из events
- Выполняется параллельно для производительности

### 3. Controlled dialog pattern

**Решение:** Поддержка обоих режимов (controlled/uncontrolled)

**Преимущества:**
- Обратная совместимость со старым кодом
- Гибкость для новых use cases
- Нет дублирования dialog компонентов

---

## Верификация

### UI Flow

1. ✅ Навигация: Header → Breeding link работает
2. ✅ Page загружается: все 4 списка параллельно
3. ✅ Tabs: переключение между To Breed, Preg Check, Dry Off, Fresh
4. ✅ Badges: count отображается на каждом табе
5. ✅ Tables: корректные колонки для каждого типа
6. ✅ Action buttons: открывают AddEventDialog
7. ✅ Event creation: сохраняет и обновляет список

### Database queries

**To Breed:**
```sql
SELECT * FROM animals
WHERE current_status IN ('lactating', 'fresh')
  AND last_breeding_date IS NULL
  AND last_calving_date <= '2025-11-25'
  AND deleted_at IS NULL
ORDER BY last_calving_date
```

**Preg Check:**
```sql
SELECT * FROM animals
WHERE last_breeding_date IS NOT NULL
  AND pregnancy_confirmed_date IS NULL
  AND last_breeding_date BETWEEN '2024-12-10' AND '2024-12-20'
  AND deleted_at IS NULL
ORDER BY last_breeding_date
```

**Dry Off:**
```sql
SELECT * FROM animals
WHERE expected_calving_date IS NOT NULL
  AND expected_calving_date <= '2026-03-25'
  AND current_status = 'lactating'
  AND deleted_at IS NULL
ORDER BY expected_calving_date
```

**Fresh:**
```sql
SELECT * FROM animals
WHERE current_status IN ('lactating', 'fresh')
  AND last_calving_date >= '2026-01-03'
  AND deleted_at IS NULL
ORDER BY last_calving_date DESC
```

---

## Файлы созданы/изменены

**Созданы:**
- `apps/web/src/lib/data/breeding-lists.ts` (295 строк)
- `apps/web/src/components/breeding/breeding-table.tsx` (178 строк)
- `apps/web/src/components/breeding/breeding-list-tabs.tsx` (138 строк)
- `apps/web/src/app/breeding/page.tsx` (28 строк)

**Изменены:**
- `apps/web/src/components/layout/header.tsx` - добавлен "Breeding" link
- `apps/web/src/components/events/add-event-dialog.tsx` - controlled mode support

**Итого:** ~640 строк нового кода

---

## Следующие шаги

### ✅ Task #1 завершен!

**Готово:**
- /breeding страница с 4 табами
- To Breed, Preg Check, Dry Off, Fresh lists
- Quick action buttons для каждого типа
- Integration с AddEventDialog
- Navigation в header

**Что дальше (Phase 2):**

1. **Task #2: Bulls Management** (HIGH, 3 дня)
   - Таблицы bulls, semen_inventory
   - Страница /settings/bulls
   - Dropdown быков в breeding form

2. **Task #3: Veterinary Module** (HIGH, 4-5 дней)
   - Страница /vet с VetList Pro
   - Treatment protocols
   - Withdrawal tracking

3. **Task #4: Milk Quality Monitoring** (MEDIUM, 3 дня)
   - DHIA milk tests
   - Bulk tank readings
   - Quality dashboard

4. **Task #5: Alerts & Notifications** (HIGH, 3-4 дня)
   - Notification center
   - Alert rules
   - Push notifications

---

**Итого:** Breeding Management полностью реализован! Страница готова к использованию фермерами для управления воспроизводством стада.
