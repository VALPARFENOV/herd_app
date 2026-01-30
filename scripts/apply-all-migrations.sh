#!/bin/bash
set -e

# === PROJECT CONFIG ===
MIGRATIONS_PATH="packages/database/schema"
INITIAL_SCHEMA_PATTERN="001_core_tables"
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
