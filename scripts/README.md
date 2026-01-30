# HerdMaster Pro - Scripts

Вспомогательные скрипты для настройки и управления проектом.

## MCP Scripts

### setup-mcp-server.sh
**Запускать на сервере (31.129.98.96)**

Автоматическая настройка Supabase MCP сервера:
- Определяет Docker bridge gateway IP
- Находит и редактирует kong.yml
- Настраивает ip-restriction для доступа
- Перезапускает Kong контейнер

```bash
scp setup-mcp-server.sh root@31.129.98.96:/tmp/
ssh root@31.129.98.96
/tmp/setup-mcp-server.sh
```

### start-mcp-tunnel.sh
**Запускать на локальной машине**

Создает SSH туннель для доступа к MCP серверу:
- localhost:8080 → 31.129.98.96:8000
- Автоматический реконнект при разрыве соединения

```bash
./scripts/start-mcp-tunnel.sh
```

Держите терминал открытым пока работаете с MCP.

### test-mcp-local.sh
**Запускать на локальной машине**

Тестирование доступности MCP сервера:
- Проверяет доступность endpoint
- Инициализирует MCP протокол
- Получает список доступных инструментов

```bash
./scripts/test-mcp-local.sh
```

## Использование

См. документацию:
- Быстрый старт: `docs/QUICKSTART-MCP.md`
- Полная инструкция: `docs/supabase-mcp-setup.md`

## Supabase Management Scripts

Скрипты для управления удалённым Supabase через SSH. Используются слеш-командой `/supabase`.

### supabase-status.sh

Проверка состояния сервера: Docker-контейнеры, диск, память.

```bash
./scripts/supabase-status.sh
```

### supabase-logs.sh

Просмотр логов Docker Compose сервиса.

```bash
./scripts/supabase-logs.sh <service> [lines]
# Сервисы: functions auth rest realtime db kong meta storage mcp-server
```

### db-query.sh

Выполнение SQL-запросов (inline или из файла). Предупреждает о деструктивных запросах.

```bash
./scripts/db-query.sh "SELECT count(*) FROM public.animals"
./scripts/db-query.sh --file path/to/query.sql
./scripts/db-query.sh --force "DROP TABLE ..."   # без подтверждения
```

### deploy-edge-function.sh

Деплой одной edge-функции на сервер.

```bash
./scripts/deploy-edge-function.sh <function-name> [--no-restart] [--dry-run]
```

### deploy-all-functions.sh

Деплой всех edge-функций с единым рестартом контейнера.

```bash
./scripts/deploy-all-functions.sh [--dry-run]
```

### apply-migration.sh

Применение одной SQL-миграции на УДАЛЁННЫЙ сервер (через SSH + docker exec).

```bash
./scripts/apply-migration.sh packages/database/schema/002_some_migration.sql
```

> **Примечание:** Отличается от `apply-migrations.sh`, который работает с ЛОКАЛЬНЫМ Supabase.

### apply-all-migrations.sh

Применение всех миграций из `packages/database/schema/` в лексикографическом порядке.

```bash
./scripts/apply-all-migrations.sh [--dry-run] [--from <timestamp>] [--include-initial]
```

- `--dry-run` — только показать список миграций
- `--from <timestamp>` — пропустить миграции до указанного timestamp
- `--include-initial` — включить `001_core_tables` (пропускается по умолчанию)

### create-user.sh

Создание пользователя: auth.users (GoTrue API) + public.profiles (SQL INSERT).

```bash
./scripts/create-user.sh --email user@farm.ru --password secret123 --tenant <uuid> [--name "Иванов И.И."] [--role veterinarian]
```

- `--tenant` обязателен (profiles.tenant_id NOT NULL)
- Роли: `owner manager veterinarian zootechnician accountant worker viewer`

## Требования

- SSH доступ к серверу 31.129.98.96
- curl (для тестирования)
- jq (опционально, для красивого вывода JSON)
- Docker и docker-compose на сервере
