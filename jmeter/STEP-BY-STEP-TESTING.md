# Step-by-Step Load Testing Guide

## Overview
This guide walks you through running load tests for 100, 200, 300, 400, and 500 users, viewing HTML reports after each test, and finally generating combined comparison graphs.

---

## Step 1: Test with 100 Users

```bash
cd jmeter

# Create timestamped folder (avoids conflicts)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Run test for 100 users
jmeter -n -t rednest-combined-test.jmx \
  -Jusers=100 \
  -Jrampup=30 \
  -l results/combined-100-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-100-users/report-${TIMESTAMP}/ \
  -j results/combined-100-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-100-users/report-${TIMESTAMP}/index.html
# OR on Linux: xdg-open results/combined-100-users/report-${TIMESTAMP}/index.html
```

**What to check in the HTML report:**
- Response times for Login, Property Search, Booking
- Success rate (should be 100% or close)
- Throughput (requests per second)
- Error rate

---

## Step 2: Test with 200 Users

```bash
# Create timestamped folder
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Run test for 200 users
jmeter -n -t rednest-combined-test.jmx \
  -Jusers=200 \
  -Jrampup=60 \
  -l results/combined-200-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-200-users/report-${TIMESTAMP}/ \
  -j results/combined-200-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-200-users/report-${TIMESTAMP}/index.html
```

**Compare with 100 users:**
- Did response times increase?
- Is throughput higher or lower?
- Any errors appearing?

---

## Step 3: Test with 300 Users

```bash
# Create timestamped folder
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Run test for 300 users
jmeter -n -t rednest-combined-test.jmx \
  -Jusers=300 \
  -Jrampup=90 \
  -l results/combined-300-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-300-users/report-${TIMESTAMP}/ \
  -j results/combined-300-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-300-users/report-${TIMESTAMP}/index.html
```

---

## Step 4: Test with 400 Users

```bash
# Create timestamped folder
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Run test for 400 users
jmeter -n -t rednest-combined-test.jmx \
  -Jusers=400 \
  -Jrampup=120 \
  -l results/combined-400-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-400-users/report-${TIMESTAMP}/ \
  -j results/combined-400-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-400-users/report-${TIMESTAMP}/index.html
```

---

## Step 5: Test with 500 Users

```bash
# Create timestamped folder
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Run test for 500 users
jmeter -n -t rednest-combined-test.jmx \
  -Jusers=500 \
  -Jrampup=150 \
  -l results/combined-500-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-500-users/report-${TIMESTAMP}/ \
  -j results/combined-500-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-500-users/report-${TIMESTAMP}/index.html
```

---

## Step 6: Generate Combined Comparison Graphs

After all tests are complete, generate graphs that compare all user counts:

```bash
# Generate combined comparison graphs
./generate-graphs-combined.sh
```

**This creates 3 PNG graphs in the `graphs/` directory:**
1. `combined-response-time-all-apis.png` - Response time trends across 100-500 users
2. `combined-throughput-all-apis.png` - Throughput comparison
3. `combined-success-rate-all-apis.png` - Success rate comparison

**View the graphs:**
```bash
open graphs/combined-response-time-all-apis.png
open graphs/combined-throughput-all-apis.png
open graphs/combined-success-rate-all-apis.png
```

---

## Quick Reference: All Commands at Once

```bash
# 100 users
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=100 -Jrampup=30 \
  -l results/combined-100-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-100-users/report-${TIMESTAMP}/ \
  -j results/combined-100-users/jmeter-${TIMESTAMP}.log && \
open results/combined-100-users/report-${TIMESTAMP}/index.html

# 200 users
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=200 -Jrampup=60 \
  -l results/combined-200-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-200-users/report-${TIMESTAMP}/ \
  -j results/combined-200-users/jmeter-${TIMESTAMP}.log && \
open results/combined-200-users/report-${TIMESTAMP}/index.html

# 300 users
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=300 -Jrampup=90 \
  -l results/combined-300-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-300-users/report-${TIMESTAMP}/ \
  -j results/combined-300-users/jmeter-${TIMESTAMP}.log && \
open results/combined-300-users/report-${TIMESTAMP}/index.html

# 400 users
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=400 -Jrampup=120 \
  -l results/combined-400-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-400-users/report-${TIMESTAMP}/ \
  -j results/combined-400-users/jmeter-${TIMESTAMP}.log && \
open results/combined-400-users/report-${TIMESTAMP}/index.html

# 500 users
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=500 -Jrampup=150 \
  -l results/combined-500-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-500-users/report-${TIMESTAMP}/ \
  -j results/combined-500-users/jmeter-${TIMESTAMP}.log && \
open results/combined-500-users/report-${TIMESTAMP}/index.html

# Generate combined graphs
./generate-graphs-combined.sh
```

---

## Notes

- **Each test takes 2-5 minutes** depending on user count
- **HTML reports are interactive** - you can drill down into details
- **Combined graphs are static PNGs** - quick visual comparison
- **Test duration** increases with user count (more requests to process)

