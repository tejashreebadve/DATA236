# Quick Commands for Load Testing

## View 100-User Test Results

```bash
cd jmeter

# Open the latest 100-user HTML report
open results/combined-100-users/report-*/index.html

# Or find the exact path
ls -td results/combined-100-users/report-* | head -1 | xargs -I {} open {}/index.html
```

---

## Step 2: Test with 200 Users

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=200 -Jrampup=60 \
  -l results/combined-200-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-200-users/report-${TIMESTAMP}/ \
  -j results/combined-200-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-200-users/report-${TIMESTAMP}/index.html
```

---

## Step 3: Test with 300 Users

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=300 -Jrampup=90 \
  -l results/combined-300-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-300-users/report-${TIMESTAMP}/ \
  -j results/combined-300-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-300-users/report-${TIMESTAMP}/index.html
```

---

## Step 4: Test with 400 Users

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=400 -Jrampup=120 \
  -l results/combined-400-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-400-users/report-${TIMESTAMP}/ \
  -j results/combined-400-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-400-users/report-${TIMESTAMP}/index.html
```

---

## Step 5: Test with 500 Users

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=500 -Jrampup=150 \
  -l results/combined-500-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-500-users/report-${TIMESTAMP}/ \
  -j results/combined-500-users/jmeter-${TIMESTAMP}.log

# View HTML report
open results/combined-500-users/report-${TIMESTAMP}/index.html
```

---

## Step 6: Generate Combined Comparison Graphs

After all tests are complete:

```bash
./generate-graphs-combined.sh

# View graphs
open graphs/combined-response-time-all-apis.png
open graphs/combined-throughput-all-apis.png
open graphs/combined-success-rate-all-apis.png
```

---

## Quick Helper: View Any Report

```bash
# View latest report for any user count
open results/combined-100-users/report-*/index.html
open results/combined-200-users/report-*/index.html
open results/combined-300-users/report-*/index.html
open results/combined-400-users/report-*/index.html
open results/combined-500-users/report-*/index.html
```

