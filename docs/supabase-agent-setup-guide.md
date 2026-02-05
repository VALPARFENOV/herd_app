# Supabase Agent: Setup Guide for Any Project

Generic guide for deploying the Supabase management toolchain (scripts + Claude Code slash command) in a new project with a self-hosted Supabase instance.

---

## Prerequisites

- Self-hosted Supabase instance accessible via SSH
- SSH key-based auth configured (`ssh root@<HOST>` works without password prompt)
- Docker Compose used to manage Supabase services on the server
- Claude Code CLI installed with project initialized (`.claude/` directory)

---

## Step 1: Gather Project-Specific Values

Before starting, collect these values for your project:

| Variable | Description | Example |
|----------|-------------|---------|
| `REMOTE_HOST` | SSH user@host for the server | `root@109.69.20.254` |
| `REMOTE_SUPABASE_PATH` | Path to docker-compose.yml on server | `/opt/beget/supabase` |
| `REMOTE_FUNCTIONS_PATH` | Path to edge functions on server | `/opt/beget/supabase/volumes/functions` |
| `LOCAL_FUNCTIONS_PATH` | Local path to functions relative to project root | `supabase/functions` |
| `DB_CONTAINER` | Name of the PostgreSQL Docker container | `supabase-db` |
| `MIGRATIONS_PATH` | Local path to migration files | `supabase/migrations` |

To discover container names on your server:

```bash
ssh root@<HOST> "cd <REMOTE_SUPABASE_PATH> && docker-compose ps"
```

To discover env var names (needed for `create-user.sh`):

```bash
ssh root@<HOST> "cd <REMOTE_SUPABASE_PATH> && grep -E 'API_EXTERNAL|SERVICE_ROLE' .env | sed 's/=.*/=***/' "
```

---

## Step 2: Create Directory Structure

```bash
mkdir -p scripts
mkdir -p .claude/commands
```

---

## Step 3: Create Scripts

Each script below has a header block with configuration variables. Replace placeholders with your project values.

### 3.1. `scripts/supabase-status.sh`

Checks Docker containers, disk, memory, Docker disk usage.

```bash
#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@<YOUR_HOST>"
REMOTE_PATH="<YOUR_REMOTE_SUPABASE_PATH>"
# ======================

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

echo -e "${CYAN}=== Supabase Server Status ===${NC}"
echo -e "${YELLOW}--- Docker Services ---${NC}"
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && docker-compose ps"
echo ""
echo -e "${YELLOW}--- Disk Usage ---${NC}"
ssh "$REMOTE_HOST" "df -h / | tail -1"
echo ""
echo -e "${YELLOW}--- Memory Usage ---${NC}"
ssh "$REMOTE_HOST" "free -h | head -2"
echo ""
echo -e "${YELLOW}--- Docker Disk Usage ---${NC}"
ssh "$REMOTE_HOST" "docker system df"
echo ""
echo -e "${GREEN}Status check complete.${NC}"
```

### 3.2. `scripts/supabase-logs.sh`

View logs for a Docker Compose service.

```bash
#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@<YOUR_HOST>"
REMOTE_PATH="<YOUR_REMOTE_SUPABASE_PATH>"
VALID_SERVICES="functions auth rest realtime db kong meta storage"  # adjust to your services
# ======================

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: Service name required${NC}"
    echo "Usage: $0 <service> [lines]"
    echo "Available services: $VALID_SERVICES"
    exit 1
fi

SERVICE="$1"
LINES="${2:-50}"

if ! echo "$VALID_SERVICES" | grep -qw "$SERVICE"; then
    echo -e "${RED}Error: Unknown service '$SERVICE'${NC}"
    echo "Available services: $VALID_SERVICES"
    exit 1
fi

echo -e "${YELLOW}Fetching last $LINES lines of '$SERVICE' logs...${NC}"
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && docker-compose logs --tail=$LINES $SERVICE"
echo -e "${GREEN}Log fetch complete.${NC}"
```

### 3.3. `scripts/db-query.sh`

Execute SQL inline or from a file. Warns before destructive queries.

