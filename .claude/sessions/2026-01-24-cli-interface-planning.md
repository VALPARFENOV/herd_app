# Session Log: CLI Interface Planning

**Дата:** 2026-01-24
**Задача:** Спроектировать CLI интерфейс в стиле DairyComp 305 + iTerm2
**Статус:** ✅ COMPLETED (Design Document)

---

## Задание от пользователя

**Цитата:** "в dairy comp 305 есть супер фишка ввод командной строкой Придумай UI решение возможно в стиле iterms2 когда команда подсвечивается и набирается Чтобы и команды и отчеты так формировались Задача непростая Включи все возможные инструменты Создай документ с идеями"

**Суть:** Создать концепцию CLI интерфейса для HerdMaster Pro с:
- Синтаксисом команд как в DairyComp 305
- Подсветкой синтаксиса как в iTerm2
- Автодополнением
- Поддержкой команд и отчетов

---

## Исследование

### Phase 1: Data Model Research (Explore Agent)

**Что изучено:**
- Текущая архитектура HerdMaster Pro
- Все таблицы БД (animals, events, milk_readings, bulls, treatments, etc.)
- Существующие методы ввода данных (AddEventDialog с 8 типами событий)
- API структура (server actions vs API routes)
- Field mappings для команд

**Ключевые находки:**
- БД уже оптимизирована для CLI запросов (правильные индексы)
- Существующие формы можно заменить командами
- 109 calculated metrics - можно использовать в фильтрах

### Phase 2: CLI Pattern Research (Explore Agent)

**Что изучено:**
- DairyComp 305 command syntax (LIST, SUM, BRED, HEAT, PREG, etc.)
- Библиотеки для веб-CLI:
  - **Fuse.js** - fuzzy search
  - **Moo** - lexer
  - **Chevrotain** - parser (DSL)
  - **PrismJS** - syntax highlighting
  - **cmdk** - command palette UI
- Существующие компоненты (header search, sidebar quick access)
- Паттерны автодополнения

**Ключевые находки:**
- DairyComp использует синтаксис: `LIST FOR RC=3 DIM>60 BY PEN`
- Можно маппить команды на Supabase queries
- Рекомендуется поэтапный подход: Enhanced Search → Command Palette → Full CLI

---

## Что создано

### Документ: `docs/cli-interface-design.md` (930+ строк)

**Содержимое:**

#### 1. Синтаксис команд (8 категорий)

**LIST - Списки животных:**
```bash
LIST FOR RC=BRED AND DSLH>35
LIST FOR DIM<21 SHOW ETAG,NAME,DIM,MILK
LIST FOR LACT>2 BY PEN
```

**SUM - Аггрегация:**
```bash
SUM MILK BY PEN
SUM SCC FOR LACT>2 BY PEN
SUM COUNT BY RC
```

**EVENT - Добавление событий:**
```bash
BRED 1234 BULL=456
HEAT 5678
PREG 1234 POSITIVE
DRY 1234
CALV 1234 CALF=HEIFER EASE=NORMAL
```

**MILK - Ввод надоев:**
```bash
MILK 1234 32.5 SESSION=MORNING
MILK 1234 28.0 SESSION=AFTERNOON TIME=14:30
```

**HOOF - Осмотр копыт:**
```bash
HOOF 1234 LOCO=2
HOOF 1234 LOCO=3 TRIM=CORRECTIVE TRIMMER=Petrov
```

**UDDER - Тест вымени:**
```bash
UDDER 1234 TYPE=SCC LF=150 LR=180 RF=160 RR=200
UDDER 1234 TYPE=CMT LF=NEGATIVE LR=TRACE RF=1 RR=2
```

**REPORT - Генерация отчетов:**
```bash
REPORT REPRO FOR LACT>1
REPORT MASTITIS SINCE 30 DAYS AGO
REPORT ECONOMICS BY PEN
```

