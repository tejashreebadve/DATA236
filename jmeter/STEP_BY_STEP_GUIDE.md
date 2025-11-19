# Step-by-Step Guide: Running JMeter Tests and Generating Analysis

This guide walks you through running the load tests, generating graphs, and creating the analysis report.

## Prerequisites

1. **Install Apache JMeter**
   ```bash
   # macOS
   brew install jmeter
   
   # Or download from: https://jmeter.apache.org/download_jmeter.cgi
   # Extract and add to PATH
   ```

2. **Ensure Services are Running**
   ```bash
   # Using Docker
   docker-compose up -d
   
   # Or using Kubernetes
   kubectl get pods -n rednest
   ```

3. **Verify Services are Accessible**
   ```bash
   curl http://localhost:3001/health  # Auth service
   curl http://localhost:3004/api/property/search  # Property service
   ```

## Step 1: Run Load Tests

### Option A: Run All Tests Automatically (Recommended)

```bash
cd jmeter
./run-load-tests.sh
```

This will:
- Run tests for 100, 200, 300, 400, and 500 concurrent users
- Generate HTML reports for each test
- Save results in `results/` directory

### Option B: Run Individual Tests

```bash
cd jmeter

# Test with 100 users
jmeter -n -t rednest-comprehensive-test.jmx \
  -Jhost=localhost \
  -Jauth_port=3001 \
  -Jproperty_port=3004 \
  -Jbooking_port=3005 \
  -Jusers=100 \
  -Jrampup=30 \
  -l results/100-users/results.jtl \
  -e -o results/100-users/report/

# Test with 200 users
jmeter -n -t rednest-comprehensive-test.jmx \
  -Jhost=localhost \
  -Jusers=200 \
  -Jrampup=60 \
  -l results/200-users/results.jtl \
  -e -o results/200-users/report/

# Repeat for 300, 400, 500 users
```

### Option C: Run Using JMeter GUI (For Debugging)

```bash
# Open JMeter GUI
jmeter

# Load test plan
File → Open → Select "rednest-comprehensive-test.jmx"

# Configure variables (if needed)
# Right-click Test Plan → User Defined Variables
# Update: host, auth_port, property_port, booking_port, users, rampup

# Run test
Click green "Play" button

# View results in "View Results Tree" or "Summary Report"
```

## Step 2: View Test Results

After running tests, you'll have HTML reports for each user count.

### Access HTML Reports

```bash
# Open in browser
open results/100-users/report-*/index.html
open results/200-users/report-*/index.html
open results/300-users/report-*/index.html
open results/400-users/report-*/index.html
open results/500-users/report-*/index.html
```

### Key Sections in HTML Report

1. **Dashboard Tab**
   - Overview of all metrics
   - Summary statistics
   - Response time distribution

2. **Statistics Tab**
   - Detailed statistics per request type
   - Min, Max, Average, Median response times
   - Error percentage
   - Throughput

3. **Graphs Tab**
   - Response Times Over Time
   - Bytes Throughput Over Time
   - Latencies Over Time

## Step 3: Extract Metrics

For each test (100, 200, 300, 400, 500 users):

1. **Open the HTML Report**
   - Navigate to `results/<user-count>-users/report-*/index.html`

2. **Go to Statistics Tab**
   - Find the overall statistics or specific request statistics

3. **Record Key Metrics:**
   - **Average Response Time** (ms)
   - **Median Response Time** (ms)
   - **90th Percentile** (ms)
   - **95th Percentile** (ms)
   - **99th Percentile** (ms)
   - **Throughput** (requests/second)
   - **Error Rate** (%)
   - **Min/Max Response Time** (ms)

4. **Create a Table:**

| Metric | 100 Users | 200 Users | 300 Users | 400 Users | 500 Users |
|--------|-----------|-----------|-----------|-----------|-----------|
| Avg Response Time | [X]ms | [X]ms | [X]ms | [X]ms | [X]ms |
| 95th Percentile | [X]ms | [X]ms | [X]ms | [X]ms | [X]ms |
| Throughput (RPS) | [X] | [X] | [X] | [X] | [X] |
| Error Rate | [X]% | [X]% | [X]% | [X]% | [X]% |

## Step 4: Generate Graphs

### Option A: Use JMeter Aggregate Graph

1. **Open JMeter GUI**
2. **Load test plan**
3. **Add Aggregate Graph Listener**
   - Right-click Thread Group → Add → Listener → Aggregate Graph
4. **Load results**
   - Click "Browse" → Select `.jtl` file from results
5. **View Graph**
   - Graph shows response time distribution
6. **Take Screenshot**
   - Save as image

### Option B: Create Graphs in Excel/Google Sheets

1. **Extract Data from Reports**
   - Copy metrics table from Step 3

2. **Create Line Charts:**
   - **Chart 1: Response Time vs Concurrent Users**
     - X-axis: Concurrent Users (100, 200, 300, 400, 500)
     - Y-axis: Average Response Time (ms)
     - Add series for: Average, 95th Percentile
   
   - **Chart 2: Throughput vs Concurrent Users**
     - X-axis: Concurrent Users
     - Y-axis: Throughput (Requests/Second)
   
   - **Chart 3: Error Rate vs Concurrent Users**
     - X-axis: Concurrent Users
     - Y-axis: Error Rate (%)

3. **Format Charts:**
   - Add titles, labels, legends
   - Use different colors for different series
   - Add trend lines if applicable

### Option C: Use Python (Optional)

