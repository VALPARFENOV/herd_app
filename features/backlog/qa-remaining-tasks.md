# QA Backlog — Оставшиеся задачи

**Дата:** 2026-02-04
**Источник:** Deep QA Testing (миграция 016 закрыла P0/P1)

---

## P2 — Средний приоритет

### 1. Каскад soft-delete на дочерние таблицы
**Проблема:** События и milk_readings для soft-deleted животных остаются доступны через API.

**Причина:** RLS-политики дочерних таблиц не проверяют `animals.deleted_at`.

**Решение:**
```sql
-- Вариант A: JOIN в RLS (может повлиять на производительность)
CREATE POLICY events_select ON events FOR SELECT
  USING (tenant_id = auth.tenant_id()
    AND animal_id IN (SELECT id FROM animals WHERE deleted_at IS NULL));

-- Вариант B: Триггер каскадного soft-delete
```

**Требуется:** Анализ производительности на реальных данных.

---

### 2. Пагинация в списке животных
**Проблема:** Кнопки Previous/Next были заглушками без логики. Сейчас убраны.

**Текущее поведение:** Загружается до 100 животных, фильтрация клиентская.

**Решение:** Реализовать серверную пагинацию с `offset/limit` и URL-параметрами.

---

### 3. Поиск показывает 1 строку на пустой результат
**Проблема:** При поиске "ZZZZZ" (нет совпадений) таблица показывает 1 строку вместо пустого состояния.

**Причина:** Клиентская фильтрация + рендер empty state как `<TableRow>`.

**Файл:** `apps/web/src/components/animals/animals-table.tsx`

---

### 4. Дубликаты событий (2 heat в один день)
**Проблема:** Можно создать два события `heat` на одну дату для одного животного.

**Решение:**
```sql
CREATE UNIQUE INDEX idx_events_no_dup_per_day
  ON events (tenant_id, animal_id, event_type, event_date)
  WHERE event_type IN ('heat', 'insemination', 'dry_off', 'calving');
```

---

### 5. HTML в hoof_inspections.overall_notes
**Проблема:** Сырой HTML сохраняется в БД (`<img onerror=alert(1)>`).

**Риск:** Низкий — React автоматически экранирует при рендере. Но может быть проблемой для экспорта/мобильного приложения.

**Решение:** Санитизация на уровне API или триггер в БД.

---

## P3 — Низкий приоритет

### 6. Будущие даты в milk_readings.time
**Проблема:** TimescaleDB hypertable — CHECK-ограничения применяются на уровне чанков.

**Статус:** Отложено до понимания влияния на производительность.

---

### 7. Модуль импорта CSV не протестирован
**Причина:** Требует ручной подготовки тестовых CSV-файлов.

**Тесты:** I1.1–I1.11 в `features/active/qa-full-testing/deep-test-results.md` (все SKIP).

---

## Закрыто (P0/P1 в миграции 016)

- ✅ Role-based RLS (viewer read-only)
- ✅ Soft-delete триггер на animals
- ✅ CHECK на будущие даты (events, animals, hoof_inspections)
- ✅ CHECK на milk_kg <= 100
- ✅ ENUM на session_id, event_type
- ✅ CHECK на result_value range
- ✅ Edit page hang fix
- ✅ Pagination buttons removed