**SEARCH - Поиск:**
```bash
SEARCH 1234
SEARCH Mary
SEARCH mrya  # Fuzzy search
```

#### 2. UI/UX Концепции (3 варианта)

**Вариант 1: Command Palette (Cmd+K)**
- Модальное окно по Cmd+K
- Fuzzy matching
- История команд
- Категоризация результатов

**Вариант 2: Dedicated CLI Page (/cli)**
- Полноэкранный терминал
- Интерактивные результаты с действиями
- Split view (команда слева, результат справа)
- Сохранение сессии

**Вариант 3: Inline CLI в Header**
- CLI всегда доступен в Header
- Минимальная версия для быстрых команд
- Результаты в модале

#### 3. Подсветка синтаксиса

**Цветовая схема (как iTerm2):**
- Команды (LIST, SUM) → синий #61AFEF
- Операторы (FOR, AND, BY) → зеленый #98C379
- Поля (RC, DIM, MILK) → желтый #E5C07B
- Значения (BRED, 1234) → оранжевый #D19A66
- Операторы сравнения (>, <, =) → cyan #56B6C2

**Пример:**
```
LIST FOR RC=BRED AND DIM>60 BY PEN
^^^^     ^^      ^^^ ^^^    ^^ ^^^
blue   green   yellow cyan green yellow
```

#### 4. Автодополнение (5 уровней)

**Level 1:** Command Keywords (`l` → `LIST`, `LACT`)
**Level 2:** Operators (`LIST F` → `FOR`)
**Level 3:** Field Names (`LIST FOR R` → `RC`)
**Level 4:** Field Values (`LIST FOR RC=` → `OPEN, BRED, PREG`)
**Level 5:** Logical Operators (`LIST FOR RC=BRED` → `AND, OR, BY`)

**Fuzzy Matching:**
- `lst br` → `LIST FOR RC=BRED`
- `sm mlk pn` → `SUM MILK BY PEN`
- `prgchk` → `PREG CHECK`

#### 5. Техническая архитектура

**Стек:**
- **Парсинг:** Chevrotain (DSL parser) или Moo (lexer)
- **Syntax Highlighting:** PrismJS с кастомной грамматикой
- **Autocomplete:** Fuse.js (fuzzy search) + cmdk (UI)
- **Backend:** Маппинг команд на Supabase queries

**Компоненты:**
1. `CommandInput` - инпут с подсветкой
2. `CommandPalette` - модал с Cmd+K
3. `SyntaxHighlighter` - подсветка синтаксиса
4. `AutocompleteEngine` - Fuse.js интеграция
5. `CommandExecutor` - выполнение команд

**Примеры кода:**
- Полный CommandInput component (100+ строк)
- CommandPalette с результатами
- Syntax highlighter с PrismJS
- Autocomplete engine с Fuse.js
- Command executor с маппингом на Supabase

#### 6. План реализации (8 фаз)

| Phase | Недели | Приоритет | Описание |
|-------|--------|-----------|----------|
| Phase 1 | 1 | HIGH | Enhanced Search (fuzzy, autocomplete) |
| Phase 2 | 1-2 | HIGH | Command Palette (Cmd+K) |
| Phase 3 | 2-3 | CRITICAL | Basic CLI (LIST, SEARCH) |
| Phase 4 | 1-2 | HIGH | Event Commands (BRED, MILK, HOOF) |
| Phase 5 | 2 | MEDIUM | Advanced Parser (Chevrotain) |
| Phase 6 | 1-2 | MEDIUM | Reports (SUM, REPORT) |
| Phase 7 | 1 | LOW | Dedicated CLI Page (/cli) |
| Phase 8 | 2 | LOW | Mobile CLI (voice, touch) |

**Итого:** 11-16 недель до полной реализации
**MVP (Phases 1-3):** 4-6 недель

#### 7. Use Cases с экономией времени

