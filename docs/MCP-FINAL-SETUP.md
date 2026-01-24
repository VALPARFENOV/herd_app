# Supabase MCP - Финальная рабочая конфигурация

## Что было сделано

1. ✅ Добавлен MCP сервер контейнер в docker-compose.yml
2. ✅ Настроен Kong для проксирования MCP endpoint
3. ✅ Создан SSH туннель для доступа
4. ✅ Настроена конфигурация Claude Code

## Важное открытие

**Community MCP серверы работают через stdio (stdin/stdout), а не HTTP**. Это означает, что Claude Code должен подключаться напрямую к MCP процессу, а не через HTTP туннель.

## Рабочая конфигурация для Claude Code

### Способ 1: Прямое подключение через SSH (Рекомендуется)

Скопируйте конфигурацию:

```bash
mkdir -p ~/.config/claude-code
cp .claude/mcp-config-direct.json ~/.config/claude-code/settings.json
```

Или создайте файл `~/.config/claude-code/settings.json` вручную:

```json
{
  "mcpServers": {
    "supabase-herdmaster": {
      "command": "ssh",
      "args": [
        "root@31.129.98.96",
        "docker",
        "exec",
        "-i",
        "supabase-mcp",
        "node",
        "dist/index.js"
      ],
      "description": "Self-hosted Supabase MCP server for HerdMaster Pro"
    }
  }
}
```

**Как это работает:**
- Claude Code запускает SSH подключение к серверу
- Выполняет команду `docker exec` для подключения к MCP контейнеру
- Взаимодействует с MCP через stdio (стандартный ввод/вывод)

### Способ 2: HTTP endpoint (Для будущего использования)

Когда Supabase выпустит официальную версию Studio с HTTP MCP endpoint, можно будет использовать SSH туннель:

```json
{
  "mcpServers": {
    "supabase-herdmaster-http": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

**SSH туннель:**
```bash
./scripts/start-mcp-tunnel.sh
```

## Проверка работы

### Шаг 1: Убедитесь что MCP контейнер запущен

```bash
ssh root@31.129.98.96 "docker ps | grep mcp"
```

Должно показать:
```
supabase-mcp    Running
```

### Шаг 2: Проверьте логи MCP

```bash
ssh root@31.129.98.96 "docker logs supabase-mcp --tail 20"
```

Должно быть:
```
Initialization complete.
Supabase client initialized successfully.
...
MCP Server connected to stdio.
```

### Шаг 3: Перезапустите Claude Code

Закройте и откройте Claude Code заново чтобы применить новую конфигурацию.

### Шаг 4: Протестируйте в Claude Code

Откройте Claude Code и спросите:

```
Какие таблицы есть в моей Supabase БД? Используй инструменты MCP сервера.
```

Claude должен использовать MCP tools и показать список таблиц.

## Текущая инфраструктура

### На сервере (31.129.98.96)

```
┌─────────────────────────────────────┐
│ Docker Containers                   │
├─────────────────────────────────────┤
│ supabase-kong:8000                  │
│   ↓                                 │
│ supabase-mcp                        │
│   - Image: selfhosted-supabase-mcp  │
│   - Mode: stdio                     │
│   - Env:                            │
│     SUPABASE_URL=http://kong:8000   │
│     SUPABASE_ANON_KEY=...           │
│     SERVICE_ROLE_KEY=...            │
│     DATABASE_URL=postgresql://...   │
└─────────────────────────────────────┘
```

### Локальная машина

```
┌──────────────────────────────────────┐
│ Claude Code                          │
│   ↓ (SSH + docker exec)              │
│ ssh root@31.129.98.96                │
│   ↓                                  │
│ docker exec -i supabase-mcp ...      │
│   ↓ (stdio communication)            │
│ MCP Server                           │
└──────────────────────────────────────┘
```

## Альтернативные варианты

Если прямое SSH подключение не работает, можно:

1. **Запустить MCP локально** - клонировать репозиторий на локальную машину и запустить с переменными окружения, указывающими на удаленный Supabase

2. **Использовать официальный Supabase Cloud** - если есть проект в Supabase Cloud, там уже есть встроенный MCP с HTTP

3. **Обновить Supabase до последней версии** - ждать когда официальный MCP endpoint появится в Studio

## Дополнительные инструменты MCP

Установленный MCP сервер предоставляет следующие инструменты:

- `get_tables` - Получить список таблиц
- `get_table_info` - Информация о структуре таблицы
- `execute_sql` - Выполнить SQL запрос
- `get_bucket_objects` - Получить объекты из Storage bucket
- И другие...

Полный список можно посмотреть спросив Claude Code: "Какие MCP tools доступны?"

## Troubleshooting

### MCP сервер не отвечает

```bash
# Перезапустить контейнер
ssh root@31.129.98.96 "cd /root/supabase && docker compose restart mcp-server"

# Проверить логи
ssh root@31.129.98.96 "docker logs supabase-mcp -f"
```

### Claude Code не видит MCP сервер

1. Проверьте путь к файлу настроек (может быть `~/Library/Application Support/claude-code/settings.json` на macOS)
2. Убедитесь в корректности JSON синтаксиса
3. Перезапустите Claude Code полностью
4. Проверьте что SSH доступ к серверу работает: `ssh root@31.129.98.96 echo "OK"`

### Ошибка при выполнении SQL

Убедитесь, что в БД создана функция `execute_sql`:

```sql
-- Подключитесь к PostgreSQL
ssh root@31.129.98.96 "docker exec -it supabase-db psql -U postgres -d postgres"

-- Создайте функцию (если нужно)
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN query_to_json(EXECUTE query);
END;
$$;
```

## Полезные ссылки

- [Официальная документация Supabase MCP](https://supabase.com/docs/guides/self-hosting/enable-mcp)
- [HenkDz/selfhosted-supabase-mcp](https://github.com/HenkDz/selfhosted-supabase-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Автор:** Claude Sonnet 4.5
**Дата:** 24 января 2026
**Проект:** HerdMaster Pro
