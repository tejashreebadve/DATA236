# JMeter Load Testing for RedNest

This directory contains JMeter test plans for load testing RedNest microservices.

## Prerequisites

1. Install Apache JMeter: https://jmeter.apache.org/download_jmeter.cgi
2. Ensure all services are running (Docker or Kubernetes)
3. Update the `host` variable in each test plan to match your deployment

## Test Plans

### 1. Authentication Test Plan (`auth-test-plan.jmx`)
- Tests user registration (traveler and owner)
- Tests login endpoints
- Tests token verification
- Simulates concurrent user authentication

### 2. Property Test Plan (`property-test-plan.jmx`)
- Tests property search
- Tests property fetching by ID
- Tests property creation (requires owner authentication)
- Simulates concurrent property browsing

### 3. Booking Flow Test Plan (`booking-test-plan.jmx`)
- Tests booking creation (traveler)
- Tests booking acceptance/cancellation (owner)
- Simulates concurrent booking requests
- Tests Kafka integration flow

### 4. Load Test Scripts
- `load-test-100-users.sh` - 100 concurrent users
- `load-test-200-users.sh` - 200 concurrent users
- `load-test-300-users.sh` - 300 concurrent users
- `load-test-400-users.sh` - 400 concurrent users
- `load-test-500-users.sh` - 500 concurrent users

## Running Tests

### Manual Execution

1. Open JMeter GUI:
   ```bash
   jmeter
   ```

2. Load a test plan:
   - File → Open → Select `.jmx` file

3. Configure:
   - Update `host` variable (default: `localhost`)
   - Update port numbers if needed
   - Adjust thread counts for concurrent users

4. Run test:
   - Click green "Play" button
   - View results in "View Results Tree" or "Summary Report"

### Command Line Execution

```bash
# Run a test plan
jmeter -n -t auth-test-plan.jmx -l results/auth-results.jtl -e -o results/auth-report/

# Run with specific number of users
jmeter -n -t property-test-plan.jmx -l results/property-results.jtl -e -o results/property-report/ -Jusers=200
```

### Using Load Test Scripts

```bash
# Make scripts executable
chmod +x load-test-*.sh

# Run a specific load test
./load-test-100-users.sh
```

## Results Analysis

After running tests, JMeter generates:
- `.jtl` files: Raw test results
- HTML reports: Detailed analysis (if `-e -o` flags used)

### Key Metrics to Analyze

1. **Response Time**:
   - Average response time
   - Median response time
   - 90th/95th/99th percentile

2. **Throughput**:
   - Requests per second
   - Transactions per second

3. **Error Rate**:
   - Percentage of failed requests
   - Error types and frequencies

4. **Resource Utilization**:
   - CPU usage
   - Memory usage
   - Network I/O

## Test Scenarios

### Scenario 1: Light Load (100 users)
- Expected: All requests should succeed
- Response time: < 500ms average
- Error rate: < 1%

### Scenario 2: Medium Load (200-300 users)
- Expected: Most requests succeed
- Response time: < 1000ms average
- Error rate: < 5%

### Scenario 3: Heavy Load (400-500 users)
- Expected: Some degradation acceptable
- Response time: < 2000ms average
- Error rate: < 10%

## Generating Reports

```bash
# Generate HTML report from existing results
jmeter -g results/auth-results.jtl -o results/auth-report/
```

## Notes

- Update host/port in test plans before running
- Ensure services are running and accessible
- Start with lower user counts and gradually increase
- Monitor system resources during tests
- Kafka topics should be created before running booking tests

