#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@31.129.98.96"
REMOTE_PATH="/root/supabase"
VALID_SERVICES="functions auth rest realtime db kong meta storage mcp-server"
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
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && docker compose logs --tail=$LINES $SERVICE"
echo -e "${GREEN}Log fetch complete.${NC}"