```python
import matplotlib.pyplot as plt
import pandas as pd

# Data from your tests
data = {
    'Users': [100, 200, 300, 400, 500],
    'Avg Response Time': [150, 300, 600, 1200, 2500],
    'Throughput': [50, 80, 90, 85, 70],
    'Error Rate': [0.1, 0.5, 2.0, 5.0, 12.0]
}

df = pd.DataFrame(data)

# Response Time Graph
plt.figure(figsize=(10, 6))
plt.plot(df['Users'], df['Avg Response Time'], marker='o')
plt.xlabel('Concurrent Users')
plt.ylabel('Average Response Time (ms)')
plt.title('Response Time vs Concurrent Users')
plt.grid(True)
plt.savefig('response-time-graph.png')

# Throughput Graph
plt.figure(figsize=(10, 6))
plt.plot(df['Users'], df['Throughput'], marker='o', color='green')
plt.xlabel('Concurrent Users')
plt.ylabel('Throughput (Requests/Second)')
plt.title('Throughput vs Concurrent Users')
plt.grid(True)
plt.savefig('throughput-graph.png')

# Error Rate Graph
plt.figure(figsize=(10, 6))
plt.plot(df['Users'], df['Error Rate'], marker='o', color='red')
plt.xlabel('Concurrent Users')
plt.ylabel('Error Rate (%)')
plt.title('Error Rate vs Concurrent Users')
plt.grid(True)
plt.savefig('error-rate-graph.png')
```

## Step 5: Create Analysis Report

### Generate Template

```bash
cd jmeter
./generate-analysis.sh
```

This creates: `analysis/performance-analysis-<timestamp>.md`

### Fill in the Report

1. **Open the generated report**
   ```bash
   open analysis/performance-analysis-*.md
   ```

2. **Fill in Metrics Table**
   - Use data extracted in Step 3
   - Replace `[Extract from report]` with actual values

3. **Complete Detailed Analysis**
   - For each user count, analyze:
     - Performance characteristics
     - Response time trends
     - Throughput behavior
     - Error patterns

4. **Identify Bottlenecks**
   - Analyze which services/components slow down
   - Check service logs for errors
   - Identify resource constraints (CPU, memory, database)

5. **Write Recommendations**
   - Short-term fixes
   - Medium-term improvements
   - Long-term optimizations

### Analysis Template Sections

```markdown
## Analysis for [X] Concurrent Users

**Performance Level:** [Excellent/Good/Acceptable/Degraded/Poor]

### Response Time Analysis
- Average: [X]ms
- 95th Percentile: [X]ms
- **Why:** [Explain why response time is at this level]
- **Bottlenecks:** [Identify bottlenecks]

### Throughput Analysis
- Requests/Second: [X]
- **Why:** [Explain throughput behavior]
- **Limitations:** [What limits throughput]

### Error Rate Analysis
- Error Rate: [X]%
- **Why:** [Explain errors]
- **Error Types:** [List common errors]

### Overall Assessment
[Your overall assessment of performance at this load level]
```

## Step 6: Take Screenshots

### Required Screenshots

1. **JMeter Summary Report** (for each user count)
   - Shows overall statistics
   - Location: Summary Report listener in JMeter GUI

2. **HTML Report Dashboard** (for each user count)
   - Overview of all metrics
   - Location: `results/<user-count>-users/report-*/index.html` → Dashboard tab

3. **Response Time Graph**
   - From Aggregate Graph or your custom graph
   - Shows response time vs concurrent users

4. **Throughput Graph**
   - Shows throughput vs concurrent users

5. **Error Rate Graph**
   - Shows error rate vs concurrent users

### How to Take Screenshots

- **macOS:** `Cmd + Shift + 4` (select area) or `Cmd + Shift + 3` (full screen)
- **Windows:** `Windows + Shift + S` (Snipping Tool)
- **Linux:** Use screenshot tool or `gnome-screenshot`

## Step 7: Final Report Structure

Your final submission should include:

```
rednest-jmeter-report/
├── rednest-comprehensive-test.jmx          # Test plan
├── performance-analysis.md                  # Analysis report
├── graphs/
│   ├── response-time-graph.png
│   ├── throughput-graph.png
│   └── error-rate-graph.png
├── screenshots/
│   ├── 100-users-summary.png
│   ├── 200-users-summary.png
│   ├── 300-users-summary.png
│   ├── 400-users-summary.png
│   └── 500-users-summary.png
└── results/                                 # Optional: include results
    ├── 100-users/
    ├── 200-users/
    ├── 300-users/
    ├── 400-users/
    └── 500-users/
```

## Quick Reference Commands

```bash
# Run all tests
cd jmeter && ./run-load-tests.sh

# View a specific report
open results/100-users/report-*/index.html

# Generate analysis template
./generate-analysis.sh

# Run single test manually
jmeter -n -t rednest-comprehensive-test.jmx \
  -Jusers=100 -Jrampup=30 \
  -l results/100-users/results.jtl \
  -e -o results/100-users/report/
```

## Troubleshooting

### JMeter Out of Memory
```bash
export HEAP="-Xms1g -Xmx4g -XX:MaxMetaspaceSize=512m"
jmeter -n -t rednest-comprehensive-test.jmx ...
```

### Connection Refused
- Verify services are running: `docker-compose ps` or `kubectl get pods`
- Check ports: `netstat -an | grep 3001`

### No Results in Report
- Check JMeter log: `results/<user-count>-users/jmeter.log`
- Verify test completed successfully
- Check if services responded correctly

## Next Steps

1. ✅ Run all load tests (100-500 users)
2. ✅ Extract metrics from each report
3. ✅ Create graphs (response time, throughput, error rate)
4. ✅ Complete analysis report
5. ✅ Take screenshots
6. ✅ Submit: .jmx file + analysis report + graphs + screenshots

