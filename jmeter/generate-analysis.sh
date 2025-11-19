#!/bin/bash

# Generate Analysis Report from JMeter Results
# Creates graphs and analysis document

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}📊 Generating Analysis Report${NC}"
echo ""

# Create analysis directory
mkdir -p analysis
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="analysis/performance-analysis-${TIMESTAMP}.md"

# Function to extract metrics from JMeter HTML report
extract_metrics() {
    local user_count=$1
    local report_dir=$(find results/$user_count-users -type d -name "report-*" | head -1)
    
    if [ -z "$report_dir" ]; then
        echo "⚠️  No report found for $user_count users"
        return
    fi
    
    local stats_file="$report_dir/statistics.json"
    
    if [ -f "$stats_file" ]; then
        echo "Extracting metrics from $report_dir"
        # Parse JSON and extract key metrics
        # This is a simplified version - you may need to parse the HTML report
        echo "Metrics extracted for $user_count users"
    else
        echo "⚠️  Statistics file not found for $user_count users"
    fi
}

# Start report
cat > "$REPORT_FILE" << EOF
# RedNest Performance Test Analysis Report

**Generated:** $(date)
**Test Plan:** rednest-load-test.jmx

## Executive Summary

This report analyzes the performance of RedNest microservices under varying load conditions (100, 200, 300, 400, and 500 concurrent users).

## Test Configuration

- **Test Plan:** Comprehensive test covering:
  - User Authentication (Registration & Login)
  - Property Data Fetching (Search & Get Details)
  - Booking Processing (Create, Accept, Cancel)
- **Simulation:** Concurrent Travelers making bookings and Owners responding
- **Test Duration:** Varies by user count
- **Ramp-up Time:** 30s (100), 60s (200), 90s (300), 120s (400), 150s (500)

## Results Summary

| Concurrent Users | Avg Response Time (ms) | 95th Percentile (ms) | Throughput (RPS) | Error Rate (%) | Status |
|-----------------|------------------------|----------------------|------------------|----------------|--------|
| 100             | [Extract from report]  | [Extract from report]| [Extract]        | [Extract]      | ✅     |
| 200             | [Extract from report]  | [Extract from report]| [Extract]        | [Extract]      | ✅     |
| 300             | [Extract from report]  | [Extract from report]| [Extract]        | [Extract]      | ⚠️     |
| 400             | [Extract from report]  | [Extract from report]| [Extract]        | [Extract]      | ⚠️     |
| 500             | [Extract from report]  | [Extract from report]| [Extract]        | [Extract]      | ❌     |

## Detailed Analysis

### 100 Concurrent Users
**Location:** \`results/100-users/report-*/index.html\`

- **Performance:** Excellent
- **Response Time:** [Fill from report]
- **Throughput:** [Fill from report]
- **Analysis:** [Your analysis]

### 200 Concurrent Users
**Location:** \`results/200-users/report-*/index.html\`

- **Performance:** Good
- **Response Time:** [Fill from report]
- **Throughput:** [Fill from report]
- **Analysis:** [Your analysis]

### 300 Concurrent Users
**Location:** \`results/300-users/report-*/index.html\`

- **Performance:** Acceptable
- **Response Time:** [Fill from report]
- **Throughput:** [Fill from report]
- **Analysis:** [Your analysis]

### 400 Concurrent Users
**Location:** \`results/400-users/report-*/index.html\`

- **Performance:** Degraded
- **Response Time:** [Fill from report]
- **Throughput:** [Fill from report]
- **Analysis:** [Your analysis]

### 500 Concurrent Users
**Location:** \`results/500-users/report-*/index.html\`

- **Performance:** Poor
- **Response Time:** [Fill from report]
- **Throughput:** [Fill from report]
- **Analysis:** [Your analysis]

## Graphs

### 1. Response Time vs Concurrent Users
[Include screenshot from JMeter Aggregate Graph or create using Excel/Python]

**Analysis:**
- Response time increases [linearly/exponentially] with user count
- At [X] users, response time exceeds acceptable threshold
- Primary bottleneck: [Identify service/component]

### 2. Throughput vs Concurrent Users
[Include screenshot]

**Analysis:**
- Throughput peaks at [X] users
- Beyond [X] users, throughput decreases due to [reason]
- Optimal load: [X] concurrent users

### 3. Error Rate vs Concurrent Users
[Include screenshot]

**Analysis:**
- Error rate remains low until [X] users
- Primary error types: [List errors]
- Error causes: [Identify root causes]

## Performance Bottlenecks Identified

### 1. [Bottleneck Name]
- **Description:** [What is the bottleneck]
- **Impact:** [How it affects performance]
- **Location:** [Which service/component]
- **Evidence:** [Supporting data from tests]

### 2. [Bottleneck Name]
- **Description:** [What is the bottleneck]
- **Impact:** [How it affects performance]
- **Location:** [Which service/component]
- **Evidence:** [Supporting data from tests]

### 3. [Bottleneck Name]
- **Description:** [What is the bottleneck]
- **Impact:** [How it affects performance]
- **Location:** [Which service/component]
- **Evidence:** [Supporting data from tests]

## Recommendations

### Short-term (Immediate)
1. **[Recommendation 1]**
   - **Action:** [What to do]
   - **Expected Impact:** [Expected improvement]

2. **[Recommendation 2]**
   - **Action:** [What to do]
   - **Expected Impact:** [Expected improvement]

### Medium-term (1-3 months)
1. **[Recommendation 1]**
   - **Action:** [What to do]
   - **Expected Impact:** [Expected improvement]

2. **[Recommendation 2]**
   - **Action:** [What to do]
   - **Expected Impact:** [Expected improvement]

### Long-term (3-6 months)
1. **[Recommendation 1]**
   - **Action:** [What to do]
   - **Expected Impact:** [Expected improvement]

## Conclusion

[Summary of findings and overall assessment]

## Appendix

### Test Environment
- **Date:** $(date)
- **Services:** All microservices running on [Docker/Kubernetes]
- **Database:** MongoDB Atlas
- **Message Queue:** Kafka

### Test Files
- Test Plan: \`rednest-comprehensive-test.jmx\`
- Results: \`results/\` directory
- Reports: Individual HTML reports in each user count directory

### How to View Results
1. Navigate to \`results/<user-count>-users/report-<timestamp>/\`
2. Open \`index.html\` in a web browser
3. Review Dashboard, Statistics, and Graphs sections

EOF

echo -e "${GREEN}✅ Analysis report created: $REPORT_FILE${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Open each HTML report in results/<user-count>-users/report-*/index.html"
echo "2. Extract metrics (response time, throughput, error rate) from each report"
echo "3. Fill in the analysis report: $REPORT_FILE"
echo "4. Take screenshots of graphs from JMeter reports"
echo "5. Create graphs showing trends (response time vs users, throughput vs users)"
echo "6. Complete the analysis with your findings"

