#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@31.129.98.96"
REMOTE_PATH="/root/supabase"
# ======================

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

echo -e "${CYAN}=== Supabase Server Status ===${NC}"
echo -e "${YELLOW}--- Docker Services ---${NC}"
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && docker compose ps"
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
