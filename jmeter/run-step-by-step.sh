#!/bin/bash

# Step-by-Step Load Testing Script
# Runs tests one by one, opens HTML after each

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Step-by-Step Load Testing${NC}"
echo ""

# Function to run test and open HTML
run_and_view() {
    local users=$1
    local rampup=$2
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local dir="results/combined-${users}-users"
    
    echo -e "${YELLOW}📊 Testing with ${users} users...${NC}"
    echo "   Using timestamp: $timestamp"
    
    mkdir -p "$dir"
    
    # Use timestamped files/folders (avoids conflicts)
    jmeter -n -t rednest-combined-test.jmx \
        -Jusers=$users \
        -Jrampup=$rampup \
        -l "$dir/results-${timestamp}.jtl" \
        -e -o "$dir/report-${timestamp}/" \
        -j "$dir/jmeter-${timestamp}.log" 2>&1 | tail -3
    
    echo -e "${GREEN}✅ Test completed! Opening HTML report...${NC}"
    open "$dir/report-${timestamp}/index.html" 2>/dev/null || \
        xdg-open "$dir/report-${timestamp}/index.html" 2>/dev/null || \
        echo "   📊 Report: $dir/report-${timestamp}/index.html"
    
    echo ""
    read -p "Press Enter to continue to next test..."
    echo ""
}

# Run tests
run_and_view 100 30
run_and_view 200 60
run_and_view 300 90
run_and_view 400 120
run_and_view 500 150

echo -e "${GREEN}🎉 All tests completed!${NC}"
echo ""
echo -e "${BLUE}📈 Generating combined comparison graphs...${NC}"
./generate-graphs-combined.sh

echo ""
echo -e "${GREEN}✅ Done! Check graphs/ directory for comparison graphs${NC}"
