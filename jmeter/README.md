# RedNest JMeter Load Testing

This directory contains JMeter test plans and scripts for load testing the RedNest application.

## Files

- `rednest-load-test.jmx` - Main load test plan (Property Search API)
- `rednest-final-test.jmx` - Comprehensive test plan (Auth + Property + Booking)
- `run-all-tests.sh` - Script to run tests for 100, 200, 300, 400, 500 users
- `generate-graphs.sh` - Script to generate performance graphs from results
- `generate-analysis.sh` - Script to generate analysis report template

## Prerequisites

1. **Apache JMeter** (5.6+)
   ```bash
   # macOS
   brew install jmeter
   
   # Or download from: https://jmeter.apache.org/download_jmeter.cgi
   ```

2. **Python 3** (for graph generation)
   ```bash
   pip3 install matplotlib pandas
   ```

3. **RedNest Services Running**
   - Ensure all services are running on localhost (or update host/ports in scripts)
   - Auth Service: port 3001
   - Property Service: port 3004
   - Booking Service: port 3005

## Quick Start

### 1. Run All Load Tests

```bash
cd jmeter
./run-all-tests.sh
```

This will:
- Run tests for 100, 200, 300, 400, and 500 concurrent users
- Generate HTML reports for each test
- Save results in `results/` directory

### 2. Generate Graphs

```bash
./generate-graphs.sh
```

This will:
- Parse all test results
- Generate performance graphs (Response Time, Throughput, Error Rate)
- Save graphs to `graphs/performance-analysis.png`
- Save data to `graphs/performance-data.json`

### 3. Generate Analysis Report

```bash
./generate-analysis.sh
```

This will:
- Create an analysis report template
- Save to `analysis/performance-analysis-<timestamp>.md`

## Manual Test Execution

### Run Single Test

```bash
# Test with 100 users, 30s ramp-up
jmeter -n -t rednest-load-test.jmx \
  -Jusers=100 \
  -Jrampup=30 \
  -l results/100-users/results.jtl \
  -e -o results/100-users/report/
```

### View Results

1. **HTML Report**: Open `results/<user-count>/report-*/index.html` in a browser
2. **JTL File**: Raw results in CSV format at `results/<user-count>/results-*.jtl`

## Test Plans

### rednest-load-test.jmx
- **Focus**: Property Search API
- **Endpoints**: GET /api/property/search
- **Use Case**: High-volume read operations
- **Status**: ✅ Working

### rednest-final-test.jmx
- **Focus**: Full user flow
- **Endpoints**: 
  - POST /api/auth/register/traveler
  - POST /api/auth/login/traveler
  - GET /api/property/search
  - POST /api/booking
- **Use Case**: Complete booking flow
- **Status**: ⚠️ Auth endpoints need test user setup

## Results Structure

```
results/
├── 100-users/
│   ├── results-<timestamp>.jtl
│   ├── report-<timestamp>/
│   │   └── index.html
│   └── jmeter.log
├── 200-users/
│   └── ...
└── ...
```

## Performance Metrics

The tests measure:
- **Response Time**: Average and 95th percentile
- **Throughput**: Requests per second (RPS)
- **Error Rate**: Percentage of failed requests
- **Latency**: Time to first byte
- **Connect Time**: Time to establish connection

## Graph Generation

The `generate-graphs.sh` script creates 4 graphs:

1. **Response Time vs Concurrent Users**
   - Shows average and 95th percentile response times
   
2. **Throughput vs Concurrent Users**
   - Shows requests per second at different load levels
   
3. **Error Rate vs Concurrent Users**
   - Shows percentage of errors at different load levels
   
4. **Performance Overview**
   - Combined view of response time and throughput

## Troubleshooting

### JMeter Out of Memory
```bash
export HEAP="-Xms1g -Xmx4g -XX:MaxMetaspaceSize=512m"
jmeter -n -t rednest-load-test.jmx ...
```

### Connection Refused
- Verify services are running: `curl http://localhost:3004/api/property/search`
- Check ports in test plan match your service ports

### No Results in Report
- Check JMeter log: `results/<user-count>/jmeter.log`
- Verify test completed successfully
- Check if services responded correctly

## Next Steps

1. ✅ Run all load tests (100-500 users)
2. ✅ Generate graphs
3. ✅ Review HTML reports
4. ✅ Fill in analysis report with findings
5. ✅ Identify bottlenecks and optimization opportunities

## Notes

- Tests use hardcoded `localhost` - update for different environments
- Property search test works without authentication
- For auth/booking tests, ensure test users exist or modify test plan
- Ramp-up times: 30s (100), 60s (200), 90s (300), 120s (400), 150s (500)
