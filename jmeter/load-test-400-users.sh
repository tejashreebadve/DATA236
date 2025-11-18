#!/bin/bash

# Load Test Script - 400 Concurrent Users
HOST=${1:-localhost}
AUTH_PORT=${2:-3001}
PROPERTY_PORT=${3:-3004}
BOOKING_PORT=${4:-3005}

echo "🚀 Starting Load Test - 400 Concurrent Users"
mkdir -p results/400-users
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

jmeter -n -t auth-test-plan.jmx -Jhost=$HOST -Jport=$AUTH_PORT -Jusers=400 -Jrampup=120 \
  -l results/400-users/auth-${TIMESTAMP}.jtl -e -o results/400-users/auth-report-${TIMESTAMP}/

jmeter -n -t property-test-plan.jmx -Jhost=$HOST -Jport=$PROPERTY_PORT -Jusers=400 -Jrampup=120 \
  -l results/400-users/property-${TIMESTAMP}.jtl -e -o results/400-users/property-report-${TIMESTAMP}/

jmeter -n -t booking-test-plan.jmx -Jhost=$HOST -Jport=$BOOKING_PORT -Jusers=400 -Jrampup=120 \
  -l results/400-users/booking-${TIMESTAMP}.jtl -e -o results/400-users/booking-report-${TIMESTAMP}/

echo "✅ Complete! Results in results/400-users/"

