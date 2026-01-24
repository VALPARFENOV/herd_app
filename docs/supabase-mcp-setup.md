# Настройка Supabase MCP для Self-Hosted установки

## Обзор

Эта инструкция описывает настройку доступа к MCP серверу в self-hosted Supabase через SSH туннель.

**Сервер:** 31.129.98.96 (herd.b2bautomate.ru)
**Локальный порт туннеля:** 8080 → удаленный порт 8000

## Шаг 1: Определение Docker Bridge Gateway IP

Подключитесь к серверу по SSH:

```bash
ssh root@31.129.98.96
```

Выполните команду для определения IP адреса Docker bridge gateway:

```bash
docker inspect supabase-kong \
  --format '{{range .NetworkSettings.Networks}}{{println .Gateway}}{{end}}'
```

Запишите полученный IP адрес (например, `172.18.0.1`).

## Шаг 2: Редактирование Kong конфигурации

Найдите файл Kong конфигурации:

```bash
# Обычно находится в одной из этих директорий
find /opt/supabase -name "kong.yml" 2>/dev/null
# или
find ~ -name "kong.yml" 2>/dev/null
# или в volumes
find . -path "*/volumes/api/kong.yml" 2>/dev/null
```

Откройте файл для редактирования (замените путь на актуальный):

```bash
nano ./volumes/api/kong.yml
```

Найдите секцию `## MCP endpoint - local access` (обычно в конце файла).

**Измените конфигурацию следующим образом:**

### До (заблокирован):
```yaml
## MCP endpoint - local access
- name: mcp
  _comment: 'MCP: /mcp -> http://studio:3000/api/mcp (local access)'
  url: http://studio:3000/api/mcp
  routes:
    - name: mcp
      strip_path: true
      paths:
        - /mcp
  plugins:
    # Block access to /mcp by default
    - name: request-termination
      config:
        status_code: 403
        message: "Access is forbidden."
```

### После (разрешен):
```yaml
## MCP endpoint - local access
- name: mcp
  _comment: 'MCP: /mcp -> http://studio:3000/api/mcp (local access)'
  url: http://studio:3000/api/mcp
  routes:
    - name: mcp
      strip_path: true
      paths:
        - /mcp
  plugins:
    # Block access to /mcp by default
    #- name: request-termination
    #  config:
    #    status_code: 403
    #    message: "Access is forbidden."
    # Enable local access (danger zone!)
    # 1. Comment out the 'request-termination' section above
    # 2. Uncomment the entire section below, including 'deny'
    # 3. Add your local IPs to the 'allow' list
    - name: cors
    - name: ip-restriction
      config:
        allow:
          - 127.0.0.1
          - ::1
          # Add your Docker bridge gateway IP below
          - 172.18.0.1  # <-- Замените на ваш IP из Шага 1
        # Do not remove deny!
        deny: []
```

**Важно:** Замените `172.18.0.1` на IP адрес, который вы получили в Шаге 1.

Сохраните файл (Ctrl+O, Enter, Ctrl+X в nano).

## Шаг 3: Перезапуск Kong

Найдите директорию с docker-compose файлом Supabase:

```bash
cd /opt/supabase  # или другая директория с вашей установкой
```

Перезапустите Kong контейнер:

```bash
docker compose restart kong
```

Проверьте логи Kong на наличие ошибок:

```bash
docker compose logs kong --tail 50
```

Если есть ошибки, проверьте синтаксис YAML в kong.yml.

## Шаг 4: Создание SSH туннеля

**На локальной машине** откройте новый терминал и создайте SSH туннель:

```bash
ssh -L localhost:8080:localhost:8000 root@31.129.98.96
```

Оставьте это соединение активным. Можно также добавить `-N` флаг для туннеля без shell:

```bash
ssh -N -L localhost:8080:localhost:8000 root@31.129.98.96
```

**Совет:** Для автоматического запуска туннеля можно создать systemd service или использовать autossh.

## Шаг 5: Проверка доступа к MCP

На локальной машине проверьте доступность MCP сервера:

```bash
curl http://localhost:8080/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {
        "elicitation": {}
      },
      "clientInfo": {
        "name": "test-client",
        "title": "Test Client",
        "version": "1.0.0"
      }
    }
  }'
```

Ожидаемый ответ должен содержать JSON с информацией о MCP сервере.

## Шаг 6: Настройка Claude Code

Откройте настройки Claude Code:

```bash
code ~/.config/claude-code/settings.json
# или на macOS
code ~/Library/Application\ Support/claude-code/settings.json
```

Добавьте конфигурацию MCP сервера в секцию `mcpServers`:

```json
{
  "mcpServers": {
    "supabase-herdmaster": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

Если файл не существует, создайте его с этим содержимым:

```json
{
  "mcpServers": {
    "supabase-herdmaster": {
      "url": "http://localhost:8080/mcp"
    }
  },
  "allowedMcpServers": ["supabase-herdmaster"]
}
```

Сохраните файл и перезапустите Claude Code.

## Шаг 7: Проверка работы MCP в Claude Code

В Claude Code выполните тестовый запрос:

```
Какой у меня Supabase anon key? Используй инструменты Supabase MCP сервера.
```

Claude должен использовать MCP tools для получения информации из вашего Supabase instance.

## Устранение неполадок

### MCP сервер недоступен

1. Проверьте, что SSH туннель активен:
   ```bash
   ps aux | grep "ssh.*8080"
   ```

2. Проверьте, что Kong конфигурация применилась:
   ```bash
   docker exec supabase-kong cat /usr/local/kong/declarative/kong.yml | grep -A 30 "MCP endpoint"
   ```

3. Проверьте логи Kong:
   ```bash
   docker compose logs kong --tail 100
   ```

### Ошибка 403 Forbidden

Убедитесь, что:
- Секция `request-termination` закомментирована
- Docker bridge gateway IP правильно указан в списке `allow`
- Kong контейнер перезапущен после изменений

### Claude Code не видит MCP сервер

1. Проверьте путь к файлу настроек Claude Code
2. Убедитесь, что JSON синтаксис корректен
3. Перезапустите Claude Code полностью
4. Проверьте логи Claude Code

## Автоматизация SSH туннеля (опционально)

Создайте скрипт для автоматического запуска туннеля:

```bash
#!/bin/bash
# ~/.local/bin/supabase-mcp-tunnel.sh

while true; do
    echo "Starting SSH tunnel to Supabase MCP..."
    ssh -N -L localhost:8080:localhost:8000 root@31.129.98.96
    echo "Tunnel closed. Reconnecting in 5 seconds..."
    sleep 5
done
```

Сделайте скрипт исполняемым:

```bash
chmod +x ~/.local/bin/supabase-mcp-tunnel.sh
```

Запустите в фоне:

```bash
nohup ~/.local/bin/supabase-mcp-tunnel.sh > /tmp/mcp-tunnel.log 2>&1 &
```

## Безопасность

**ВАЖНО:**
- Никогда не выставляйте MCP endpoint в интернет напрямую
- Используйте только VPN или SSH туннель для доступа
- Регулярно проверяйте список разрешенных IP в Kong конфигурации
- Рассмотрите использование OAuth 2.1 когда это станет доступно

## Документация

- [Supabase MCP Server Documentation](https://supabase.com/docs/guides/self-hosting/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
