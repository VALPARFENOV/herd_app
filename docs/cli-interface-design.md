# HerdMaster Pro CLI Interface - DairyComp 305 Command Reference

**Дата:** 2026-01-24
**Статус:** Концепция
**Цель:** Перенести оригинальные команды DairyComp 305 в современный веб-интерфейс с iTerm2-style UX

---

## Обзор

DairyComp 305 имеет мощную систему командной строки для работы с данными стада. Задача - перенести ВСЕ оригинальные команды в веб-приложение с современным UX:

- ✨ Подсветка синтаксиса как в iTerm2
- 🔍 Fuzzy search и автодополнение
- ⌨️ Keyboard-first navigation
- 📊 Интерактивное отображение результатов

**Новизна только в UI/UX, команды остаются оригинальными из DairyComp 305.**

---

## Структура команд DairyComp 305

Каждая команда состоит из **5 частей**:

```
COMMAND ITEMS FOR CONDITIONS BY SORT \SWITCHES
```

### 1. Command Word (Тип отчета)

| Команда | Назначение |
|---------|-----------|
| **LIST** | Список животных с указанными полями |
| **SHOW** | Альтернатива LIST |
| **COUNT** | Подсчет животных |
| **SUM** | Средние значения и подсчет по группам |
| **PCT** | Процент животных, удовлетворяющих условиям |
| **GRAPH** | Гистограммы или scatter plots |
| **PLOT** | Графики тестовых данных по датам или DIM |
| **EGRAPH** | Графики событий по календарю/DIM/возрасту |
| **EPLOT** | Графики BCS, роста, веса |
| **EVENTS** | Списки и таблицы событий |
| **BREDSUM** | Анализ эффективности программы осеменения |
| **ECON** | Экономические расчеты |
| **MONITOR** | Статистика управления стадом (ежемесячно) |
| **COWVAL** | Оценка стоимости животного относительно fresh heifer |
| **SIRES** | Отчеты по NAAB производству быков |
| **FILEOUT** | Экспорт данных в CSV/TXT |
| **CHKFILE** | Поиск ID, доступные номера, исправление записей |
| **ALTER** | Настройка конфигурации (pens, events, items) |
| **SETUP** | Глобальные настройки системы |
| **LOGON** | Переключение между cowfiles |
| **CREATE** | Создание нового cowfile |
| **ABSORB** | Перенос данных между cowfiles |

### 2. Items (Поля данных)

#### Идентификация животного (Items 1-10)
| Item | Название | Описание |
|------|----------|----------|
| ID | Animal ID | Идентификатор животного |
| PEN | Pen Number | Номер загона |
| VC | Vet Code | Ветеринарный код (1-13) |
| REG | Registration | Регистрационный номер |
| EID | Electronic ID | 15-значный электронный ID |
| CBRD | Cattle Breed | Порода |
| DID | Dam ID | ID матери |
| DREG | Dam Registration | Регистрация матери |
| DBRD | Dam Breed | Порода матери |
| SID | Sire ID | ID быка |

#### Даты - жизненные события (Items 11-43)
| Item | Название | Описание |
|------|----------|----------|
| BDAT | Birth Date | Дата рождения |
| EDAT | Enrollment Date | Дата зачисления |
| FDAT | Fresh Date | Дата отела |
| CDAT | Conception Date | Дата зачатия |
| DDAT | Dry Date | Дата запуска |
| HDAT | Heat Date | Дата охоты |
| BLDAT | Bullpen Date | Дата попадания в бычью загон |
| ABDAT | Abortion Date | Дата аборта |
| ADDAT | Abortion Determination | Дата определения аборта |
| VDAT | Vet Check Date | Дата вет осмотра |
| TDAT | Test Date | Дата теста |
| ARDAT | Archive Date | Дата архивации |

#### Репродуктивный статус (Items 13-28)
| Item | Название | Описание |
|------|----------|----------|
| LACT | Lactation Number | Номер лактации |
| RC | Reproductive Code | Репродуктивный код (0-8) |
| SIR1 | First Choice Sire | Первый выбор быка |
| SIR2 | Second Choice Sire | Второй выбор быка |
| LSIR | Last Service Sire | Последний использованный бык |
| SIRC | Sire of Conception | Бык зачатия |
| TBRD | Times Bred | Количество осеменений |

#### Производство (Items 44-55)
| Item | Название | Описание |
|------|----------|----------|
| TOTM | Total Milk | Суммарный надой за лактацию |
| TOTF | Total Fat | Суммарный жир |
| TOTP | Total Protein | Суммарный белок/SNF |
| MILK | Test Day Milk | Надой на контрольной дойке |
| FCM | Fat Corrected Milk | Надой с поправкой на жир |
| 305ME | 305 ME | 305-дневный эквивалент |
| PCTP | Percent Protein | Процент белка |
| PCTF | Percent Fat | Процент жира |
| SCC | Somatic Cell Count | Соматические клетки |

#### Предыдущая лактация (Items 56-62)
| Item | Название | Описание |
|------|----------|----------|
| PSIRC | Previous Sire | Бык предыдущей лактации |
| PDIM | Previous DIM | DIM предыдущей лактации |
| PDOPN | Previous Days Open | Дни открытым |
| PTBRD | Previous Times Bred | Кол-во осеменений |
| PTOTM | Previous Total Milk | Суммарный надой |
| PTOTF | Previous Total Fat | Суммарный жир |
| PTOTP | Previous Total Protein | Суммарный белок |

