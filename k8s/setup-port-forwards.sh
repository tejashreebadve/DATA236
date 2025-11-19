#!/bin/bash

# Setup port-forwards for RedNest services
# This allows frontend to access Kubernetes services

echo "🔌 Setting up port-forwards..."

# Kill any existing port-forwards
echo "Cleaning up existing port-forwards..."
lsof -ti:3001,3002,3003,3004,3005,3006 | xargs kill -9 2>/dev/null || true
sleep 1

# Start port-forwards
echo "Starting port-forwards..."
kubectl port-forward svc/auth-service 3001:3001 -n rednest --address=127.0.0.1 > /tmp/auth-pf.log 2>&1 &
PF1=$!
echo "✅ Auth service: localhost:3001 (PID: $PF1)"

kubectl port-forward svc/traveler-service 3002:3002 -n rednest --address=127.0.0.1 > /tmp/traveler-pf.log 2>&1 &
PF2=$!
echo "✅ Traveler service: localhost:3002 (PID: $PF2)"

kubectl port-forward svc/owner-service 3003:3003 -n rednest --address=127.0.0.1 > /tmp/owner-pf.log 2>&1 &
PF3=$!
echo "✅ Owner service: localhost:3003 (PID: $PF3)"

kubectl port-forward svc/property-service 3004:3004 -n rednest --address=127.0.0.1 > /tmp/property-pf.log 2>&1 &
PF4=$!
echo "✅ Property service: localhost:3004 (PID: $PF4)"

kubectl port-forward svc/booking-service 3005:3005 -n rednest --address=127.0.0.1 > /tmp/booking-pf.log 2>&1 &
PF5=$!
echo "✅ Booking service: localhost:3005 (PID: $PF5)"

kubectl port-forward svc/ai-agent-service 3006:3006 -n rednest --address=127.0.0.1 > /tmp/ai-pf.log 2>&1 &
PF6=$!
echo "✅ AI Agent service: localhost:3006 (PID: $PF6)"

sleep 3

# Test connections
echo ""
echo "🧪 Testing connections..."
FAILED=0

if curl -s http://127.0.0.1:3001/health > /dev/null 2>&1; then
    echo "✅ Auth service (3001): OK"
else
    echo "❌ Auth service (3001): FAILED"
    FAILED=1
fi

if curl -s http://127.0.0.1:3004/api/property > /dev/null 2>&1; then
    echo "✅ Property service (3004): OK"
else
    echo "❌ Property service (3004): FAILED"
    FAILED=1
fi

if curl -s http://127.0.0.1:3002/health > /dev/null 2>&1; then
    echo "✅ Traveler service (3002): OK"
else
    echo "❌ Traveler service (3002): FAILED"
    FAILED=1
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo "🎉 All services are accessible!"
    echo ""
    echo "Frontend should now be able to connect to backend services."
    echo "Refresh your browser at http://localhost:3000"
else
    echo "⚠️  Some services failed. Check logs:"
    echo "   tail -f /tmp/*-pf.log"
fi

echo ""
echo "To stop port-forwards: ./k8s/stop-port-forward.sh"

