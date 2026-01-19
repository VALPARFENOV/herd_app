# HerdMaster Pro - Архитектура системы

## Обзор

HerdMaster Pro — облачная SaaS-система управления молочным стадом на базе Supabase с поддержкой multi-tenancy и возможностью развёртывания на серверах клиентов.

## Высокоуровневая архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                         КЛИЕНТЫ                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Web App    │  │  Mobile App │  │  Equipment Gateway      │  │
│  │  (Next.js)  │  │  (React     │  │  (DeLaval/Lely/GEA)     │  │
│  │             │  │   Native)   │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          └────────────────┼──────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     SUPABASE                                     │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  PostgREST  │  │  GoTrue     │  │  Realtime   │  │ Storage │ │
│  │  (REST API) │  │  (Auth)     │  │  (WebSocket)│  │ (S3)    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬────┘ │
│         └────────────────┼─────────────────┼──────────────┘      │
│                          │                 │                     │
│  ┌───────────────────────▼─────────────────▼───────────────────┐ │
│  │                    PostgreSQL + TimescaleDB                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │ │
│  │  │ Core Tables │  │ Time-Series │  │ RLS Policies        │  │ │
│  │  │ (animals,   │  │ (milk_      │  │ (tenant isolation)  │  │ │
│  │  │  events)    │  │  readings)  │  │                     │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Multi-tenancy

### Стратегия изоляции данных

| Тариф | Подход | Описание |
|-------|--------|----------|
| **Starter** | RLS | Единая БД, изоляция через `tenant_id` |
| **Professional** | RLS | Единая БД, изоляция через `tenant_id` |
| **Enterprise** | Schema | Отдельная PostgreSQL схема для клиента |
| **Dedicated** | Database | Отдельная инсталляция Supabase |

### Row Level Security (RLS)

Все таблицы имеют колонку `tenant_id` и политики:

```sql
-- Политика изоляции tenant
CREATE POLICY tenant_isolation ON animals
    FOR ALL
    USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());
```

JWT токен содержит `tenant_id`, который извлекается функцией `auth.tenant_id()`.

## Схема базы данных

### Core Tables

```
tenants          - Организации/фермы
├── profiles     - Пользователи (extends auth.users)
├── barns        - Коровники
├── pens         - Секции/загоны
├── animals      - Животные (основная сущность)
│   ├── events       - События (осеменения, отёлы, лечения)
│   └── lactations   - Лактации
```

### Time-Series (TimescaleDB)

```
milk_readings    - Данные с доильных установок
sensor_data      - Датчики (активность, температура)
activity_data    - Данные педометров
```

## Аутентификация

- **Provider:** Supabase GoTrue
- **Методы:** Email/Password, Magic Link
- **Токены:** JWT с `tenant_id` в claims
- **Роли:** owner, manager, veterinarian, zootechnician, worker, viewer

## API

### PostgREST (автоматический REST)

```
GET  /rest/v1/animals          - Список животных (с RLS)
POST /rest/v1/animals          - Создание животного
GET  /rest/v1/animals?id=eq.X  - Получение по ID
```

### Custom API (NestJS, планируется)

```
POST /api/sync                 - Синхронизация мобильного приложения
POST /api/reports/generate     - Генерация отчётов
POST /api/ml/predict           - ML предсказания
```

## Деплой

### Локальная разработка

```bash
# Supabase CLI (рекомендуется)
supabase start

# Или Docker
docker-compose up -d
```

### Production (Beget VPS)

| VPS | Сервисы |
|-----|---------|
| VPS 1 | Next.js, NestJS, Redis, MinIO |
| VPS 2 | Supabase (PostgreSQL, PostgREST, GoTrue) |
| VPS 3 | ML Service, Integration Service |
| VPS 4 | PostgreSQL Replica, Backup |

## Безопасность

- **Шифрование:** TLS 1.3 (transit), AES-256 (at rest)
- **Аутентификация:** JWT с короткоживущими токенами
- **Авторизация:** RBAC + RLS
- **Соответствие:** 152-ФЗ (данные в российских ЦОД)

## Мониторинг (планируется)

- **Metrics:** Prometheus + Grafana
- **Logging:** Loki
- **Alerting:** Grafana Alerts → Telegram