#### Расчетные статусы (Items 75-87)
| Item | Название | Описание |
|------|----------|----------|
| DIM | Days in Milk | Дни в лактации |
| DOPN | Days Open | Дни открытым |
| DDRY | Days Dry | Дни сухостоя |
| DUE | Due to Freshen | Дней до отела |
| DCC | Days Carried Calf | Дней беременности |
| TODAY | Today's Date | Сегодняшняя дата |
| DSLH | Days Since Last Heat | Дни с последней охоты |
| AGE | Age in Months | Возраст в месяцах |

#### События (Items 18-21)
| Item | Название | Описание |
|------|----------|----------|
| EDAY | Event Day | День события |
| EC | Event Code | Код события (1-64) |
| INT | Interval | Интервал |
| REM | Remark | Комментарий |

#### Управление (Items 24, 47-48, 64-74, 89)
| Item | Название | Описание |
|------|----------|----------|
| CNTL | Computer Number | Компьютерный номер |
| RELV | Relative Value | Относительная ценность % |
| TPEN | Test Day Pen | Загон на момент теста |
| OLDID | Old ID | Старый ID |
| CODA | Wildcard 1 byte | Wildcard 1 байт |
| COD1 | Wildcard 1 byte (0-255) | Wildcard 1 байт (0-255) |
| COD2 | Wildcard 2 bytes | Wildcard 2 байта (0-32000) |
| XDAT | Wildcard Date | Wildcard дата |
| NOTE | Permanent Note | Постоянная заметка |
| TECH | Technician Number | Номер техника |

#### DHIA/Regulatory (Items 16-17, 63, 83-84)
| Item | Название | Описание |
|------|----------|----------|
| STAT | DHIA Status | DHIA статус (1,2,6) |
| CAR | Condition/Disposal | Условие/код выбытия |
| PVET | Previous Vet Code | Предыдущий vet code |
| VETC | Reason for Vet Check | Причина вет осмотра |
| RPRO | Reproductive Code | Репродуктивный код |

#### Здоровье и беременность (Items 65-69)
| Item | Название | Описание |
|------|----------|----------|
| DCCP | DCC at Preg Check | DCC при прег чеке |
| HINT | Heat Interval | Интервал охоты |
| CALF1 | Recent Calf | Последний теленок |
| CALF2 | Previous Calf | Предыдущий теленок |
| CALF3 | Oldest Calf | Самый старый теленок |

#### PULSE Items (2000+)
| Item | Название | Описание |
|------|----------|----------|
| 2000 | BFDAT | Beef Withdrawal Date | Дата вывода мясо |
| 2001 | MKDAT | Milk Withdrawal Date | Дата вывода молоко |
| 2002 | LTDAT | Last Treatment Date | Дата последнего лечения |
| 2003 | COST | Total Treatment Cost | Стоимость лечения |
| 2004 | PN | Previous Pen | Предыдущий загон |
| 2005 | HPDAT | Hospital Date | Дата госпитализации |
| 2006 | RCDAT | Recheck Date | Дата пересмотра |
| 2007 | THD | Total Sick Days | Суммарные дни болезни |
| 2008 | SCDAT | Last Scan Date | Дата последнего сканирования |
| 2009 | SCTIM | Last Scan Time | Время последнего сканирования |
| 2010 | SCMTH | Last Scan Method | Метод последнего сканирования |
| 2011 | SCPEN | Last Scan Pen | Загон при сканировании |
| 2012 | BNAME | Barn Name | Название коровника |
| 2013 | EASE | Calving Ease | Легкость отела |
| 2014 | CWVAL | Cow Value | Стоимость коровы |
| 2015 | PGVAL | Pregnancy Value | Стоимость беременности |
| 2016 | SIR3 | Sire Preference 3 | Третий выбор быка |
| 2017 | SIR4 | Sire Preference 4 | Четвертый выбор быка |
| 2018 | SYDAT | Ovsynch Enrollment | Дата зачисления Ovsynch |
| 2019 | CLIV | Calf Livability | Живучесть теленка |
| 2020 | CVACC | Calf Vaccination | Вакцинация теленка |
| 2021 | SF | Source Farm | Ферма-источник |
| 2044 | EXPCALF | Expected Calf | Ожидаемый теленок |

### 3. Conditions (Условия фильтрации)

#### Операторы сравнения:
| Оператор | Функция |
|----------|---------|
| = | Равно |
| > | Больше |
| >= | Больше или равно |
| < | Меньше |
| <= | Меньше или равно |
| <> | Не равно |

#### Примеры условий:
```
FOR LACT>0              # Только дойные коровы
FOR RC=5                # Только стельные
FOR DIM>60 DCC>220      # Несколько условий (AND)
FOR LACT=0              # Только телки
FOR FDAT=1.1.19-1.31.19 # Диапазон дат
```

### 4. Sort (Сортировка)

| Команда | Описание |
|---------|----------|
| BY поле | Сортировка по возрастанию |
| DOWNBY поле | Сортировка по убыванию |

**Примеры:**
```
BY PEN          # По загонам
BY DIM          # По дням в лактации
DOWNBY MILK     # По надою (больше → меньше)
```

### 5. Switches (Модификаторы)

| Switch | Функция |
|--------|---------|
| \\A | Показать средние значения |
| \\B | Включить живых и мертвых |
| \\D | Только мертвые животные |
| \\T | Показать итоги |
| \\P | Печать в колонках |
| \\2 | Двойной интервал |
| \\e | Extended options (для BREDSUM) |
| \\si | Show specific items (для EVENTS) |

---

## Reproductive Codes (RC)

| RC | Название | Описание |
|----|----------|----------|
| **RC=0** | Blank | Молодые телята и телки, не осемененные |
| **RC=1** | DNB | Do Not Breed - не осеменять |
| **RC=2** | FRESH | Свежие отелы |
| **RC=3** | OPEN | Готовы к осеменению / проверены и открыты |
| **RC=4** | BRED | Осеменены, но не диагностированы |
| **RC=5** | PREG | Стельные |
| **RC=6** | DRY | Сухостойные (не доятся) |
| **RC=7** | SLD/DIE | Проданы или умерли |
| **RC=8** | BULLCAF | Бычки |

