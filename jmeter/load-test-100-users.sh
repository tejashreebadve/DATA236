#!/bin/bash

# Load Test Script - 100 Concurrent Users
# Tests RedNest services with 100 concurrent users

HOST=${1:-localhost}
AUTH_PORT=${2:-3001}
PROPERTY_PORT=${3:-3004}
BOOKING_PORT=${4:-3005}

echo "🚀 Starting Load Test - 100 Concurrent Users"
echo "Host: $HOST"
echo "Auth Port: $AUTH_PORT"
echo "Property Port: $PROPERTY_PORT"
echo "Booking Port: $BOOKING_PORT"
echo ""

# Create results directory
mkdir -p results/100-users
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📊 Running Authentication Test..."
jmeter -n -t auth-test-plan.jmx \
  -Jhost=$HOST \
  -Jport=$AUTH_PORT \
  -Jusers=100 \
  -Jrampup=30 \
  -l results/100-users/auth-${TIMESTAMP}.jtl \
  -e -o results/100-users/auth-report-${TIMESTAMP}/

echo ""
echo "📊 Running Property Search Test..."
jmeter -n -t property-test-plan.jmx \
  -Jhost=$HOST \
  -Jport=$PROPERTY_PORT \
  -Jusers=100 \
  -Jrampup=30 \
  -l results/100-users/property-${TIMESTAMP}.jtl \
  -e -o results/100-users/property-report-${TIMESTAMP}/

echo ""
echo "📊 Running Booking Flow Test..."
jmeter -n -t booking-test-plan.jmx \
  -Jhost=$HOST \
  -Jport=$BOOKING_PORT \
  -Jusers=100 \
  -Jrampup=30 \
  -l results/100-users/booking-${TIMESTAMP}.jtl \
  -e -o results/100-users/booking-report-${TIMESTAMP}/

echo ""
echo "✅ Load test complete! Results saved in results/100-users/"
echo "📈 View HTML reports in:"
echo "   - results/100-users/auth-report-${TIMESTAMP}/"
echo "   - results/100-users/property-report-${TIMESTAMP}/"
echo "   - results/100-users/booking-report-${TIMESTAMP}/"

