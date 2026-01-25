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

## Требования

- SSH доступ к серверу 31.129.98.96
- curl (для тестирования)
- jq (опционально, для красивого вывода JSON)
- Docker и docker-compose на сервере
