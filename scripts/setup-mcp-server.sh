#!/bin/bash
# Setup script for Supabase MCP server (run on remote server)
# This script should be run on the Supabase server: 31.129.98.96

set -e

echo "======================================"
echo "Supabase MCP Server Setup"
echo "======================================"
echo ""

# Step 1: Find Docker bridge gateway IP
echo "Step 1: Finding Docker bridge gateway IP..."
GATEWAY_IP=$(docker inspect supabase-kong --format '{{range .NetworkSettings.Networks}}{{println .Gateway}}{{end}}' | head -n 1 | tr -d '\n')

if [ -z "$GATEWAY_IP" ]; then
    echo "ERROR: Could not find Docker bridge gateway IP"
    echo "Make sure supabase-kong container is running"
    exit 1
fi

echo "Docker bridge gateway IP: $GATEWAY_IP"
echo ""

# Step 2: Find kong.yml file
echo "Step 2: Finding kong.yml file..."
KONG_CONFIG=$(find /opt/supabase -name "kong.yml" 2>/dev/null | head -n 1)

if [ -z "$KONG_CONFIG" ]; then
    KONG_CONFIG=$(find ~ -name "kong.yml" 2>/dev/null | head -n 1)
fi

if [ -z "$KONG_CONFIG" ]; then
    KONG_CONFIG=$(find . -path "*/volumes/api/kong.yml" 2>/dev/null | head -n 1)
fi

if [ -z "$KONG_CONFIG" ]; then
    echo "ERROR: Could not find kong.yml file"
    echo "Please locate the file manually and edit it"
    exit 1
fi

echo "Kong config found: $KONG_CONFIG"
echo ""

# Step 3: Backup original config
echo "Step 3: Creating backup..."
BACKUP_FILE="${KONG_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$KONG_CONFIG" "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"
echo ""

# Step 4: Check if MCP section exists
echo "Step 4: Checking MCP configuration..."
if ! grep -q "## MCP endpoint" "$KONG_CONFIG"; then
    echo "ERROR: MCP endpoint section not found in kong.yml"
    echo "Your kong.yml might be outdated. Please update it manually."
    exit 1
fi

# Step 5: Update configuration
echo "Step 5: Updating Kong configuration..."
echo "This will:"
echo "  - Comment out request-termination plugin"
echo "  - Enable ip-restriction plugin"
echo "  - Add $GATEWAY_IP to allowed IPs"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create temporary file with updated config
TMP_FILE=$(mktemp)

# Use awk to update the configuration
awk -v gateway_ip="$GATEWAY_IP" '
BEGIN { in_mcp_section = 0; in_plugins = 0; }

# Detect MCP section start
/## MCP endpoint/ { in_mcp_section = 1; }

# Detect plugins section in MCP
/^  plugins:/ && in_mcp_section { in_plugins = 1; }

# Exit MCP section when we hit another top-level route
/^- name:/ && in_mcp_section && !/^  / { in_mcp_section = 0; in_plugins = 0; }

# Comment out request-termination if in MCP plugins section
/    - name: request-termination/ && in_plugins && in_mcp_section {
    print "    #- name: request-termination"
    in_term = 1
    next
}

# Comment out request-termination config lines
in_term && /^      / && in_plugins {
    print "#" $0
    next
}

/^    - name:/ && in_term { in_term = 0; }

# Add cors and ip-restriction after commented request-termination
/^    - name:/ && !in_term && in_plugins && in_mcp_section && !added_restriction {
    if (!/cors/ && !/ip-restriction/) {
        print "    - name: cors"
        print "    - name: ip-restriction"
        print "      config:"
        print "        allow:"
        print "          - 127.0.0.1"
        print "          - ::1"
        print "          - " gateway_ip
        print "        deny: []"
        added_restriction = 1
    }
}

# Print all other lines as-is
{ print }
' "$KONG_CONFIG" > "$TMP_FILE"

# Replace original config
mv "$TMP_FILE" "$KONG_CONFIG"

echo "Configuration updated successfully!"
echo ""

# Step 6: Restart Kong
echo "Step 6: Restarting Kong container..."
COMPOSE_DIR=$(dirname "$KONG_CONFIG" | sed 's|/volumes/api||')
cd "$COMPOSE_DIR"

docker compose restart kong
echo "Kong restarted."
echo ""

# Step 7: Check logs
echo "Step 7: Checking Kong logs..."
docker compose logs kong --tail 20
echo ""

echo "======================================"
echo "Setup complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. On your local machine, create SSH tunnel:"
echo "   ssh -N -L localhost:8080:localhost:8000 root@31.129.98.96"
echo ""
echo "2. Test MCP endpoint from local machine:"
echo "   curl http://localhost:8080/mcp -X POST -H 'Content-Type: application/json' \\"
echo "     -H 'MCP-Protocol-Version: 2025-06-18' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\"}'"
echo ""
echo "3. Configure Claude Code (see docs/supabase-mcp-setup.md)"
echo ""
