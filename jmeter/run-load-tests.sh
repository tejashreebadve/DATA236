#!/bin/bash

# RedNest Load Testing Script
# Tests for 100, 200, 300, 400, 500 concurrent users
# Generates graphs and analysis reports

set -e

# Configuration
HOST=${1:-localhost}
AUTH_PORT=${2:-3001}
PROPERTY_PORT=${3:-3004}
BOOKING_PORT=${4:-3005}
TEST_PLAN="rednest-comprehensive-test.jmx"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 RedNest Load Testing${NC}"
echo "Host: $HOST"
echo "Auth Port: $AUTH_PORT"
echo "Property Port: $PROPERTY_PORT"
echo "Booking Port: $BOOKING_PORT"
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}❌ JMeter is not installed.${NC}"
    echo "Install from: https://jmeter.apache.org/download_jmeter.cgi"
    exit 1
fi

# Check if test plan exists
if [ ! -f "$TEST_PLAN" ]; then
    echo -e "${RED}❌ Test plan not found: $TEST_PLAN${NC}"
    exit 1
fi

# Create results directory
mkdir -p results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to run test
run_test() {
    local users=$1
    local rampup=$2
    local test_name="${users}-users"
    
    echo -e "${YELLOW}📊 Running test: $test_name${NC}"
    echo "   Users: $users"
    echo "   Ramp-up: ${rampup}s"
    
    mkdir -p "results/$test_name"
    
    # Run JMeter test
    jmeter -n -t "$TEST_PLAN" \
        -Jhost="$HOST" \
        -Jauth_port="$AUTH_PORT" \
        -Jproperty_port="$PROPERTY_PORT" \
        -Jbooking_port="$BOOKING_PORT" \
        -Jusers="$users" \
        -Jrampup="$rampup" \
        -l "results/$test_name/results-${TIMESTAMP}.jtl" \
        -e -o "results/$test_name/report-${TIMESTAMP}/" \
        -j "results/$test_name/jmeter.log"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test completed: $test_name${NC}"
        echo "   Results: results/$test_name/results-${TIMESTAMP}.jtl"
        echo "   Report: results/$test_name/report-${TIMESTAMP}/"
    else
        echo -e "${RED}❌ Test failed: $test_name${NC}"
    fi
    echo ""
}

# Run all tests
echo -e "${GREEN}Starting load tests...${NC}"
echo ""

run_test 100 30
run_test 200 60
run_test 300 90
run_test 400 120
run_test 500 150

echo -e "${GREEN}🎉 All tests completed!${NC}"
echo ""
echo -e "${YELLOW}📈 Results Summary:${NC}"
echo "All results are in the 'results/' directory"
echo ""
echo "To view reports:"
echo "  - Open results/<user-count>/report-<timestamp>/index.html in a browser"
echo ""
echo "To generate analysis:"
echo "  ./generate-analysis.sh"