---

## Veterinary Codes (VC)

| VC | Название | Описание |
|----|----------|----------|
| **VC=1** | CHCK | Check - животное специально нуждается в осмотре |
| **VC=2** | FRSH | Fresh - осмотр перед началом осеменения |
| **VC=3** | PREG | Pregnancy check - проверка стельности |
| **VC=4** | REPG | Recheck pregnancy - повторная проверка |
| **VC=5** | ODUE | Overdue - стельные ≥300 DCC |
| **VC=6** | ABT? | Abort? - охота у стельной, проверка аборта |
| **VC=7** | CYST | Cystic - переосеменена в течение 10 дней |
| **VC=8** | NOHT | No heat - осеменена, но не переосеменена (30 дней) |
| **VC=9** | NOHT | No heat - слишком большой DIM без осеменения (90 дней) |
| **VC=10** | PROB | Problem breeder - проблемный заводчик |
| **VC=11** | XBRD | Extra bred - осеменена 3+ раза до стельности |

---

## Примеры команд DairyComp 305

### LIST - Списки животных

**Базовый синтаксис:**
```
LIST items FOR conditions BY sort \switches
```

**Примеры:**

```bash
# Все дойные коровы
LIST ID PEN LACT DIM MILK FOR LACT>0

# Стельные коровы, готовые к запуску
LIST ID PEN LACT DIM DCC FOR RC=5 DCC>220

# Свежие коровы (DIM < 21)
LIST ID NAME FDAT DIM MILK FOR DIM<21 BY DIM

# Коровы для осеменения (открытые, DIM > 60)
LIST ID PEN LACT DIM DOPN FOR RC=3 DIM>60 BY PEN

# Телки для осеменения
LIST ID BDAT AGE FOR LACT=0 AGE>12 BY AGE

# Коровы с высоким SCC
LIST ID LACT DIM MILK SCC FOR SCC>200 BY DOWNBY SCC

# Коровы, требующие прег чек (осеменены 35-45 дней назад)
LIST ID PEN LACT DIM DSLH TBRD FOR RC=4 DSLH>35 DSLH<45

# Просроченные прег чеки
LIST ID PEN DSLH TBRD FOR RC=4 DSLH>45

# С двойным интервалом и итогами
LIST ID PEN DIM MILK FOR LACT>0 BY PEN \2T

# Включая мертвых
LIST ID LACT DIM FOR LACT>0 \B
```

### SUM - Средние значения и группировки

**Базовый синтаксис:**
```
SUM items FOR conditions BY grouping \switches
```

**Примеры:**

```bash
# Средний надой по загонам
SUM MILK BY PEN

# Средний надой свежих коров
SUM MILK FOR DIM<21

# Средний надой по лактациям
SUM MILK BY LACT FOR LACT>0

# Средний SCC по загонам
SUM SCC BY PEN FOR LACT>0

# Количество коров в каждом RC
SUM COUNT BY RC

# Средний DIM по загонам
SUM DIM BY PEN FOR LACT>0

# С итогами
SUM MILK BY PEN \T

# С средними значениями
SUM MILK BY LACT \A
```

### COUNT - Подсчет животных

**Примеры:**

```bash
# Всего дойных коров
COUNT FOR LACT>0

# Стельные коровы
COUNT FOR RC=5

# Телки
COUNT FOR LACT=0

# Свежие коровы (DIM < 21)
COUNT FOR DIM<21
```

### PCT - Процентные соотношения

**Базовый синтаксис:**
```
PCT условие1 условие2
```

**Примеры:**

```bash
# Какой % от осемененных коров стали стельными
PCT RC=4 RC=5

# Какой % от открытых коров имеют DIM>60
PCT RC=3 DIM>60
```

### EVENTS - Списки и таблицы событий

**Базовый синтаксис:**
```
EVENTS\switches FOR conditions
```

**Примеры:**

```bash
# Все события за последние 7 дней
EVENTS\1

# Отелы за январь 2019
EVENTS\3 FOR FDAT=1.1.19-1.31.19

# Проданные коровы за период
EVENTS\5si FOR LACT>0 FDAT=1.1.19-1.31.19

# Мертвые коровы
EVENTS\5si FOR LACT>0 # Выбрать "Died"

# Выбытие телок (проданные/умершие, исключая dairy)
EVENTS\5si FOR LACT=0
```

### BREDSUM - Анализ программы осеменения

**Базовый синтаксис:**
```
BREDSUM\switches FOR conditions
```

**Примеры:**

```bash
# Базовый отчет по осеменению
BREDSUM

# Расширенный отчет
BREDSUM\e

# По технику
BREDSUM\t

# По быкам
BREDSUM\b

# За период
BREDSUM FOR FDAT=1.1.19-12.31.19
```

### ECON - Экономические отчеты

**Примеры:**

```bash
# Базовый экономический отчет
ECON

# Списки событий
ECON\ID

# Таблицы телят
ECON\calf summaries

# Таблицы событий по периодам
ECON\event tables
```

### GRAPH - Гистограммы и scatter plots

**Примеры:**

```bash
# Гистограмма надоя
GRAPH MILK FOR LACT>0

# График DIM vs MILK
GRAPH DIM MILK FOR LACT>0

# График SCC
GRAPH SCC FOR LACT>0

# График по загонам
GRAPH MILK BY PEN
```

### PLOT - Графики тестовых данных

**Примеры:**

```bash
# График надоев по тест-датам
PLOT MILK

# График SCC по DIM
PLOT SCC FOR LACT>0

# График белка и жира
PLOT PCTP PCTF
```

