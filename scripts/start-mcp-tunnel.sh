#!/bin/bash
# SSH tunnel script for Supabase MCP (run on local machine)

SERVER="31.129.98.96"
LOCAL_PORT="8080"
REMOTE_PORT="8000"
USER="root"

echo "Starting SSH tunnel for Supabase MCP..."
echo "Local: localhost:$LOCAL_PORT -> Remote: $SERVER:$REMOTE_PORT"
echo ""
echo "Press Ctrl+C to stop the tunnel"
echo ""

# Check if tunnel already exists
if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "WARNING: Port $LOCAL_PORT is already in use"
    echo ""
    read -p "Kill existing process and continue? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PID=$(lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t)
        kill -9 $PID
        sleep 1
    else
        echo "Aborted."
        exit 1
    fi
fi

# Start tunnel with auto-reconnect
while true; do
    echo "Connecting to $SERVER..."
    ssh -N -L localhost:$LOCAL_PORT:localhost:$REMOTE_PORT $USER@$SERVER

    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
        echo "Tunnel closed cleanly."
        break
    else
        echo "Tunnel closed with error code $EXIT_CODE"
        echo "Reconnecting in 5 seconds..."
        sleep 5
    fi
done
