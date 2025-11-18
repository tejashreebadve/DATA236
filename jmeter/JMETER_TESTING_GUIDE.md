# JMeter Load Testing Guide for RedNest

This guide explains how to perform load testing on RedNest services using Apache JMeter.

## Prerequisites

1. **Install Apache JMeter**
   ```bash
   # macOS
   brew install jmeter
   
   # Linux
   wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.2.tgz
   tar -xzf apache-jmeter-5.6.2.tgz
   export PATH=$PATH:$(pwd)/apache-jmeter-5.6.2/bin
   
   # Or download from: https://jmeter.apache.org/download_jmeter.cgi
   ```

2. **Ensure Services are Running**
   - All microservices should be running (Docker or Kubernetes)
   - Services should be accessible at configured ports

## Test Plans Overview

### 1. Authentication Test Plan (`auth-test-plan.jmx`)
Tests:
- User registration (traveler and owner)
- User login
- Token verification

### 2. Property Test Plan (`property-test-plan.jmx`)
Tests:
- Property search
- Property fetching by ID
- Property creation (requires authentication)

### 3. Booking Flow Test Plan (`booking-test-plan.jmx`)
Tests:
- Booking creation
- Booking acceptance/cancellation
- Kafka message flow

## Running Tests

### Option 1: Using Load Test Scripts (Recommended)

```bash
# Make scripts executable
chmod +x jmeter/load-test-*.sh

# Run specific load test
cd jmeter
./load-test-100-users.sh
./load-test-200-users.sh
./load-test-300-users.sh
./load-test-400-users.sh
./load-test-500-users.sh
```

### Option 2: Manual Execution

#### GUI Mode

```bash
# Open JMeter GUI
jmeter

# Load test plan
File → Open → Select .jmx file

# Configure variables
- Update host (default: localhost)
- Update port numbers
- Adjust thread counts

# Run test
Click green "Play" button
```

#### Command Line Mode

```bash
# Basic execution
jmeter -n -t auth-test-plan.jmx -l results.jtl

# With HTML report
jmeter -n -t auth-test-plan.jmx -l results.jtl -e -o report/

# With custom parameters
jmeter -n -t auth-test-plan.jmx \
  -Jhost=localhost \
  -Jport=3001 \
  -Jusers=200 \
  -Jrampup=60 \
  -l results.jtl \
  -e -o report/
```

## Test Scenarios

### Scenario 1: 100 Concurrent Users
- **Ramp-up**: 30 seconds
- **Expected**: All requests succeed
- **Response Time**: < 500ms average
- **Error Rate**: < 1%

### Scenario 2: 200 Concurrent Users
- **Ramp-up**: 60 seconds
- **Expected**: Most requests succeed
- **Response Time**: < 1000ms average
- **Error Rate**: < 5%

### Scenario 3: 300 Concurrent Users
- **Ramp-up**: 90 seconds
- **Expected**: Some degradation acceptable
- **Response Time**: < 1500ms average
- **Error Rate**: < 5%

### Scenario 4: 400 Concurrent Users
- **Ramp-up**: 120 seconds
- **Expected**: Moderate degradation
- **Response Time**: < 2000ms average
- **Error Rate**: < 10%

### Scenario 5: 500 Concurrent Users
- **Ramp-up**: 150 seconds
- **Expected**: Significant load
- **Response Time**: < 3000ms average
- **Error Rate**: < 15%

## Results Analysis

### Key Metrics

1. **Response Time**
   - Average: Overall average response time
   - Median: Middle value (50th percentile)
   - 90th Percentile: 90% of requests completed within this time
   - 95th Percentile: 95% of requests completed within this time
   - 99th Percentile: 99% of requests completed within this time

2. **Throughput**
   - Requests per second (RPS)
   - Transactions per second (TPS)
   - Higher is better

3. **Error Rate**
   - Percentage of failed requests
   - Should be < 5% for good performance
   - Analyze error types

4. **Resource Utilization**
   - CPU usage
   - Memory usage
   - Network I/O
   - Database connections

### Generating Reports

```bash
# Generate HTML report from existing results
jmeter -g results/auth-results.jtl -o report/

# View report
open report/index.html
```

### Analyzing Results

1. **Open HTML Report**
   - Navigate to `results/<test-name>/<report-directory>/`
   - Open `index.html` in browser

2. **Key Sections**
   - **Dashboard**: Overview of all metrics
   - **Statistics**: Detailed statistics per request
   - **Graphs**: Visual representations
   - **Errors**: Error analysis

3. **Identify Bottlenecks**
   - High response times → Check database queries, external APIs
   - High error rates → Check service health, resource limits
   - Low throughput → Check server resources, network

## Performance Analysis Template

### For Each Test (100, 200, 300, 400, 500 users)

```markdown
## Test Results: X Concurrent Users

### Test Configuration
- Concurrent Users: X
- Ramp-up Time: Y seconds
- Test Duration: Z minutes
- Test Date: [Date]

### Results Summary
- Total Requests: [Number]
- Successful Requests: [Number]
- Failed Requests: [Number]
- Error Rate: [Percentage]%

### Response Times
- Average: [X]ms
- Median: [X]ms
- 90th Percentile: [X]ms
- 95th Percentile: [X]ms
- 99th Percentile: [X]ms

### Throughput
- Requests per Second: [X]
- Transactions per Second: [X]

### Analysis
[Your analysis of the results]

### Bottlenecks Identified
1. [Bottleneck 1]
2. [Bottleneck 2]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
```

## Creating Custom Test Plans

### Using JMeter GUI

1. **Create Thread Group**
   - Right-click Test Plan → Add → Threads (Users) → Thread Group
   - Set number of threads (users)
   - Set ramp-up period
   - Set loop count

2. **Add HTTP Request**
   - Right-click Thread Group → Add → Sampler → HTTP Request
   - Configure:
     - Server Name/IP
     - Port Number
     - HTTP Request
     - Path
     - Method (GET, POST, etc.)

3. **Add Headers**
   - Right-click HTTP Request → Add → Config Element → HTTP Header Manager
   - Add headers (Content-Type, Authorization, etc.)

4. **Add Assertions**
   - Right-click HTTP Request → Add → Assertions → Response Assertion
   - Set expected status code, response time, etc.

5. **Add Listeners**
   - View Results Tree: Detailed request/response
   - Summary Report: Statistics summary
   - Graph Results: Visual graphs

## Tips for Effective Testing

1. **Start Small**: Begin with 100 users, gradually increase
2. **Monitor Resources**: Watch CPU, memory, network during tests
3. **Test Realistic Scenarios**: Simulate actual user behavior
4. **Use Think Time**: Add delays between requests (simulate user thinking)
5. **Test Different Endpoints**: Don't just test one endpoint
6. **Run Multiple Times**: Average results for accuracy
7. **Document Everything**: Keep detailed notes of test conditions

## Common Issues

### JMeter Out of Memory

```bash
# Increase JMeter heap size
export HEAP="-Xms1g -Xmx4g -XX:MaxMetaspaceSize=512m"
jmeter -n -t test-plan.jmx
```

### Connection Refused

- Check if services are running
- Verify port numbers
- Check firewall settings

### High Error Rates

- Check service logs
- Verify database connectivity
- Check resource limits (CPU, memory)
- Verify Kafka connectivity

## Next Steps

1. Run all load tests (100-500 users)
2. Collect and analyze results
3. Create performance report with graphs
4. Identify bottlenecks
5. Implement optimizations
6. Re-test to verify improvements