### EGRAPH - Графики событий

**Примеры:**

```bash
# События по календарю
EGRAPH

# События по DIM
EGRAPH FOR DIM

# События по возрасту
EGRAPH FOR AGE
```

### EPLOT - Графики BCS, роста, веса

**Примеры:**

```bash
# График упитанности
EPLOT BCS

# График роста телок
EPLOT HEIGHT FOR LACT=0

# График веса
EPLOT WEIGHT
```

### COWVAL - Оценка стоимости коровы

**Примеры:**

```bash
# Стоимость коровы #1234
COWVAL 1234

# Стоимость с учетом беременности
COWVAL 1234 PREGNANCY
```

### SIRES - Отчеты по быкам

**Примеры:**

```bash
# Список быков с NAAB данными
SIRES

# Фильтр по породе
SIRES HOLSTEIN

# Production proofs
SIRES PRODUCTION
```

### FILEOUT - Экспорт данных

**Базовый синтаксис:**
```
FILEOUT filename items FOR conditions
```

**Примеры:**

```bash
# Экспорт всех дойных коров в CSV
FILEOUT cows.csv ID PEN LACT DIM MILK FOR LACT>0

# Экспорт стельных коров
FILEOUT pregnant.txt ID DCC CDAT FOR RC=5

# Экспорт с конкретными полями
FILEOUT export.csv ID NAME LACT DIM MILK SCC FOR LACT>0
```

### CHKFILE - Поиск и исправление

**Примеры:**

```bash
# Поиск животного по ID
CHKFILE 1234

# Показать доступные ID
CHKFILE AVAILABLE

# Исправить поврежденные записи
CHKFILE FIX
```

### MONITOR - Ежемесячная статистика

**Примеры:**

```bash
# Запустить ежемесячный мониторинг
MONITOR

# За конкретный месяц
MONITOR 1.19  # Январь 2019
```

---

## Специальные вычисления

### Возраст первого отела (AFC)

```bash
# Средний возраст первого отела за январь 2019
SUM AGEFR FOR LACT=1 FDAT=1.1.19-1.31.19
```

### Pregnancy Rate

```bash
# Текущий pregnancy rate
BREDSUM\e
# Использовать самый свежий полный rate
```

### Средний DIM стада

```bash
# Средний DIM всех дойных
SUM DIM FOR RC<6
```

### Выбытие коров < 60 DIM

```bash
# Проданные/умершие с DIM < 60
EVENTS\5si FOR LACT>0 DIM<60
# Выбрать "Sold" и "Died"
```

---

## UI/UX Концепция для HerdMaster Pro

### ⭐ Основная рекомендация: Hybrid CLI + GUI

**Командная строка внизу экрана, результаты в основной области**

```
┌────────────────────────────────────────────────────────────────┐
│  [≡] HerdMaster Pro    Dashboard  Animals▼  Reports  Settings │ Header
├──────┬─────────────────────────────────────────────────────────┤
│Fresh │                                                          │
│Breed │              Main Content Area                          │
│→Preg │                                                          │
│Dry   │     ┌────────────────────────────────────────┐         │
│VetLst│     │ Pregnant Cows Ready to Dry Off         │         │
│      │     ├──────┬──────┬──────┬──────┬──────┬─────┤         │
│Sidebar     │  ID  │ Name │ Pen  │ Lact │ DIM  │ DCC │         │
│(подсве-    ├──────┼──────┼──────┼──────┼──────┼─────┤         │
│ чивается)  │ 1234 │ Mary │  5   │  2   │ 285  │ 225 │ ← клик │
│      │     │ 1256 │Bella │  5   │  3   │ 290  │ 230 │         │
│      │     │ 1278 │ Lucy │  7   │  1   │ 280  │ 222 │         │
│      │     └──────┴──────┴──────┴──────┴──────┴─────┘         │
│      │                                                          │
│      │     Найдено: 12 коров                    [Export CSV]   │
│      │                                                          │
├──────┴─────────────────────────────────────────────────────────┤
│ > list id name pen lact dim dcc for rc=5 dcc>220 by pen       │ CLI
│   ^^^^                                                          │
│   💡 ENTER execute │ ↑↓ history │ F1 items │ ESC cancel       │
└────────────────────────────────────────────────────────────────┘
```

#### Как это работает:

**1. CLI → GUI синхронизация**

Команда меняет основную область и подсвечивает соответствующий раздел:

```
Команда: LIST ID DIM FOR DIM<21
         ↓
Экран:   Переключается на Animals → Fresh Cows
         Sidebar: "Fresh" подсвечивается
         Контент: Таблица свежих коров (DIM < 21)
```

```
Команда: SUM MILK BY PEN
         ↓
Экран:   Переключается на Dashboard → Production widget
         Показывает: График/таблица средних надоев по загонам
```

```
Команда: BREDSUM\e
         ↓
Экран:   Переключается на Reports → Breeding Analysis
         Показывает: Полный breeding summary отчет
```

**2. GUI → CLI синхронизация**

Клик в GUI обновляет командную строку:

```
Клик:    Sidebar → "Preg Check"
         ↓
CLI:     > list id dslh tbrd for rc=4 dslh>35 dslh<45
         (команда, эквивалентная текущему фильтру)
```

```
Клик:    Animals table → корова #1234
         ↓
Экран:   Открывается карточка животного
CLI:     > (пусто, можно ввести новую команду)
ESC:     Возврат к предыдущему списку
```

**3. Плавное переключение между режимами**

