# Feature: {название}

## User Story
**As a** {кто — зоотехник / ветврач / бухгалтер / администратор}
**I want** {что}
**So that** {зачем — бизнес-ценность}

## Scope
- **In scope:** {что входит}
- **Out of scope:** {что НЕ входит}

## Priority: P0 | P1 | P2
## Complexity: S | M | L | XL

---

## Technical Design

### New/Modified Database Objects

#### Tables
| Table | Action | Description |
|-------|--------|-------------|
| table_name | CREATE/ALTER | {описание} |

#### RPC Functions
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| module_func_name() | p_param TEXT, p_limit INT | JSON | {описание} |

#### Views
| View | Action | Description |
|------|--------|-------------|
| view_name | CREATE/ALTER | {описание} |

### SQL Migration
```sql
-- packages/database/schema/NNN_description.sql
-- Описание миграции
```

### Business Logic
1. Пользователь делает X
2. Система проверяет Y
3. Если Z — возвращает ошибку
4. Иначе — создаёт/возвращает результат

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Пустой tenant (нет данных) | Возвращает пустой результат, не ошибку |
| Невалидные параметры | 400 с описанием ошибки |
| {кейс} | {поведение} |

### Security Considerations
- RLS: tenant_id изоляция
- {другие проверки}

### UI Design

#### Pages
| Page | Route | Description |
|------|-------|-------------|
| PageName | /section/path | {описание} |

#### Components
| Component | Location | Description |
|-----------|----------|-------------|
| CompName | src/components/section/Comp.tsx | {описание} |

#### Figma
- Макет: {ссылка на Figma, если есть}
- Или: следовать стилю существующих страниц ({пример страницы})

---

## Acceptance Criteria
- [ ] AC1: {конкретный, проверяемый критерий}
- [ ] AC2: {критерий}
- [ ] AC3: {критерий}

## Dependencies
- Зависит от: {другие фичи/модули}
- Блокирует: {что зависит от этой фичи}

## Existing Patterns to Follow
- Аналогичная реализация: {ссылка на файл/модуль} (например: ECON functions в `packages/database/functions/econ_functions.sql`)