```bash
#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@<YOUR_HOST>"
DB_CONTAINER="<YOUR_DB_CONTAINER>"       # e.g. supabase-db
# ======================

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

MODE="inline"
FORCE=false
SQL_QUERY=""
SQL_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --file) MODE="file"; SQL_FILE="$2"; shift 2 ;;
        --force) FORCE=true; shift ;;
        *) SQL_QUERY="$1"; shift ;;
    esac
done

if [ "$MODE" = "inline" ] && [ -z "$SQL_QUERY" ]; then
    echo -e "${RED}Error: SQL query required${NC}"
    echo "Usage:"
    echo "  $0 \"SELECT count(*) FROM my_table\""
    echo "  $0 --file path/to/query.sql"
    exit 1
fi

if [ "$MODE" = "file" ] && [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: File not found: $SQL_FILE${NC}"
    exit 1
fi

check_destructive() {
    local query_upper
    query_upper=$(echo "$1" | tr '[:lower:]' '[:upper:]')
    if echo "$query_upper" | grep -qE '\b(DELETE|DROP|TRUNCATE|ALTER)\b'; then
        if [ "$FORCE" = false ]; then
            echo -e "${RED}WARNING: Destructive query detected!${NC}"
            read -p "Are you sure? (yes/no): " confirm
            if [ "$confirm" != "yes" ]; then echo "Aborted."; exit 0; fi
        fi
    fi
}

if [ "$MODE" = "inline" ]; then
    check_destructive "$SQL_QUERY"
    echo -e "${CYAN}Executing:${NC} ${YELLOW}$SQL_QUERY${NC}"
    ssh "$REMOTE_HOST" "docker exec $DB_CONTAINER psql -U postgres -d postgres -c \"$SQL_QUERY\""
else
    [ "$FORCE" = false ] && check_destructive "$(cat "$SQL_FILE")"
    REMOTE_TMP="/tmp/db-query-$(date +%s).sql"
    echo -e "${CYAN}Executing from file: $SQL_FILE${NC}"
    scp "$SQL_FILE" "$REMOTE_HOST:$REMOTE_TMP" >/dev/null
    ssh "$REMOTE_HOST" "docker exec -i $DB_CONTAINER psql -U postgres -d postgres < $REMOTE_TMP"
    ssh "$REMOTE_HOST" "rm -f $REMOTE_TMP" >/dev/null 2>&1
fi

echo -e "${GREEN}Query complete.${NC}"
```

### 3.4. `scripts/deploy-edge-function.sh`

Deploy a single edge function. Handles multi-file functions (subdirectories with `.ts` files).