| Действие | Результат | CLI состояние |
|----------|-----------|---------------|
| Ввести команду | Показать результаты в main area | Команда выполнена |
| Кликнуть на строку таблицы | Открыть карточку животного | CLI доступен для новой команды |
| Изменить фильтр мышкой | Обновить таблицу | CLI показывает эквивалентную команду |
| Нажать `/` или `Ctrl+L` | Фокус в CLI | Cursor в командной строке |
| ESC в CLI | Очистить/выход | Фокус возвращается к контенту |

**4. Подсветка активных разделов**

При выполнении команды подсвечиваются соответствующие элементы UI:

```css
/* Пример подсветки */
.sidebar-item.active {
  background: rgba(59, 130, 246, 0.1);  /* Синий фон */
  border-left: 3px solid #3B82F6;        /* Синяя полоса слева */
}
```

**Маппинг команд на разделы:**

| Команда | Раздел UI | Подсветка |
|---------|-----------|-----------|
| `LIST ... FOR DIM<21` | Animals → Fresh Cows | Sidebar: "Fresh" |
| `LIST ... FOR RC=3 DIM>60` | Animals → To Breed | Sidebar: "Breed" |
| `LIST ... FOR RC=4 DSLH>35` | Animals → Preg Check | Sidebar: "Preg Check" |
| `LIST ... FOR RC=5 DCC>220` | Animals → Dry Off | Sidebar: "Dry" |
| `SUM MILK BY PEN` | Dashboard → Production | Header: "Dashboard" |
| `BREDSUM` | Reports → Breeding | Header: "Reports" |
| `EVENTS\5si` | Reports → Events | Header: "Reports" |

#### Преимущества:

✅ **Всегда доступна** - CLI внизу не мешает, но под рукой
✅ **Контекст** - результаты в знакомой области, не в отдельном окне
✅ **Навигация** - подсветка разделов показывает "где ты сейчас"
✅ **Быстрое переключение** - `/` для CLI, клик мышкой для GUI
✅ **Обучение** - новички видят как команды соотносятся с GUI
✅ **Productivity** - опытные пользователи работают быстрее через CLI

---

### Дополнительно: Command Palette (Cmd+K)

Для быстрого доступа к любой команде без переключения экрана:

```
┌─────────────────────────────────────────────────────┐
│  🔍 Type a command or search...             Esc    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  > list rc=5                                       │
│                                                     │
│  💡 Suggestions:                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ ▸ LIST FOR RC=5 DCC>220                     │  │
│  │   Pregnant cows ready to dry off            │  │
│  ├─────────────────────────────────────────────┤  │
│  │   LIST FOR RC=5                             │  │
│  │   All pregnant cows                         │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  Recent:                                           │
│  • LIST ID DIM FOR DIM<21                          │
│  • SUM MILK FOR LACT>0                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Использование:**
- `Cmd+K` / `Ctrl+K` - открыть palette
- Быстрый ввод команды без переключения контекста
- Fuzzy search по истории команд
- Enter → выполнить и закрыть palette

---

## Подсветка синтаксиса (Syntax Highlighting)

### Цветовая схема (как в iTerm2)

**Команды:**
```
LIST SUM COUNT GRAPH PLOT BREDSUM → #61AFEF (синий)
```

**Операторы:**
```
FOR BY DOWNBY → #98C379 (зеленый)
```

**Items (поля):**
```
ID PEN LACT DIM MILK SCC RC → #E5C07B (желтый)
```

**Значения:**
```
5 220 1234 → #D19A66 (оранжевый)
```

**Операторы сравнения:**
```
> < = >= <= <> → #56B6C2 (cyan)
```

**Switches:**
```
\A \B \T \2 → #C678DD (фиолетовый)
```

### Пример подсвеченной команды:

```
LIST ID PEN LACT DIM FOR RC=5 DCC>220 BY PEN \A
^^^^ ^^ ^^^ ^^^^ ^^^     ^^   ^^^      ^^ ^^^
blue yellow              grn  orange   grn purple
```

---

## Автодополнение (Autocomplete)

### Уровни автодополнения

#### Level 1: Command Keywords
```
l → LIST, LACT
li → LIST
lis → LIST
s → SUM, SHOW, SCC, SID, SIRC
su → SUM
```

#### Level 2: Items
```
LIST → показать популярные items (ID, PEN, LACT, DIM, MILK)
LIST I → ID
LIST M → MILK
LIST D → DIM, DDAT, DCC, DOPN, DDRY, DUE, DSLH, DID, DREG, DBRD
```

#### Level 3: Operators
```
LIST ID → FOR, BY, DOWNBY, \switches
```

#### Level 4: Conditions
```
LIST ID FOR → RC, LACT, DIM, PEN, VC, SCC
LIST ID FOR R → RC, REG, REM, RELV, RPRO
LIST ID FOR RC → RC=, RC>, RC<
LIST ID FOR RC= → 0, 1, 2, 3, 4, 5, 6, 7, 8
```

#### Level 5: Sort
```
LIST ID FOR RC=5 → BY, DOWNBY, \switches
LIST ID FOR RC=5 BY → PEN, DIM, DCC, LACT, MILK
```

#### Level 6: Switches
```
LIST ID FOR RC=5 BY PEN → \A, \B, \D, \T, \P, \2
```

### Fuzzy Matching с Fuse.js

**Примеры:**
```
lst rc5 → LIST FOR RC=5
sm mlk pn → SUM MILK BY PEN
brdsum → BREDSUM
lstdry → LIST FOR RC=6 (dry cows)
```

---

## Техническая архитектура

### Стек технологий

#### 1. Парсинг команд - Chevrotain

```typescript
import { createToken, Lexer, CstParser } from "chevrotain"

