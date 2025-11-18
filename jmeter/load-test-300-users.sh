#!/bin/bash

# Load Test Script - 300 Concurrent Users
HOST=${1:-localhost}
AUTH_PORT=${2:-3001}
PROPERTY_PORT=${3:-3004}
BOOKING_PORT=${4:-3005}

echo "🚀 Starting Load Test - 300 Concurrent Users"
mkdir -p results/300-users
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

jmeter -n -t auth-test-plan.jmx -Jhost=$HOST -Jport=$AUTH_PORT -Jusers=300 -Jrampup=90 \
  -l results/300-users/auth-${TIMESTAMP}.jtl -e -o results/300-users/auth-report-${TIMESTAMP}/

jmeter -n -t property-test-plan.jmx -Jhost=$HOST -Jport=$PROPERTY_PORT -Jusers=300 -Jrampup=90 \
  -l results/300-users/property-${TIMESTAMP}.jtl -e -o results/300-users/property-report-${TIMESTAMP}/

jmeter -n -t booking-test-plan.jmx -Jhost=$HOST -Jport=$BOOKING_PORT -Jusers=300 -Jrampup=90 \
  -l results/300-users/booking-${TIMESTAMP}.jtl -e -o results/300-users/booking-report-${TIMESTAMP}/

echo "✅ Complete! Results in results/300-users/"