```bash
#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@<YOUR_HOST>"
REMOTE_FUNCTIONS_PATH="<YOUR_REMOTE_FUNCTIONS_PATH>"
REMOTE_SUPABASE_PATH="<YOUR_REMOTE_SUPABASE_PATH>"
LOCAL_FUNCTIONS_PATH="supabase/functions"
# ======================

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

NO_RESTART=false
DRY_RUN=false
FUNCTION_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-restart) NO_RESTART=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) FUNCTION_NAME="$1"; shift ;;
    esac
done

if [ -z "$FUNCTION_NAME" ]; then
    echo -e "${RED}Error: Function name required${NC}"
    echo "Usage: $0 <function-name> [--no-restart] [--dry-run]"
    echo "Available functions:"
    ls -1 "$LOCAL_FUNCTIONS_PATH" 2>/dev/null | grep -v "^_" || echo "  None found"
    exit 1
fi

LOCAL_DIR="$LOCAL_FUNCTIONS_PATH/$FUNCTION_NAME"
if [ ! -d "$LOCAL_DIR" ]; then
    echo -e "${RED}Error: Directory not found: $LOCAL_DIR${NC}"; exit 1
fi

FILE_COUNT=$(find "$LOCAL_DIR" -type f -name "*.ts" | wc -l | tr -d ' ')
echo -e "${YELLOW}Deploying: $FUNCTION_NAME ($FILE_COUNT file(s))${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${CYAN}[DRY RUN] Would deploy:${NC}"
    find "$LOCAL_DIR" -type f -name "*.ts" | while read -r f; do
        echo "  $f -> $REMOTE_HOST:$REMOTE_FUNCTIONS_PATH/$FUNCTION_NAME/${f#$LOCAL_DIR/}"
    done
    [ "$NO_RESTART" = false ] && echo -e "${CYAN}[DRY RUN] Would restart container${NC}"
    exit 0
fi

echo -e "1. Uploading files..."
if [ "$FILE_COUNT" -gt 1 ]; then
    # Ensure remote subdirectories exist, then copy each file
    find "$LOCAL_DIR" -type d | while read -r dir; do
        RELATIVE="${dir#$LOCAL_DIR}"
        [ -n "$RELATIVE" ] && ssh "$REMOTE_HOST" "mkdir -p $REMOTE_FUNCTIONS_PATH/$FUNCTION_NAME$RELATIVE"
    done
    find "$LOCAL_DIR" -type f -name "*.ts" | while read -r f; do
        RELATIVE="${f#$LOCAL_DIR/}"
        scp "$f" "$REMOTE_HOST:$REMOTE_FUNCTIONS_PATH/$FUNCTION_NAME/$RELATIVE"
    done
else
    scp "$LOCAL_DIR/index.ts" "$REMOTE_HOST:$REMOTE_FUNCTIONS_PATH/$FUNCTION_NAME/index.ts"
fi
echo -e "${GREEN}   Files uploaded${NC}"

if [ "$NO_RESTART" = false ]; then
    echo -e "2. Restarting container..."
    ssh "$REMOTE_HOST" "cd $REMOTE_SUPABASE_PATH && docker-compose restart functions"
    sleep 3
    CONTAINER_STATUS=$(ssh "$REMOTE_HOST" "docker ps --filter 'name=edge-functions' --format '{{.Status}}'" 2>/dev/null)
    if [[ "$CONTAINER_STATUS" == *"Up"* ]]; then
        echo -e "${GREEN}   Running: $CONTAINER_STATUS${NC}"
    else
        echo -e "${RED}   Warning: $CONTAINER_STATUS${NC}"
    fi
else
    echo -e "2. ${CYAN}Skipping restart (--no-restart)${NC}"
fi

echo -e "${GREEN}Deploy complete: $FUNCTION_NAME${NC}"
```

### 3.5. `scripts/deploy-all-functions.sh`

Iterates all function dirs, deploys with `--no-restart`, then restarts once.

```bash
#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@<YOUR_HOST>"
REMOTE_SUPABASE_PATH="<YOUR_REMOTE_SUPABASE_PATH>"
LOCAL_FUNCTIONS_PATH="supabase/functions"
# ======================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

DRY_RUN=""
[ "$1" = "--dry-run" ] && DRY_RUN="--dry-run"

echo -e "${CYAN}=== Deploying All Edge Functions ===${NC}"

SUCCEEDED=0 FAILED=0 FAILED_NAMES=""

for FUNC_DIR in "$LOCAL_FUNCTIONS_PATH"/*/; do
    FUNC_NAME=$(basename "$FUNC_DIR")
    [[ "$FUNC_NAME" == _* ]] && continue
    [ ! -f "$FUNC_DIR/index.ts" ] && continue

    echo -e "${YELLOW}--- $FUNC_NAME ---${NC}"
    if "$SCRIPT_DIR/deploy-edge-function.sh" "$FUNC_NAME" --no-restart $DRY_RUN; then
        SUCCEEDED=$((SUCCEEDED + 1))
    else
        FAILED=$((FAILED + 1))
        FAILED_NAMES="$FAILED_NAMES $FUNC_NAME"
    fi
done

if [ -z "$DRY_RUN" ] && [ "$SUCCEEDED" -gt 0 ]; then
    echo -e "${YELLOW}--- Restarting container ---${NC}"
    ssh "$REMOTE_HOST" "cd $REMOTE_SUPABASE_PATH && docker-compose restart functions"
    sleep 3
fi

echo -e "${CYAN}=== Summary: ${GREEN}$SUCCEEDED OK${NC}"
[ "$FAILED" -gt 0 ] && echo -e "${RED}Failed: $FAILED ($FAILED_NAMES)${NC}"
```

### 3.6. `scripts/apply-migration.sh`

Upload a single SQL migration via SCP, execute via `psql` inside the DB container.

