# 2026-01-20: Настройка VPS инфраструктуры

## Что сделано

### VPS (31.129.98.96)
- Увеличены ресурсы: 4GB RAM, 2 CPU, 40GB диск
- Установлен Supabase self-hosted (PostgreSQL, PostgREST, GoTrue, Realtime, Storage, Kong)
- Установлен TimescaleDB 2.24.0
- Установлен Redis 7
- Настроен Traefik с Let's Encrypt SSL

### Домены и SSL
- `herd.b2bautomate.ru` → Supabase API (SSL ✓)
- `studio.b2bautomate.ru` → Supabase Studio (SSL ✓, basic auth)
- `apps.b2bautomate.ru` → n8n (уже был)

### База данных
- Применена схема из `packages/database/schema/001_core_tables.sql`
- Созданы таблицы: tenants, profiles, barns, pens, animals, events, lactations
- Настроены RLS политики
- Auth настроен с автоподтверждением email (без отправки писем)

### Локальный проект
- Создан `apps/web/.env.local` с credentials для подключения к VPS

## Важные credentials

```
# Supabase API
URL: https://herd.b2bautomate.ru
ANON_KEY: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY4ODUwNzU0LCJleHAiOjIwODQyMTA3NTR9.CSiogeSd6tfnY3GezBgBv6SojC-Ach8Vh5cz0QEN2Ck
SERVICE_KEY: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njg4NTA3NTQsImV4cCI6MjA4NDIxMDc1NH0.bj_Hu5ymhBZM2SMboLwAZ25E2TAKVrVlLNJKiXI1DXY

# Studio
URL: https://studio.b2bautomate.ru
Login: admin
Password: UUpyhGqb9pcm35Fh

# PostgreSQL
Host: 31.129.98.96:5432
User: postgres
Password: Bbavt4ba2vBN0VWKMDPIxpXfadOrutKR

# Redis
Host: 31.129.98.96:6379
```

## Конфигурационные файлы на VPS

- `/root/docker-compose.yml` — Traefik, n8n, Studio
- `/root/supabase/docker-compose.yml` — Supabase сервисы
- `/root/supabase/.env` — переменные Supabase
- `/root/n8n/traefik/studio.yml` — Traefik file provider для Studio

## Следующие шаги

1. Запустить `pnpm dev` локально и проверить подключение к удалённой БД
2. Добавить seed данные для разработки
3. Начать разработку UI