**Use Case 1: Утренняя рутина зоотехника**
- **Было:** 30 мин через GUI
- **Стало:** 10 мин через CLI
- **Экономия:** ~70%

**Use Case 2: Ветеринарный осмотр (20 коров)**
- **Было:** 40 мин через формы
- **Стало:** 8 мин через CLI
- **Экономия:** ~80%

**Use Case 3: Формирование отчетов**
- **Было:** 20 мин
- **Стало:** 8 мин
- **Экономия:** ~60%

#### 8. Дополнительно

- Риски и митигация (крутая кривая обучения, сложность парсинга)
- Альтернативные подходы (GraphQL, NLP, Visual Query Builder)
- Метрики успеха (adoption rate, commands per user, time savings)
- KPI для измерения эффективности

---

## Технические решения

### 1. Hybrid Approach: GUI + CLI

**Решение:** Не заменять GUI на CLI, а дать пользователям выбор
- Новички используют формы
- Power users используют CLI
- Можно миксовать (например, LIST через CLI, а добавление через форму)

**Benefits:**
- Нет риска оттолкнуть пользователей
- Постепенное обучение
- CLI как competitive advantage

### 2. Fuzzy Search с Fuse.js

**Решение:** Использовать Fuse.js для autocomplete вместо точного matching

**Пример:**
```typescript
const fuse = new Fuse(COMMAND_TEMPLATES, {
  keys: ['command', 'description'],
  threshold: 0.4,
})

fuse.search('lst br') // Найдет "LIST FOR RC=BRED"
```

**Benefits:**
- Пользователь может вводить неточно
- Меньше ошибок
- Быстрее ввод

### 3. Поэтапная реализация парсера

**Решение:** Не сразу использовать Chevrotain, а начать с regex

**Phase 1:** Regex-based parser для простых команд
**Phase 2:** Moo lexer для токенизации
**Phase 3:** Chevrotain для полного DSL

**Benefits:**
- Быстрее MVP
- Меньше сложности на старте
- Можно тестировать концепцию

### 4. Syntax Highlighting с PrismJS

**Решение:** Создать кастомный язык для PrismJS

```typescript
Prism.languages.herdmaster = {
  'keyword': /\b(LIST|SUM|BRED|HEAT|PREG|...)\b/i,
  'operator': /\b(FOR|AND|OR|BY|...)\b/i,
  'field': /\b(RC|DIM|LACT|...)\b/i,
  'comparison': /[<>=!]+/,
  'number': /\b\d+(\.\d+)?\b/,
}
```

**Benefits:**
- Легкая кастомизация цветов
- Поддержка всех браузеров
- Маленький bundle size

### 5. Command Executor с маппингом на Supabase

**Решение:** AST → Supabase Query Builder

**Пример:**
```typescript
async function executeList(ast) {
  let query = supabase.from('animals').select('*')

  ast.conditions?.forEach((cond) => {
    switch (cond.operator) {
      case '=': query = query.eq(cond.field, cond.value); break
      case '>': query = query.gt(cond.field, cond.value); break
      case '<': query = query.lt(cond.field, cond.value); break
    }
  })

  const { data, error } = await query
  return { type: 'list', data }
}
```

**Benefits:**
- Типобезопасность (TypeScript)
- RLS policies автоматически применяются
- Простая интеграция

---

## Ключевые инсайты

1. **DairyComp 305 синтаксис хорош, но можно лучше:**
   - Добавить fuzzy search
   - Добавить автодополнение
   - Подсветка синтаксиса в реальном времени

2. **iTerm2 UX применим к веб-приложению:**
   - Command history (стрелка вверх)
   - Autocomplete (Tab)
   - Syntax highlighting
   - Keyboard navigation

3. **CLI не заменяет GUI, а дополняет:**
   - Command Palette (Cmd+K) для быстрых действий
   - Dedicated CLI для power users
   - GUI для новичков

