#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login/traveler \
  -H "Content-Type: application/json" \
  -d '{"email":"loadtestuser@test.com","password":"password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "NOT_FOUND" ]; then
  echo "❌ Token extraction failed"
  exit 1
fi

echo "✅ Token extracted: ${TOKEN:0:30}..."
echo "Testing booking with token..."
PROPERTY_ID=$(curl -s http://localhost:3004/api/property/search | python3 -c "import sys, json; d=json.load(sys.stdin); print(d[0]['_id'] if d else '')" 2>/dev/null)
RESULT=$(curl -s -X POST http://localhost:3005/api/booking \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"propertyId\":\"$PROPERTY_ID\",\"startDate\":\"2025-11-25T00:00:00.000Z\",\"endDate\":\"2025-11-28T00:00:00.000Z\",\"guests\":2,\"totalPrice\":500}")

if echo "$RESULT" | python3 -c "import sys, json; d=json.load(sys.stdin); exit(0 if d.get('_id') else 1)" 2>/dev/null; then
  echo "✅ Booking works with manual token!"
else
  echo "❌ Booking failed even with manual token"
  echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
fi
