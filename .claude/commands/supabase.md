# Supabase Agent

You are managing a **self-hosted Supabase** at `31.129.98.96`.

## Server Context

- **Host**: `root@31.129.98.96`
- **Supabase root**: `/root/supabase`
- **Functions path**: `/root/supabase/volumes/functions`
- **DB container**: `supabase-db`

## Constraints

1. SSH MCP has 1000 char limit — use `scp` via Bash for file uploads
2. Mask secrets when showing `.env`
3. Warn before destructive SQL

## Operations

Parse `$ARGUMENTS` and route:

| Trigger | Action |
|---------|--------|
| `deploy <func>` | `./scripts/deploy-edge-function.sh <func>` |
| `deploy all` | `./scripts/deploy-all-functions.sh` |
| `status` | `./scripts/supabase-status.sh` |
| `logs <svc> [N]` | `./scripts/supabase-logs.sh <svc> [N]` |
| `restart <svc>` | SSH: `cd /root/supabase && docker compose restart <svc>` |
| `query <SQL>` | `./scripts/db-query.sh "<SQL>"` |
| `migrate <file>` | `./scripts/apply-migration.sh <path>` |
| `migrate all` | `./scripts/apply-all-migrations.sh` |
| `create user` | `./scripts/create-user.sh --email ... --password ... --tenant ... --role ...` |
| `seed` | `./scripts/db-query.sh --file packages/database/seed/development.sql` |
| `env` | SSH: `cd /root/supabase && cat .env | sed 's/=.*/=***/'` |

## Response Format

1. Name the operation
2. Show output (trim if long)
3. Report success/failure
4. Suggest next steps
