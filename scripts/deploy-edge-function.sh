#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@31.129.98.96"
REMOTE_FUNCTIONS_PATH="/root/supabase/volumes/functions"
REMOTE_SUPABASE_PATH="/root/supabase"
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
    ssh "$REMOTE_HOST" "cd $REMOTE_SUPABASE_PATH && docker compose restart functions"
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
