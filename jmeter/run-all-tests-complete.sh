#!/bin/bash

# RedNest Complete Load Testing Script
# Runs tests for Property, Auth, and Booking APIs
# Tests for 100, 200, 300, 400, 500 concurrent users

set -e

# Configuration
HOST=${1:-localhost}
AUTH_PORT=${2:-3001}
PROPERTY_PORT=${3:-3004}
BOOKING_PORT=${4:-3005}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 RedNest Complete Load Testing${NC}"
echo "Host: $HOST"
echo "Auth Port: $AUTH_PORT"
echo "Property Port: $PROPERTY_PORT"
echo "Booking Port: $BOOKING_PORT"
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}❌ JMeter is not installed.${NC}"
    exit 1
fi

# Create results directory
mkdir -p results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to run test
run_test() {
    local test_plan=$1
    local test_name=$2
    local users=$3
    local rampup=$4
    
    echo -e "${YELLOW}📊 Running: $test_name - $users users${NC}"
    
    mkdir -p "results/$test_name/$users-users"
    
    # Run JMeter test
    jmeter -n -t "$test_plan" \
        -Jhost="$HOST" \
        -Jauth_port="$AUTH_PORT" \
        -Jproperty_port="$PROPERTY_PORT" \
        -Jbooking_port="$BOOKING_PORT" \
        -Jusers="$users" \
        -Jrampup="$rampup" \
        -l "results/$test_name/$users-users/results-${TIMESTAMP}.jtl" \
        -e -o "results/$test_name/$users-users/report-${TIMESTAMP}/" \
        -j "results/$test_name/$users-users/jmeter.log" 2>&1 | grep -E "summary|Error|Tidying" | tail -3
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Completed: $test_name - $users users${NC}"
    else
        echo -e "${RED}❌ Failed: $test_name - $users users${NC}"
    fi
    echo ""
}

# Test plans
PROPERTY_TEST="rednest-load-test.jmx"
AUTH_TEST="rednest-auth-test.jmx"
BOOKING_TEST="rednest-booking-test.jmx"

# User counts and ramp-up times
declare -A rampup_times
rampup_times[100]=30
rampup_times[200]=60
rampup_times[300]=90
rampup_times[400]=120
rampup_times[500]=150

echo -e "${GREEN}Starting complete test suite...${NC}"
echo ""

# Run Property Search Tests
echo -e "${BLUE}=== PROPERTY SEARCH TESTS ===${NC}"
for users in 100 200 300 400 500; do
    run_test "$PROPERTY_TEST" "property" "$users" "${rampup_times[$users]}"
done

# Run Auth Tests
echo -e "${BLUE}=== AUTHENTICATION TESTS ===${NC}"
for users in 100 200 300 400 500; do
    run_test "$AUTH_TEST" "auth" "$users" "${rampup_times[$users]}"
done

# Run Booking Tests
echo -e "${BLUE}=== BOOKING TESTS ===${NC}"
for users in 100 200 300 400 500; do
    run_test "$BOOKING_TEST" "booking" "$users" "${rampup_times[$users]}"
done

echo -e "${GREEN}🎉 All tests completed!${NC}"
echo ""
echo -e "${YELLOW}📈 Results Summary:${NC}"
echo "All results are in the 'results/' directory:"
echo "  - results/property/<user-count>/report-*/index.html"
echo "  - results/auth/<user-count>/report-*/index.html"
echo "  - results/booking/<user-count>/report-*/index.html"
echo ""
echo "To generate combined graphs:"
echo "  ./generate-graphs-complete.sh"

