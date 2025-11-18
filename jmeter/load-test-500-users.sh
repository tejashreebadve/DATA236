#!/bin/bash

# Load Test Script - 500 Concurrent Users
HOST=${1:-localhost}
AUTH_PORT=${2:-3001}
PROPERTY_PORT=${3:-3004}
BOOKING_PORT=${4:-3005}

echo "🚀 Starting Load Test - 500 Concurrent Users"
mkdir -p results/500-users
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

jmeter -n -t auth-test-plan.jmx -Jhost=$HOST -Jport=$AUTH_PORT -Jusers=500 -Jrampup=150 \
  -l results/500-users/auth-${TIMESTAMP}.jtl -e -o results/500-users/auth-report-${TIMESTAMP}/

jmeter -n -t property-test-plan.jmx -Jhost=$HOST -Jport=$PROPERTY_PORT -Jusers=500 -Jrampup=150 \
  -l results/500-users/property-${TIMESTAMP}.jtl -e -o results/500-users/property-report-${TIMESTAMP}/

jmeter -n -t booking-test-plan.jmx -Jhost=$HOST -Jport=$BOOKING_PORT -Jusers=500 -Jrampup=150 \
  -l results/500-users/booking-${TIMESTAMP}.jtl -e -o results/500-users/booking-report-${TIMESTAMP}/

echo "✅ Complete! Results in results/500-users/"