4. **Экономия времени значительная:**
   - 60-80% для рутинных задач
   - Особенно эффективно для batch operations

5. **Технически реализуемо:**
   - Все библиотеки доступны (Fuse.js, Chevrotain, PrismJS, cmdk)
   - Supabase Query Builder идеально подходит
   - React компоненты легко интегрируются

---

## Следующие шаги (рекомендации)

### Immediate (1-2 недели):
1. **Создать Figma прототип** UI для Command Palette
2. **Написать спецификацию грамматики** команд (формальная BNF)
3. **Реализовать Phase 1** (Enhanced Search) как proof of concept

### Short-term (1-2 месяца):
4. **Реализовать Phase 2-3** (Command Palette + Basic CLI)
5. **Beta тест** с 5-10 пользователями
6. **Собрать фидбек** и приоритизировать Phase 4-8

### Long-term (3-6 месяцев):
7. **Завершить Phase 4-6** (Event commands, Advanced parser, Reports)
8. **A/B тестирование:** GUI vs CLI для одинаковых задач
9. **Документация и туториалы**

---

## Файлы созданы

**Документация:**
1. `docs/cli-interface-design.md` (930+ строк) - полная концепция CLI

**Итого:** 1 новый файл

---

## Метрики

**Время на исследование:** ~2 часа (2 Explore agents)
**Время на написание документа:** ~1 час
**Итого:** ~3 часа

**Объем документа:** 930+ строк, 8 разделов, 3 UI варианта, 8 категорий команд, 8 фаз реализации

---

## Итоговая концепция (после feedback пользователя)

### ⭐ Основное решение: Hybrid CLI + GUI

**Пользователь предложил улучшенный подход:**

1. **CLI внизу экрана** (фиксированная панель)
2. **Результаты в основной области** (не в модале)
3. **Подсветка разделов** при выполнении команды
4. **Быстрое переключение** CLI ↔ Mouse

**Пример:**
```
┌────────────────────────────────────────────┐
│  Header + Navigation                       │
├──────┬─────────────────────────────────────┤
│Side  │                                     │
│→Preg │    Main Content (результаты)       │
│ bar  │    ┌──────┬─────┬─────┐            │
│(подсв│    │ 1234 │ 225 │ ... │            │
│ечен) │    └──────┴─────┴─────┘            │
├──────┴─────────────────────────────────────┤
│ > list id dcc for rc=5 dcc>220            │ CLI
└────────────────────────────────────────────┘
```

### Преимущества этого подхода:

✅ **Всегда доступна** - CLI под рукой, не мешает
✅ **Контекст** - результаты в знакомой области
✅ **Навигация** - подсветка показывает "где ты"
✅ **Обучение** - новички видят связь команд и GUI
✅ **Productivity** - быстрое переключение режимов

### Синхронизация GUI ↔ CLI:

**CLI → GUI:**
```
Команда: LIST FOR RC=5 DCC>220
         ↓
Экран:   Animals → Dry Off
Sidebar: "Dry" подсвечен
Таблица: Показывает стельных коров
```

**GUI → CLI:**
```
Клик:    Sidebar → "Fresh"
         ↓
CLI:     > list for dim<21
         (эквивалентная команда)
```

## Заключение

✅ **Концепция готова** - полный справочник DairyComp 305 + современный UI
✅ **Технически реализуемо** - все библиотеки и паттерны известны
✅ **UX продуман** - hybrid подход с синхронизацией CLI ↔ GUI
✅ **План реализации четкий** - 8 фаз, 15-17 недель, **MVP за 7-8 недель**

**Готовность:** Документ готов к review и началу реализации

**Рекомендация:**
1. Начать с **Phase 1-2** (CLI Bar + Синхронизация) - 5 недель
2. Получить feedback от пользователей
3. Продолжить с Phase 3-4 на основе приоритетов

---

**Следующий шаг:** Начать Phase 1 - создать CLI bar внизу с базовым LIST executor