```bash
#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@<YOUR_HOST>"
DB_CONTAINER="<YOUR_DB_CONTAINER>"
MIGRATIONS_PATH="supabase/migrations"   # used for listing available migrations
# ======================

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: Migration file path required${NC}"
    echo "Usage: $0 <migration-file>"
    echo "Available migrations:"
    ls -1 "$MIGRATIONS_PATH"/*.sql 2>/dev/null | xargs -I{} basename {} || echo "  None"
    exit 1
fi

MIGRATION_FILE="$1"
[ ! -f "$MIGRATION_FILE" ] && echo -e "${RED}Error: File not found: $MIGRATION_FILE${NC}" && exit 1

MIGRATION_NAME=$(basename "$MIGRATION_FILE")
REMOTE_TMP="/tmp/migration-$MIGRATION_NAME"

echo -e "${CYAN}Applying: ${YELLOW}$MIGRATION_NAME${NC}"
scp "$MIGRATION_FILE" "$REMOTE_HOST:$REMOTE_TMP"

if ssh "$REMOTE_HOST" "docker exec -i $DB_CONTAINER psql -U postgres -d postgres < $REMOTE_TMP" 2>&1; then
    echo -e "${GREEN}Migration applied.${NC}"
else
    echo -e "${RED}Migration failed!${NC}"
    ssh "$REMOTE_HOST" "rm -f $REMOTE_TMP" >/dev/null 2>&1
    exit 1
fi

ssh "$REMOTE_HOST" "rm -f $REMOTE_TMP" >/dev/null 2>&1
```

### 3.7. `scripts/apply-all-migrations.sh`

Apply all migrations in lexicographic order. Skips initial schema dump by default.

```bash
#!/bin/bash
set -e

# === PROJECT CONFIG ===
MIGRATIONS_PATH="supabase/migrations"
INITIAL_SCHEMA_PATTERN="remote_schema"   # filename substring to skip by default
# ======================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

INCLUDE_INITIAL=false FROM_TIMESTAMP="" DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --include-initial) INCLUDE_INITIAL=true; shift ;;
        --from) FROM_TIMESTAMP="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

echo -e "${CYAN}=== Applying All Migrations ===${NC}"
SUCCEEDED=0 FAILED=0 SKIPPED=0

for MIGRATION_FILE in $(ls "$MIGRATIONS_PATH"/*.sql 2>/dev/null | sort); do
    MIGRATION_NAME=$(basename "$MIGRATION_FILE")

    if [ "$INCLUDE_INITIAL" = false ] && echo "$MIGRATION_NAME" | grep -q "$INITIAL_SCHEMA_PATTERN"; then
        echo -e "${CYAN}Skipping initial schema: $MIGRATION_NAME${NC}"
        SKIPPED=$((SKIPPED + 1)); continue
    fi

    if [ -n "$FROM_TIMESTAMP" ]; then
        MIGRATION_TS=$(echo "$MIGRATION_NAME" | grep -oE '^[0-9]+')
        if [[ "$MIGRATION_TS" < "$FROM_TIMESTAMP" ]]; then
            SKIPPED=$((SKIPPED + 1)); continue
        fi
    fi

    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] $MIGRATION_NAME${NC}"
        SUCCEEDED=$((SUCCEEDED + 1)); continue
    fi

    echo -e "${YELLOW}--- $MIGRATION_NAME ---${NC}"
    if "$SCRIPT_DIR/apply-migration.sh" "$MIGRATION_FILE"; then
        SUCCEEDED=$((SUCCEEDED + 1))
    else
        FAILED=$((FAILED + 1))
        read -p "Continue? (yes/no): " confirm
        [ "$confirm" != "yes" ] && echo "Aborted." && break
    fi
done

echo -e "${CYAN}=== Summary ===${NC}"
echo -e "${GREEN}Succeeded: $SUCCEEDED${NC} | Skipped: $SKIPPED"
[ "$FAILED" -gt 0 ] && echo -e "${RED}Failed: $FAILED${NC}"
```

### 3.8. `scripts/create-user.sh`

Create auth user via GoTrue admin API + insert into `public.users`.

