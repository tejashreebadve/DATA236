#!/bin/bash

# RedNest Combined Load Testing Script
# Runs combined test (Auth + Property + Booking) for 100, 200, 300, 400, 500 users
# Each test generates its own HTML report
# Then generates combined graphs comparing all user counts

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

echo -e "${BLUE}🚀 RedNest Combined Load Testing${NC}"
echo "Host: $HOST"
echo "Auth Port: $AUTH_PORT"
echo "Property Port: $PROPERTY_PORT"
echo "Booking Port: $BOOKING_PORT"
echo ""
echo -e "${YELLOW}📊 Note: Each test will generate its OWN HTML report${NC}"
echo "   You can view each report separately to see stats for that user count"
echo "   Or use generate-graphs.sh to create combined comparison graphs"
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}❌ JMeter is not installed.${NC}"
    exit 1
fi

# Check if test plan exists
TEST_PLAN="rednest-combined-test.jmx"
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
    local test_name="combined-${users}-users"
    
    echo -e "${YELLOW}📊 Running test: $test_name${NC}"
    echo "   Users: $users"
    echo "   Ramp-up: ${rampup}s"
    echo "   This will generate: results/$test_name/report-*/index.html"
    echo ""
    
    mkdir -p "results/$test_name"
    
    # Remove existing report folder if it exists (JMeter requires empty folder)
    rm -rf "results/$test_name/report-${TIMESTAMP}"
    
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
        -j "results/$test_name/jmeter.log" 2>&1 | grep -E "summary|Error|Tidying" | tail -3
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test completed: $test_name${NC}"
        echo "   📊 HTML Report: results/$test_name/report-${TIMESTAMP}/index.html"
        echo "   📈 Raw Data: results/$test_name/results-${TIMESTAMP}.jtl"
        echo ""
    else
        echo -e "${RED}❌ Test failed: $test_name${NC}"
        echo ""
    fi
}

# User counts and ramp-up times
declare -A rampup_times
rampup_times[100]=30
rampup_times[200]=60
rampup_times[300]=90
rampup_times[400]=120
rampup_times[500]=150

echo -e "${GREEN}Starting combined load tests...${NC}"
echo ""

# Run all tests
run_test 100 ${rampup_times[100]}
run_test 200 ${rampup_times[200]}
run_test 300 ${rampup_times[300]}
run_test 400 ${rampup_times[400]}
run_test 500 ${rampup_times[500]}

echo -e "${GREEN}🎉 All tests completed!${NC}"
echo ""
echo -e "${YELLOW}📈 Results Summary:${NC}"
echo ""
echo "Each test generated its own HTML report:"
echo "  📊 100 users: results/combined-100-users/report-${TIMESTAMP}/index.html"
echo "  📊 200 users: results/combined-200-users/report-${TIMESTAMP}/index.html"
echo "  📊 300 users: results/combined-300-users/report-${TIMESTAMP}/index.html"
echo "  📊 400 users: results/combined-400-users/report-${TIMESTAMP}/index.html"
echo "  📊 500 users: results/combined-500-users/report-${TIMESTAMP}/index.html"
echo ""
echo -e "${BLUE}📊 To View Results:${NC}"
echo "  1. Open each HTML report in a browser to see stats for that user count"
echo "  2. Each report shows: Response times, Throughput, Error rates, Graphs"
echo ""
echo -e "${BLUE}📈 To Generate Combined Comparison Graphs:${NC}"
echo "  ./generate-graphs-combined.sh"
echo ""
echo "This will create graphs comparing all user counts together!"