// Tokens для DairyComp
const List = createToken({ name: "List", pattern: /LIST/i })
const Sum = createToken({ name: "Sum", pattern: /SUM/i })
const Count = createToken({ name: "Count", pattern: /COUNT/i })
const For = createToken({ name: "For", pattern: /FOR/i })
const By = createToken({ name: "By", pattern: /BY/i })
const DownBy = createToken({ name: "DownBy", pattern: /DOWNBY/i })
const Equals = createToken({ name: "Equals", pattern: /=/ })
const Greater = createToken({ name: "Greater", pattern: />/ })
const Less = createToken({ name: "Less", pattern: /</ })
const GreaterEq = createToken({ name: "GreaterEq", pattern: />=/ })
const LessEq = createToken({ name: "LessEq", pattern: /<=/ })
const NotEq = createToken({ name: "NotEq", pattern: /<>/ })
const Item = createToken({ name: "Item", pattern: /[A-Z][A-Z0-9]{1,5}/ })
const Number = createToken({ name: "Number", pattern: /[0-9]+(\.[0-9]+)?/ })
const Switch = createToken({ name: "Switch", pattern: /\\[A-Z0-9]+/ })

const allTokens = [List, Sum, Count, For, By, DownBy, GreaterEq, LessEq, NotEq,
                   Equals, Greater, Less, Item, Number, Switch]

const lexer = new Lexer(allTokens)

class DairyCompParser extends CstParser {
  constructor() {
    super(allTokens)
    this.performSelfAnalysis()
  }

  command = this.RULE("command", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.listCommand) },
      { ALT: () => this.SUBRULE(this.sumCommand) },
      { ALT: () => this.SUBRULE(this.countCommand) },
    ])
  })

  listCommand = this.RULE("listCommand", () => {
    this.CONSUME(List)
    this.MANY(() => this.CONSUME(Item))
    this.OPTION1(() => this.SUBRULE(this.forClause))
    this.OPTION2(() => this.SUBRULE(this.sortClause))
    this.OPTION3(() => this.CONSUME(Switch))
  })

  forClause = this.RULE("forClause", () => {
    this.CONSUME(For)
    this.AT_LEAST_ONE(() => this.SUBRULE(this.condition))
  })

  condition = this.RULE("condition", () => {
    this.CONSUME(Item)
    this.OR([
      { ALT: () => this.CONSUME(Equals) },
      { ALT: () => this.CONSUME(Greater) },
      { ALT: () => this.CONSUME(Less) },
      { ALT: () => this.CONSUME(GreaterEq) },
      { ALT: () => this.CONSUME(LessEq) },
      { ALT: () => this.CONSUME(NotEq) },
    ])
    this.CONSUME(Number)
  })

  sortClause = this.RULE("sortClause", () => {
    this.OR([
      { ALT: () => this.CONSUME(By) },
      { ALT: () => this.CONSUME(DownBy) },
    ])
    this.CONSUME(Item)
  })
}

const parser = new DairyCompParser()
```

#### 2. Syntax Highlighting - PrismJS

```typescript
import Prism from 'prismjs'

Prism.languages.dairycomp = {
  'keyword': /\b(LIST|SHOW|COUNT|SUM|PCT|GRAPH|PLOT|EGRAPH|EPLOT|EVENTS|BREDSUM|ECON|MONITOR|COWVAL|SIRES|FILEOUT|CHKFILE|ALTER|SETUP|LOGON|CREATE|ABSORB)\b/i,
  'operator': /\b(FOR|BY|DOWNBY)\b/i,
  'item': /\b(ID|PEN|VC|REG|EID|CBRD|DID|SID|BDAT|EDAT|FDAT|CDAT|DDAT|HDAT|LACT|RC|LSIR|SIRC|TBRD|TOTM|MILK|SCC|DIM|DOPN|DCC|DSLH|AGE|RELV|RPRO|HINT|DCCP)\b/i,
  'comparison': /(>=|<=|<>|=|>|<)/,
  'number': /\b\d+(\.\d+)?\b/,
  'switch': /\\[A-Z0-9]+/i,
  'punctuation': /[.,-]/
}
```

#### 3. Autocomplete Engine - Fuse.js

```typescript
import Fuse from 'fuse.js'

// Все items для автодополнения
const ITEMS = [
  { code: 'ID', name: 'Animal ID', category: 'identification' },
  { code: 'PEN', name: 'Pen Number', category: 'identification' },
  { code: 'LACT', name: 'Lactation Number', category: 'reproduction' },
  { code: 'DIM', name: 'Days in Milk', category: 'calculated' },
  { code: 'MILK', name: 'Test Day Milk', category: 'production' },
  { code: 'SCC', name: 'Somatic Cell Count', category: 'production' },
  { code: 'RC', name: 'Reproductive Code', category: 'reproduction' },
  { code: 'DCC', name: 'Days Carried Calf', category: 'calculated' },
  // ... все остальные items
]

const fuse = new Fuse(ITEMS, {
  keys: ['code', 'name'],
  threshold: 0.3,
})

export function getSuggestions(input: string) {
  if (!input.trim()) {
    return ITEMS.slice(0, 10) // Популярные
  }

  const results = fuse.search(input)
  return results.map(r => r.item)
}

// RC values
const RC_VALUES = [
  { value: '0', label: 'Blank - young calves/heifers' },
  { value: '1', label: 'DNB - Do Not Breed' },
  { value: '2', label: 'FRESH - Recently calved' },
  { value: '3', label: 'OPEN - Ready to breed' },
  { value: '4', label: 'BRED - Inseminated' },
  { value: '5', label: 'PREG - Pregnant' },
  { value: '6', label: 'DRY - Dry period' },
  { value: '7', label: 'SLD/DIE - Sold/Died' },
  { value: '8', label: 'BULLCAF - Bull calf' },
]

