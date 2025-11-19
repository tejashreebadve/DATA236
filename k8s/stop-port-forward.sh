#!/bin/bash

# Stop all port-forwarding processes

echo "🛑 Stopping all port-forwards..."

lsof -ti:3001,3002,3003,3004,3005,3006 | xargs kill -9 2>/dev/null && echo "✅ All port-forwards stopped" || echo "⚠️  No port-forwards found"

