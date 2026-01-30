#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@31.129.98.96"
DB_CONTAINER="supabase-db"
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
