#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@31.129.98.96"
DB_CONTAINER="supabase-db"
MIGRATIONS_PATH="packages/database/schema"
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
