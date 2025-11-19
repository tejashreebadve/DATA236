#!/bin/bash

# Port-forward all RedNest services to localhost
# This allows the frontend (running on localhost:3000) to access Kubernetes services

echo "🔌 Starting port-forwarding for all services..."

# Kill any existing port-forwards on these ports
lsof -ti:3001,3002,3003,3004,3005,3006 | xargs kill -9 2>/dev/null || true

# Port-forward all services in background
kubectl port-forward svc/auth-service 3001:3001 -n rednest > /dev/null 2>&1 &
echo "✅ Auth service forwarded to localhost:3001"

kubectl port-forward svc/traveler-service 3002:3002 -n rednest > /dev/null 2>&1 &
echo "✅ Traveler service forwarded to localhost:3002"

kubectl port-forward svc/owner-service 3003:3003 -n rednest > /dev/null 2>&1 &
echo "✅ Owner service forwarded to localhost:3003"

kubectl port-forward svc/property-service 3004:3004 -n rednest > /dev/null 2>&1 &
echo "✅ Property service forwarded to localhost:3004"

kubectl port-forward svc/booking-service 3005:3005 -n rednest > /dev/null 2>&1 &
echo "✅ Booking service forwarded to localhost:3005"

kubectl port-forward svc/ai-agent-service 3006:3006 -n rednest > /dev/null 2>&1 &
echo "✅ AI Agent service forwarded to localhost:3006"

echo ""
echo "🎉 All services are now accessible on localhost!"
echo ""
echo "To stop port-forwarding, run:"
echo "  lsof -ti:3001,3002,3003,3004,3005,3006 | xargs kill -9"
echo ""
echo "Or use: ./k8s/stop-port-forward.sh"

