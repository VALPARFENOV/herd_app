# Session Log: 2026-01-24 - Supabase MCP Setup

## Дата
24 января 2026

## Задача
Настройка Supabase MCP (Model Context Protocol) для self-hosted установки на сервере 31.129.98.96 (herd.b2bautomate.ru) с доступом через SSH туннель.

## Что сделано

### Документация
1. **docs/supabase-mcp-setup.md** - Полная пошаговая инструкция по настройке MCP:
   - Определение Docker bridge gateway IP
   - Редактирование Kong конфигурации
   - Настройка ip-restriction plugin
   - Создание SSH туннеля
   - Конфигурация Claude Code
   - Troubleshooting guide

2. **docs/QUICKSTART-MCP.md** - Краткая инструкция быстрого старта для опытных пользователей

### Скрипты
1. **scripts/setup-mcp-server.sh** - Автоматическая настройка на сервере:
   - Поиск Docker bridge gateway IP
   - Автоматическое редактирование kong.yml
   - Создание backup конфигурации
   - Перезапуск Kong контейнера

2. **scripts/start-mcp-tunnel.sh** - Запуск SSH туннеля с локальной машины:
   - Автоматический реконнект при разрыве
   - Проверка занятости порта

3. **scripts/test-mcp-local.sh** - Тестирование MCP endpoint:
   - Проверка доступности
   - Инициализация MCP протокола
   - Получение списка tools

4. **scripts/README.md** - Описание скриптов

### Конфигурация
1. **.claude/mcp-config.json** - Готовая конфигурация для Claude Code с настройками подключения к MCP серверу

## Технические решения

### Безопасность
- MCP endpoint доступен только через SSH туннель
- Kong настроен на разрешение доступа только с Docker bridge gateway IP
- Автоматическое создание backup перед изменением конфигурации

### Автоматизация
- Скрипт setup-mcp-server.sh полностью автоматизирует настройку на сервере
- Скрипт start-mcp-tunnel.sh поддерживает постоянное соединение с реконнектом
- Скрипт test-mcp-local.sh позволяет быстро проверить работоспособность

### Структура
```
herd_app/
├── .claude/
│   ├── mcp-config.json          # Конфигурация MCP для Claude Code
│   └── sessions/
│       └── 2026-01-24-supabase-mcp-setup.md
├── docs/
│   ├── supabase-mcp-setup.md    # Полная инструкция
│   └── QUICKSTART-MCP.md        # Быстрый старт
└── scripts/
    ├── setup-mcp-server.sh      # Настройка на сервере
    ├── start-mcp-tunnel.sh      # SSH туннель
    ├── test-mcp-local.sh        # Тестирование
    └── README.md                # Описание скриптов
```

## Следующие шаги

1. **На сервере (31.129.98.96):**
   ```bash
   scp scripts/setup-mcp-server.sh root@31.129.98.96:/tmp/
   ssh root@31.129.98.96
   /tmp/setup-mcp-server.sh
   ```

2. **На локальной машине:**
   ```bash
   # Запустить SSH туннель
   ./scripts/start-mcp-tunnel.sh

   # В другом терминале - протестировать
   ./scripts/test-mcp-local.sh

   # Настроить Claude Code
   mkdir -p ~/.config/claude-code
   cp .claude/mcp-config.json ~/.config/claude-code/settings.json
   ```

3. **Проверка в Claude Code:**
   - Перезапустить Claude Code
   - Спросить: "Какой у меня Supabase anon key? Используй инструменты MCP сервера"

## Важные заметки

- SSH туннель должен быть активен для работы с MCP
- Kong конфигурация требует правильный Docker bridge gateway IP (обычно 172.18.0.1)
- MCP endpoint НЕ должен быть доступен из интернета напрямую
- Все скрипты исполняемые (chmod +x применен)

## Референсы

- [Supabase Self-Hosting MCP Documentation](https://supabase.com/docs/guides/self-hosting/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- Конфигурация Supabase: `/Users/valeryparfenov/Projects/Personal/herd_app/apps/web/.env.local`
- Сервер: 31.129.98.96 (herd.b2bautomate.ru)
