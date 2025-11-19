#!/bin/bash

# Generate graphs from JMeter results using Python
# Requires: matplotlib, pandas

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}📊 Generating Performance Graphs${NC}"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python3 not found. Installing graphs requires Python3 with matplotlib and pandas.${NC}"
    echo "Install with: pip3 install matplotlib pandas"
    exit 1
fi

# Create graphs directory
mkdir -p graphs

# Python script to generate graphs
python3 << 'EOF'
import os
import csv
import json
from collections import defaultdict
import matplotlib.pyplot as plt

# User counts to process
user_counts = [100, 200, 300, 400, 500]
results_dir = "results"

# Data storage
data = {
    'users': [],
    'avg_response_time': [],
    'p95_response_time': [],
    'throughput': [],
    'error_rate': []
}

# Process each user count
for users in user_counts:
    test_dir = f"{results_dir}/{users}-users"
    
    # Find the latest results file
    jtl_files = [f for f in os.listdir(test_dir) if f.endswith('.jtl')]
    if not jtl_files:
        print(f"⚠️  No results found for {users} users")
        continue
    
    latest_jtl = sorted(jtl_files)[-1]
    jtl_path = os.path.join(test_dir, latest_jtl)
    
    # Parse JTL file
    response_times = []
    success_count = 0
    error_count = 0
    total_count = 0
    
    with open(jtl_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_count += 1
            elapsed = int(row.get('elapsed', 0))
            success = row.get('success', 'true').lower() == 'true'
            
            if success:
                success_count += 1
                response_times.append(elapsed)
            else:
                error_count += 1
    
    if not response_times:
        print(f"⚠️  No successful requests for {users} users")
        continue
    
    # Calculate metrics
    avg_response_time = sum(response_times) / len(response_times)
    sorted_times = sorted(response_times)
    p95_index = int(len(sorted_times) * 0.95)
    p95_response_time = sorted_times[p95_index] if p95_index < len(sorted_times) else sorted_times[-1]
    
    # Calculate throughput (requests per second)
    # Get test duration from first and last timestamp
    with open(jtl_path, 'r') as f:
        lines = f.readlines()
        if len(lines) > 1:
            first_time = int(lines[1].split(',')[0])
            last_time = int(lines[-1].split(',')[0])
            duration_seconds = (last_time - first_time) / 1000.0
            throughput = total_count / duration_seconds if duration_seconds > 0 else 0
        else:
            throughput = 0
    
    error_rate = (error_count / total_count * 100) if total_count > 0 else 0
    
    # Store data
    data['users'].append(users)
    data['avg_response_time'].append(avg_response_time)
    data['p95_response_time'].append(p95_response_time)
    data['throughput'].append(throughput)
    data['error_rate'].append(error_rate)
    
    print(f"✅ Processed {users} users: Avg={avg_response_time:.0f}ms, P95={p95_response_time:.0f}ms, Throughput={throughput:.1f} RPS, Errors={error_rate:.1f}%")

# Generate graphs
if not data['users']:
    print("❌ No data to plot")
    exit(1)

plt.style.use('seaborn-v0_8-darkgrid')
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# 1. Response Time vs Concurrent Users
ax1 = axes[0, 0]
ax1.plot(data['users'], data['avg_response_time'], marker='o', linewidth=2, label='Average', color='#2E86AB')
ax1.plot(data['users'], data['p95_response_time'], marker='s', linewidth=2, label='95th Percentile', color='#A23B72')
ax1.set_xlabel('Concurrent Users', fontsize=12)
ax1.set_ylabel('Response Time (ms)', fontsize=12)
ax1.set_title('Response Time vs Concurrent Users', fontsize=14, fontweight='bold')
ax1.legend()
ax1.grid(True, alpha=0.3)

# 2. Throughput vs Concurrent Users
ax2 = axes[0, 1]
ax2.plot(data['users'], data['throughput'], marker='o', linewidth=2, color='#06A77D')
ax2.set_xlabel('Concurrent Users', fontsize=12)
ax2.set_ylabel('Throughput (Requests/Second)', fontsize=12)
ax2.set_title('Throughput vs Concurrent Users', fontsize=14, fontweight='bold')
ax2.grid(True, alpha=0.3)

# 3. Error Rate vs Concurrent Users
ax3 = axes[1, 0]
ax3.plot(data['users'], data['error_rate'], marker='o', linewidth=2, color='#F18F01', markersize=8)
ax3.set_xlabel('Concurrent Users', fontsize=12)
ax3.set_ylabel('Error Rate (%)', fontsize=12)
ax3.set_title('Error Rate vs Concurrent Users', fontsize=14, fontweight='bold')
ax3.grid(True, alpha=0.3)
ax3.set_ylim(bottom=0)

# 4. Combined Performance Overview
ax4 = axes[1, 1]
ax4_twin = ax4.twinx()
line1 = ax4.plot(data['users'], data['avg_response_time'], marker='o', linewidth=2, label='Avg Response Time (ms)', color='#2E86AB')
line2 = ax4_twin.plot(data['users'], data['throughput'], marker='s', linewidth=2, label='Throughput (RPS)', color='#06A77D')
ax4.set_xlabel('Concurrent Users', fontsize=12)
ax4.set_ylabel('Response Time (ms)', fontsize=12, color='#2E86AB')
ax4_twin.set_ylabel('Throughput (RPS)', fontsize=12, color='#06A77D')
ax4.set_title('Performance Overview', fontsize=14, fontweight='bold')
ax4.tick_params(axis='y', labelcolor='#2E86AB')
ax4_twin.tick_params(axis='y', labelcolor='#06A77D')
lines = line1 + line2
labels = [l.get_label() for l in lines]
ax4.legend(lines, labels, loc='upper left')
ax4.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('graphs/performance-analysis.png', dpi=300, bbox_inches='tight')
print(f"\n✅ Graphs saved to: graphs/performance-analysis.png")

# Save data to JSON for reference
with open('graphs/performance-data.json', 'w') as f:
    json.dump(data, f, indent=2)
print("✅ Data saved to: graphs/performance-data.json")

EOF

echo -e "${GREEN}✅ Graph generation complete!${NC}"
echo "Graphs saved to: graphs/performance-analysis.png"