```bash
#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@<YOUR_HOST>"
REMOTE_PATH="<YOUR_REMOTE_SUPABASE_PATH>"
DB_CONTAINER="<YOUR_DB_CONTAINER>"
# Env var names in .env on the server (check with: grep 'API_EXTERNAL\|SERVICE_ROLE' .env)
ENV_API_URL_KEY="API_EXTERNAL_URL"       # may differ per installation
ENV_SERVICE_ROLE_KEY="SERVICE_ROLE_KEY"   # may be SUPABASE_SERVICE_ROLE_KEY
# Public users table schema — adjust column names to match your schema
USERS_TABLE="public.users"
# ======================

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

EMAIL="" PASSWORD="" FULL_NAME="" ROLE="viewer"

while [[ $# -gt 0 ]]; do
    case $1 in
        --email) EMAIL="$2"; shift 2 ;;
        --password) PASSWORD="$2"; shift 2 ;;
        --name) FULL_NAME="$2"; shift 2 ;;
        --role) ROLE="$2"; shift 2 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo -e "${RED}Error: --email and --password are required${NC}"
    echo "Usage: $0 --email <email> --password <pass> [--name <name>] [--role <role>]"
    exit 1
fi

# Adjust valid roles to your project
VALID_ROLES="admin manager analyst viewer"
if ! echo "$VALID_ROLES" | grep -qw "$ROLE"; then
    echo -e "${RED}Error: Invalid role '$ROLE'. Must be one of: $VALID_ROLES${NC}"; exit 1
fi

echo -e "${CYAN}=== Creating User ===${NC}"
echo -e "Email: ${YELLOW}$EMAIL${NC}  Role: ${YELLOW}$ROLE${NC}"

KONG_URL=$(ssh "$REMOTE_HOST" "cd $REMOTE_PATH && grep -E '^${ENV_API_URL_KEY}=' .env | cut -d= -f2-" | tr -d '\r')
SERVICE_KEY=$(ssh "$REMOTE_HOST" "cd $REMOTE_PATH && grep -E '^${ENV_SERVICE_ROLE_KEY}=' .env | cut -d= -f2-" | tr -d '\r')

if [ -z "$KONG_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo -e "${RED}Error: Could not read $ENV_API_URL_KEY or $ENV_SERVICE_ROLE_KEY from .env${NC}"
    exit 1
fi

USER_META="{}"
[ -n "$FULL_NAME" ] && USER_META="{\"full_name\": \"$FULL_NAME\"}"

AUTH_RESPONSE=$(ssh "$REMOTE_HOST" "curl -s -X POST '$KONG_URL/auth/v1/admin/users' \
    -H 'apikey: $SERVICE_KEY' \
    -H 'Authorization: Bearer $SERVICE_KEY' \
    -H 'Content-Type: application/json' \
    -d '{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\",
        \"email_confirm\": true,
        \"user_metadata\": $USER_META
    }'" 2>/dev/null)

USER_ID=$(echo "$AUTH_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$USER_ID" ]; then
    echo -e "${RED}Error: Failed to create auth user${NC}"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi
echo -e "${GREEN}Auth user: $USER_ID${NC}"

ESCAPED_NAME=$(echo "$FULL_NAME" | sed "s/'/''/g")

# Adjust this INSERT to match YOUR users table schema
SQL="INSERT INTO $USERS_TABLE (id, email, password_hash, full_name, role, is_active)
VALUES ('$USER_ID', '$EMAIL', 'managed_by_auth', '$ESCAPED_NAME', '$ROLE', true)
ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id, full_name = EXCLUDED.full_name,
    role = EXCLUDED.role, updated_at = now();"

ssh "$REMOTE_HOST" "docker exec $DB_CONTAINER psql -U postgres -d postgres -c \"$SQL\""
echo -e "${GREEN}=== User created: $EMAIL ($ROLE) ===${NC}"
```

---

## Step 4: Make Scripts Executable

```bash
chmod +x scripts/supabase-status.sh
chmod +x scripts/supabase-logs.sh
chmod +x scripts/db-query.sh
chmod +x scripts/deploy-edge-function.sh
chmod +x scripts/deploy-all-functions.sh
chmod +x scripts/apply-migration.sh
chmod +x scripts/apply-all-migrations.sh
chmod +x scripts/create-user.sh
```

---

## Step 5: Configure Permissions (`.claude/settings.local.json`)

Claude Code asks for permission before running shell commands. To make `/supabase` commands work without prompts, add pre-approved permissions to `.claude/settings.local.json`.

If the file doesn't exist yet, create it:

