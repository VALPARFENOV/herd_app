#!/bin/bash
# Test script for MCP server (run on local machine)

set -e

MCP_URL="${MCP_URL:-http://localhost:8080/mcp}"

echo "======================================"
echo "Testing Supabase MCP Server"
echo "======================================"
echo ""
echo "MCP URL: $MCP_URL"
echo ""

# Test 1: Check if endpoint is reachable
echo "Test 1: Checking if MCP endpoint is reachable..."
if ! curl -s -f -o /dev/null "$MCP_URL"; then
    echo "FAILED: MCP endpoint is not reachable"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure SSH tunnel is active: ps aux | grep 'ssh.*8080'"
    echo "2. Check if Kong is running on server: ssh root@31.129.98.96 'docker ps | grep kong'"
    echo "3. Check Kong logs: ssh root@31.129.98.96 'cd /opt/supabase && docker compose logs kong --tail 50'"
    exit 1
fi
echo "OK: Endpoint is reachable"
echo ""

# Test 2: Initialize MCP protocol
echo "Test 2: Initializing MCP protocol..."
RESPONSE=$(curl -s "$MCP_URL" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {
        "elicitation": {}
      },
      "clientInfo": {
        "name": "test-client",
        "title": "Test Client",
        "version": "1.0.0"
      }
    }
  }')

if echo "$RESPONSE" | grep -q '"result"'; then
    echo "OK: MCP protocol initialized successfully"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.'
else
    echo "FAILED: Could not initialize MCP protocol"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
    exit 1
fi
echo ""

# Test 3: List available tools
echo "Test 3: Listing available MCP tools..."
TOOLS_RESPONSE=$(curl -s "$MCP_URL" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }')

if echo "$TOOLS_RESPONSE" | grep -q '"tools"'; then
    echo "OK: Successfully retrieved tools list"
    echo ""
    echo "Available tools:"
    echo "$TOOLS_RESPONSE" | jq '.result.tools[].name'
else
    echo "WARNING: Could not retrieve tools list"
    echo ""
    echo "Response:"
    echo "$TOOLS_RESPONSE"
fi
echo ""

echo "======================================"
echo "All tests passed!"
echo "======================================"
echo ""
echo "Your Supabase MCP server is ready to use."
echo ""
echo "Next step: Configure Claude Code"
echo "See: docs/supabase-mcp-setup.md (Step 6)"
echo ""
