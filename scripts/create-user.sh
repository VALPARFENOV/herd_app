#!/bin/bash
set -e

# === PROJECT CONFIG ===
REMOTE_HOST="root@31.129.98.96"
REMOTE_PATH="/root/supabase"
DB_CONTAINER="supabase-db"
ENV_API_URL_KEY="API_EXTERNAL_URL"
ENV_SERVICE_ROLE_KEY="SERVICE_ROLE_KEY"
PROFILES_TABLE="public.profiles"
# ======================

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' CYAN='\033[0;36m' NC='\033[0m'

EMAIL="" PASSWORD="" FULL_NAME="" ROLE="viewer" TENANT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --email) EMAIL="$2"; shift 2 ;;
        --password) PASSWORD="$2"; shift 2 ;;
        --name) FULL_NAME="$2"; shift 2 ;;
        --role) ROLE="$2"; shift 2 ;;
        --tenant) TENANT="$2"; shift 2 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$TENANT" ]; then
    echo -e "${RED}Error: --email, --password, and --tenant are required${NC}"
    echo "Usage: $0 --email <email> --password <pass> --tenant <uuid> [--name <name>] [--role <role>]"
    echo ""
    echo "Roles: owner manager veterinarian zootechnician accountant worker viewer"
    exit 1
fi

VALID_ROLES="owner manager veterinarian zootechnician accountant worker viewer"
if ! echo "$VALID_ROLES" | grep -qw "$ROLE"; then
    echo -e "${RED}Error: Invalid role '$ROLE'. Must be one of: $VALID_ROLES${NC}"; exit 1
fi

echo -e "${CYAN}=== Creating User ===${NC}"
echo -e "Email: ${YELLOW}$EMAIL${NC}  Role: ${YELLOW}$ROLE${NC}  Tenant: ${YELLOW}$TENANT${NC}"

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

SQL="INSERT INTO $PROFILES_TABLE (id, tenant_id, full_name, role, is_active)
VALUES ('$USER_ID', '$TENANT', '$ESCAPED_NAME', '$ROLE', true)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role, updated_at = now();"

ssh "$REMOTE_HOST" "docker exec $DB_CONTAINER psql -U postgres -d postgres -c \"$SQL\""
echo -e "${GREEN}=== User created: $EMAIL ($ROLE) ===${NC}"
