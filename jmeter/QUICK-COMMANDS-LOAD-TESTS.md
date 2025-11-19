# Quick Commands for Load Testing

## Individual Test Commands

### Test 200 Users
```bash
cd /Users/deva/DATA236/jmeter

TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=200 -Jrampup=60 \
  -l results/combined-200-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-200-users/report-${TIMESTAMP}/ \
  -j results/combined-200-users/jmeter-${TIMESTAMP}.log && \
echo "✅ 200-user test complete!" && \
open results/combined-200-users/report-${TIMESTAMP}/index.html
```

### Test 300 Users
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=300 -Jrampup=90 \
  -l results/combined-300-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-300-users/report-${TIMESTAMP}/ \
  -j results/combined-300-users/jmeter-${TIMESTAMP}.log && \
echo "✅ 300-user test complete!" && \
open results/combined-300-users/report-${TIMESTAMP}/index.html
```

### Test 400 Users
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=400 -Jrampup=120 \
  -l results/combined-400-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-400-users/report-${TIMESTAMP}/ \
  -j results/combined-400-users/jmeter-${TIMESTAMP}.log && \
echo "✅ 400-user test complete!" && \
open results/combined-400-users/report-${TIMESTAMP}/index.html
```

### Test 500 Users
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S) && \
jmeter -n -t rednest-combined-test.jmx -Jusers=500 -Jrampup=150 \
  -l results/combined-500-users/results-${TIMESTAMP}.jtl \
  -e -o results/combined-500-users/report-${TIMESTAMP}/ \
  -j results/combined-500-users/jmeter-${TIMESTAMP}.log && \
echo "✅ 500-user test complete!" && \
open results/combined-500-users/report-${TIMESTAMP}/index.html
```

---

## Run All Tests Sequentially

```bash
cd /Users/deva/DATA236/jmeter
./RUN-ALL-LOAD-TESTS.sh
```

This script will:
1. Run 200-user test → show HTML report → wait for Enter
2. Run 300-user test → show HTML report → wait for Enter
3. Run 400-user test → show HTML report → wait for Enter
4. Run 500-user test → show HTML report → done

---

## After All Tests - Generate Combined Graphs

After running all tests, generate combined performance graphs:

```bash
cd /Users/deva/DATA236/jmeter
./generate-graphs-combined.sh
```

This will create graphs comparing performance across all user counts (100, 200, 300, 400, 500).

---

## Notes

- **Ramp-up Time**: Gradually increases with user count (60s for 200, 90s for 300, etc.)
- **Timestamped Results**: Each test creates unique folders/files to avoid conflicts
- **HTML Reports**: Automatically opens in browser after each test
- **Test Duration**: Each test takes approximately 1-3 minutes depending on user count

