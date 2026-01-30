#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@31.129.98.96"
REMOTE_SUPABASE_PATH="/root/supabase"
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
    ssh "$REMOTE_HOST" "cd $REMOTE_SUPABASE_PATH && docker compose restart functions"
    sleep 3
fi

echo -e "${CYAN}=== Summary: ${GREEN}$SUCCEEDED OK${NC}"
[ "$FAILED" -gt 0 ] && echo -e "${RED}Failed: $FAILED ($FAILED_NAMES)${NC}"