export function getItemValues(item: string) {
  if (item === 'RC') return RC_VALUES
  // ... другие items с предопределенными значениями
  return []
}
```

#### 4. Command Executor

```typescript
import { createClient } from '@/lib/supabase/server'

interface CommandAST {
  command: 'LIST' | 'SUM' | 'COUNT' | ...
  items?: string[]
  conditions?: Condition[]
  sortBy?: { field: string, descending: boolean }
  switches?: string[]
}

interface Condition {
  field: string
  operator: '=' | '>' | '<' | '>=' | '<=' | '<>'
  value: string | number
}

export async function executeCommand(ast: CommandAST) {
  const supabase = await createClient()

  switch (ast.command) {
    case 'LIST':
      return executeList(supabase, ast)
    case 'SUM':
      return executeSum(supabase, ast)
    case 'COUNT':
      return executeCount(supabase, ast)
    // ... другие команды
  }
}

async function executeList(supabase, ast: CommandAST) {
  // Маппинг DairyComp items на поля БД
  const fieldMap = {
    'ID': 'ear_tag',
    'PEN': 'pen_id',
    'LACT': 'lactation_number',
    'DIM': 'dim',
    'MILK': 'last_milk_kg',
    'SCC': 'last_scc',
    'RC': 'rc_code',
    'DCC': 'days_carrying_calf',
    // ... все остальные
  }

  // Выбрать поля
  const selectFields = ast.items?.map(i => fieldMap[i] || i).join(',') || '*'

  let query = supabase
    .from('animals')
    .select(selectFields)

  // Применить условия
  ast.conditions?.forEach((cond) => {
    const field = fieldMap[cond.field] || cond.field.toLowerCase()

    switch (cond.operator) {
      case '=':
        query = query.eq(field, cond.value)
        break
      case '>':
        query = query.gt(field, cond.value)
        break
      case '<':
        query = query.lt(field, cond.value)
        break
      case '>=':
        query = query.gte(field, cond.value)
        break
      case '<=':
        query = query.lte(field, cond.value)
        break
      case '<>':
        query = query.neq(field, cond.value)
        break
    }
  })

  // Применить сортировку
  if (ast.sortBy) {
    const field = fieldMap[ast.sortBy.field] || ast.sortBy.field.toLowerCase()
    query = query.order(field, { ascending: !ast.sortBy.descending })
  }

  const { data, error } = await query

  if (error) {
    return { type: 'error', message: error.message }
  }

  return {
    type: 'list',
    columns: ast.items || Object.keys(data[0] || {}),
    data,
    count: data.length
  }
}
```

---

## План реализации

### Phase 1: CLI Bar + Basic Executor - 2-3 недели

**Цель:** Командная строка внизу с базовым парсингом и выполнением LIST

**Задачи:**
1. Создать фиксированную CLI bar внизу экрана
2. Простой парсер (regex) для LIST команд
3. Syntax highlighting (PrismJS)
4. Автодополнение items (Fuse.js)
5. Keyboard shortcuts (/, Ctrl+L для фокуса, ESC для выхода)
6. История команд (↑↓)
7. Executor для LIST → показывать результаты в main area

**Файлы:**
- `apps/web/src/components/cli/cli-bar.tsx` - фиксированная панель внизу
- `apps/web/src/components/cli/command-input.tsx` - инпут с подсветкой
- `apps/web/src/lib/cli/parser-simple.ts` - regex парсер для LIST
- `apps/web/src/lib/cli/syntax-highlighter.ts` - PrismJS грамматика
- `apps/web/src/lib/cli/autocomplete.ts` - Fuse.js автодополнение
- `apps/web/src/lib/cli/executor.ts` - выполнение LIST
- `apps/web/src/lib/cli/field-mapping.ts` - маппинг DairyComp → БД

**Результат:**
- CLI bar внизу на всех страницах
- Можно вводить `LIST ID PEN FOR RC=5`
- Результаты показываются в основной области
- Подсветка синтаксиса работает

---

### Phase 2: GUI ↔ CLI Синхронизация - 2 недели

**Цель:** Двусторонняя синхронизация между командами и GUI

**Задачи:**
1. Маппинг команд на разделы UI
2. Подсветка активного раздела sidebar при выполнении команды
3. Генерация команды при клике на sidebar
4. Navigation routing (команда меняет URL и раздел)
5. Breadcrumbs синхронизация

**Файлы:**
- `apps/web/src/lib/cli/command-to-route.ts` - маппинг команда → URL
- `apps/web/src/lib/cli/route-to-command.ts` - маппинг URL → команда
- `apps/web/src/hooks/use-cli-sync.ts` - React hook для синхронизации
- `apps/web/src/components/layout/sidebar.tsx` - обновить с подсветкой

**Пример маппинга:**
```typescript
const COMMAND_TO_ROUTE = {
  'LIST.*FOR DIM<21': '/animals?filter=fresh',
  'LIST.*FOR RC=5 DCC>220': '/animals?filter=dry-off',
  'SUM MILK BY PEN': '/dashboard?widget=milk-production',
  'BREDSUM': '/reports/breeding',
}
```

**Результат:**
- Команда → меняет URL и подсвечивает раздел
- Клик на sidebar → обновляет CLI команду
- Seamless переключение между CLI и mouse

---

### Phase 3: Full Parser (Chevrotain) - 2 недели

**Цель:** Полноценный парсер для всех DairyComp команд

**Задачи:**
1. Установить Chevrotain
2. Создать грамматику для всех команд (LIST, SUM, COUNT, etc.)
3. AST generation
4. Error recovery и сообщения об ошибках
5. Validation (проверка существования items)

**Файлы:**
- `apps/web/src/lib/cli/parser.ts` - Chevrotain парсер
- `apps/web/src/lib/cli/grammar.ts` - формальная грамматика
- `apps/web/src/lib/cli/validator.ts` - валидация команд

**Результат:**
- Парсинг всех типов команд DairyComp
- Понятные сообщения об ошибках
- "Did you mean..." подсказки

---

### Phase 4: Все команды (LIST, SUM, COUNT, PCT) - 2 недели

**Цель:** Расширить executor на базовые команды анализа

**Задачи:**
1. SUM - средние значения и группировка
2. COUNT - подсчет животных
3. PCT - процентные соотношения
4. BY/DOWNBY - сортировка
5. Switches (\A, \B, \T, etc.)
6. Экспорт результатов в CSV

**Файлы:**
- Расширить `apps/web/src/lib/cli/executor.ts`
- `apps/web/src/components/cli/results-table.tsx` - таблица результатов
- `apps/web/src/components/cli/export-button.tsx` - экспорт в CSV

**Результат:**
- SUM MILK BY PEN → показывает агрегацию
- COUNT FOR RC=5 → показывает количество
- Экспорт результатов работает

---

### Phase 5: Графики (GRAPH, PLOT, EGRAPH, EPLOT) - 2 недели

**Цель:** Визуализация данных через команды

**Задачи:**
1. GRAPH - гистограммы и scatter plots
2. PLOT - графики тестовых данных
3. EGRAPH - графики событий
4. EPLOT - графики BCS/роста/веса
5. Интеграция с Chart.js или Recharts

**Файлы:**
- `apps/web/src/components/cli/chart-renderer.tsx`
- `apps/web/src/lib/cli/chart-config.ts`
- Расширить executor для графиков

**Результат:**
- GRAPH MILK FOR LACT>0 → показывает гистограмму
- PLOT SCC → график SCC по времени
- Интерактивные графики

---

### Phase 6: Отчеты (BREDSUM, ECON, MONITOR, EVENTS) - 2 недели

**Цель:** Сложные отчеты и аналитика

**Задачи:**
1. BREDSUM - анализ программы осеменения
2. ECON - экономические расчеты
3. MONITOR - ежемесячная статистика
4. EVENTS - списки и таблицы событий
5. COWVAL, SIRES - оценка и справочники

**Файлы:**
- `apps/web/src/components/cli/report-renderer.tsx`
- `apps/web/src/lib/cli/report-generators.ts`
- Специализированные компоненты для каждого отчета

**Результат:**
- BREDSUM\e → полный breeding analysis
- EVENTS\5si → таблица событий за период
- Все отчеты DairyComp доступны

---

### Phase 7: Command Palette (Cmd+K) - 1 неделя

**Цель:** Быстрый доступ к командам через модал

**Задачи:**
1. Установить `cmdk`
2. Создать Command Palette компонент
3. Fuzzy search по истории
4. Категоризация команд
5. Интеграция с существующим CLI executor

**Файлы:**
- `apps/web/src/components/cli/command-palette.tsx`

**Результат:**
- Cmd+K → быстрый ввод команды
- Работает параллельно с CLI bar

---

### Phase 8: Продвинутые фичи - 2 недели

**Цель:** Полировка и продвинутые возможности

**Задачи:**
1. Command history persistence (localStorage)
2. Saved commands / aliases
3. Macro support (несколько команд последовательно)
4. Voice input (опционально)
5. Mobile CLI адаптация
6. Tutorial / onboarding для новых пользователей

**Файлы:**
- `apps/web/src/lib/cli/history.ts`
- `apps/web/src/lib/cli/macros.ts`
- `apps/web/src/components/cli/tutorial-overlay.tsx`

**Результат:**
- Полнофункциональный CLI
- Сохранение истории между сессиями
- Макросы для частых операций

---

**ИТОГО: 15-17 недель** (3.5-4 месяца)

### Критический путь (MVP за 7-8 недель):
- Phase 1: CLI Bar + Basic Executor (3 недели)
- Phase 2: GUI ↔ CLI Sync (2 недели)
- Phase 3: Full Parser (2 недели)
- Phase 4: Все базовые команды (2 недели)

**После MVP** можно запускать beta-тест с пользователями и приоритизировать Phases 5-8 на основе фидбека.

---

## Источники

Вся информация взята из официальной документации DairyComp 305:

1. [VAS Command Summary](https://dc-help.vas.com/ReferenceGuide/CommandLine/CmdSummary.htm)
2. [VAS Command Line Usage](https://dc-help.vas.com/ReferenceGuide/CommandLine/UsingCmdLine.htm)
3. [VAS Standard Items](https://platform-docs.vas.com/en-us/Content/Platform/Features/PlatCmdLine/ListItems.htm)
4. [VAS Reproductive Codes](https://dc-help.vas.com/ReferenceGuide/ReproCodes/ReproCodes.htm)
5. [VAS Veterinary Codes](https://dc-help.vas.com/ReferenceGuide/Vet/VetCodes.htm)
6. [VAS Common Terms and Commands](https://dc-help.vas.com/FAQs/VocabCommands.htm)
7. [Cornell DairyComp Command Sheet](https://dpm.cac.cornell.edu/TechDocs/DairyCompCommands.html)
8. [DairyComp Command Reference Guide (Rev. Nov 2023)](https://www.dairychallenge.org/pdfs/student_resources/DairyComp-Command-Reference-Guide-Rev20231103.pdf)
9. [DairyComp 305 Complete List PDF](https://www.dairychallenge.org/pdfs/student_resources/DairyComp305_CompleteList.pdf)
10. [DC305 Command Basics PDF](https://nationaldairyfarm.com/wp-content/uploads/2021/07/Command-Line-Basics.pdf)

---

**Автор:** Claude
**Дата:** 2026-01-24
**Статус:** Концепция, готова к review