```bash
mkdir -p .claude
```

Add (or merge into existing) the following JSON. Replace `<YOUR_HOST>` with your server address:

```json
{
  "permissions": {
    "allow": [
      "Bash(./scripts/supabase-status.sh:*)",
      "Bash(./scripts/supabase-logs.sh:*)",
      "Bash(./scripts/db-query.sh:*)",
      "Bash(./scripts/deploy-edge-function.sh:*)",
      "Bash(./scripts/deploy-all-functions.sh:*)",
      "Bash(./scripts/apply-migration.sh:*)",
      "Bash(./scripts/apply-all-migrations.sh:*)",
      "Bash(./scripts/create-user.sh:*)",
      "Bash(ssh:*)",
      "Bash(scp:*)",
      "Bash(rsync:*)",
      "Bash(chmod:*)",
      "mcp__ssh-mcp__exec",
      "mcp__ssh-mcp__sudo-exec"
    ]
  }
}
```

### What each permission does

| Permission | Why needed |
|------------|-----------|
| `Bash(./scripts/<name>.sh:*)` | Run the script with any arguments |
| `Bash(ssh:*)` | Scripts use `ssh` internally to run remote commands |
| `Bash(scp:*)` | Scripts use `scp` to upload files (migrations, functions) |
| `Bash(rsync:*)` | `deploy-edge-function.sh` uses rsync for multi-file functions |
| `Bash(chmod:*)` | Make scripts executable during initial setup |
| `mcp__ssh-mcp__exec` | Slash command uses SSH MCP for `restart` and `env` operations |
| `mcp__ssh-mcp__sudo-exec` | For operations requiring sudo on the server |

### Merging with existing settings

If `.claude/settings.local.json` already has a `permissions.allow` array, append the new entries to it. The file supports any number of entries. Example with pre-existing permissions:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run build:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",

      "Bash(./scripts/supabase-status.sh:*)",
      "Bash(./scripts/supabase-logs.sh:*)",
      "Bash(./scripts/db-query.sh:*)",
      "Bash(./scripts/deploy-edge-function.sh:*)",
      "Bash(./scripts/deploy-all-functions.sh:*)",
      "Bash(./scripts/apply-migration.sh:*)",
      "Bash(./scripts/apply-all-migrations.sh:*)",
      "Bash(./scripts/create-user.sh:*)",
      "Bash(ssh:*)",
      "Bash(scp:*)",
      "Bash(rsync:*)",
      "Bash(chmod:*)",
      "mcp__ssh-mcp__exec",
      "mcp__ssh-mcp__sudo-exec"
    ]
  }
}
```

### Permission format reference

- `Bash(<command>:*)` — allow any arguments after the command
- `Bash(<exact command>)` — allow only the exact command with no extra args
- `mcp__<server>__<tool>` — allow a specific MCP tool

### Security note

These permissions allow Claude Code to run SSH/SCP commands to **any host**. If you want to restrict to a specific server, use exact patterns:

```json
"Bash(ssh root@<YOUR_HOST>:*)",
"Bash(scp:*root@<YOUR_HOST>:*)"
```

However, this is usually unnecessary because the scripts already have the host hardcoded.

---

## Step 6: Create the Slash Command

Create `.claude/commands/supabase.md` — this is what Claude Code reads when a user types `/supabase <args>`.

The file should contain:

1. **Server context** — host, paths, container names, constraints
2. **Operation routing table** — maps user intent to the correct script
3. **Safety rules** — no file content via SSH MCP, warn on destructive SQL, mask secrets

Template:

```markdown
# Supabase Agent

You are managing a **self-hosted Supabase** at `<YOUR_HOST>`.

## Server Context

- **Host**: `root@<YOUR_HOST>`
- **Supabase root**: `<YOUR_REMOTE_SUPABASE_PATH>`
- **Functions path**: `<YOUR_REMOTE_FUNCTIONS_PATH>`
- **DB container**: `<YOUR_DB_CONTAINER>`

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
| `restart <svc>` | SSH: `docker-compose restart <svc>` |
| `query <SQL>` | `./scripts/db-query.sh "<SQL>"` |
| `migrate <file>` | `./scripts/apply-migration.sh <path>` |
| `migrate all` | `./scripts/apply-all-migrations.sh` |
| `create user` | `./scripts/create-user.sh --email ... --password ... --role ...` |
| `seed` | `./scripts/db-query.sh --file supabase/seed.sql` |
| `env` | SSH: `cat .env \| sed 's/=.*/=***/'` |

