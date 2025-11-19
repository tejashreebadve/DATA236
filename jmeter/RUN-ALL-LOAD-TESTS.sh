#!/bin/bash

# RedNest Load Testing Script
# Runs tests for 200, 300, 400, and 500 users sequentially

set -e  # Exit on error

cd "$(dirname "$0")"

echo "🚀 Starting RedNest Load Testing"
echo "=================================="
echo ""

# Test 200 Users
echo "📊 Testing 200 users..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
jmeter -n -t rednest-combined-test.jmx -Jusers=200 -Jrampup=60 \
  -l results/combined-200-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-200-users/report-${TIMESTAMP}/ \
  -j results/combined-200-users/jmeter-${TIMESTAMP}.log
echo "✅ 200-user test complete!"
open results/combined-200-users/report-${TIMESTAMP}/index.html
echo ""
read -p "Press Enter to continue to 300-user test..."

# Test 300 Users
echo "📊 Testing 300 users..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
jmeter -n -t rednest-combined-test.jmx -Jusers=300 -Jrampup=90 \
  -l results/combined-300-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-300-users/report-${TIMESTAMP}/ \
  -j results/combined-300-users/jmeter-${TIMESTAMP}.log
echo "✅ 300-user test complete!"
open results/combined-300-users/report-${TIMESTAMP}/index.html
echo ""
read -p "Press Enter to continue to 400-user test..."

# Test 400 Users
echo "📊 Testing 400 users..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
jmeter -n -t rednest-combined-test.jmx -Jusers=400 -Jrampup=120 \
  -l results/combined-400-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-400-users/report-${TIMESTAMP}/ \
  -j results/combined-400-users/jmeter-${TIMESTAMP}.log
echo "✅ 400-user test complete!"
open results/combined-400-users/report-${TIMESTAMP}/index.html
echo ""
read -p "Press Enter to continue to 500-user test..."

# Test 500 Users
echo "📊 Testing 500 users..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
jmeter -n -t rednest-combined-test.jmx -Jusers=500 -Jrampup=150 \
  -l results/combined-500-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-500-users/report-${TIMESTAMP}/ \
  -j results/combined-500-users/jmeter-${TIMESTAMP}.log
echo "✅ 500-user test complete!"
open results/combined-500-users/report-${TIMESTAMP}/index.html

echo ""
echo "🎉 All load tests completed!"
echo "=================================="