## Response Format

1. Name the operation
2. Show output (trim if long)
3. Report success/failure
4. Suggest next steps
```

---

## Step 7: Update CLAUDE.md

Add a section to your project's `CLAUDE.md` so that Claude Code (even without the slash command) knows about the scripts:

```markdown
## Supabase Agent (`/supabase`)

Slash command for managing the self-hosted Supabase instance.

### Usage

\`\`\`
/supabase deploy <function-name>
/supabase deploy all
/supabase status
/supabase logs <service> [lines]
/supabase restart <service>
/supabase query "SELECT ..."
/supabase migrate <file>
/supabase migrate all
/supabase create user
/supabase seed
/supabase env
\`\`\`

### Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/deploy-edge-function.sh` | Deploy single function (`--no-restart`, `--dry-run`) |
| `scripts/deploy-all-functions.sh` | Deploy all functions with single restart |
| `scripts/supabase-status.sh` | Docker services, disk, memory status |
| `scripts/supabase-logs.sh` | View service logs |
| `scripts/db-query.sh` | Execute SQL (inline or `--file`) |
| `scripts/apply-migration.sh` | Apply single migration |
| `scripts/apply-all-migrations.sh` | Apply all migrations (`--from`, `--include-initial`) |
| `scripts/create-user.sh` | Create auth + public user |
```

---

## Step 8: Verify

Run these in order to confirm everything works:

```bash
# 1. SSH connectivity + container discovery
./scripts/supabase-status.sh

# 2. Log retrieval
./scripts/supabase-logs.sh functions 10

# 3. Database access
./scripts/db-query.sh "SELECT current_database(), current_user"

# 4. Deploy dry-run
./scripts/deploy-edge-function.sh <any-function> --dry-run

# 5. Deploy all dry-run
./scripts/deploy-all-functions.sh --dry-run

# 6. Migration dry-run
./scripts/apply-all-migrations.sh --dry-run

# 7. User creation validation
./scripts/create-user.sh
# (should print usage error — no args)
```

---

## Adapting to Your Project

### Different users table schema

Edit `create-user.sh` — change the `SQL=` INSERT statement to match your table columns.

### Different file extensions

If your functions use `.js` instead of `.ts`, change `*.ts` to `*.js` in `deploy-edge-function.sh` (3 places: `find`, `--include`, `scp`).

### No edge functions

Remove `deploy-edge-function.sh`, `deploy-all-functions.sh`, and the corresponding rows from the slash command routing table.

### Multiple databases

Add a `--db <name>` flag to `db-query.sh` and `apply-migration.sh`, pass it to `psql -d <name>`.

### SSH via non-root user

Change `REMOTE_HOST="root@..."` to your user. Ensure the user has `docker` group membership or use `sudo docker-compose` (adjust all `ssh` commands accordingly).

### No SSH MCP tool

All scripts use local `ssh`/`scp` commands via Bash — they work without the SSH MCP tool. The MCP tool is only used for the `restart` operation in the slash command, which can be replaced with:

```bash
ssh root@<HOST> "cd <PATH> && docker-compose restart <service>"
```

---

## File Checklist

After setup, your project should have:

```
project/
├── .claude/
│   ├── commands/
│   │   └── supabase.md          # Slash command
│   └── settings.local.json      # Permissions (Step 5)
├── scripts/
│   ├── supabase-status.sh       # Server status
│   ├── supabase-logs.sh         # Service logs
│   ├── db-query.sh              # SQL execution
│   ├── deploy-edge-function.sh  # Single function deploy
│   ├── deploy-all-functions.sh  # Batch deploy
│   ├── apply-migration.sh       # Single migration
│   ├── apply-all-migrations.sh  # Batch migrations
│   └── create-user.sh           # User creation
├── supabase/
│   ├── functions/               # Edge functions
│   ├── migrations/              # SQL migrations
│   └── seed.sql                 # Seed data (optional)
└── CLAUDE.md                    # Updated with agent docs
```
