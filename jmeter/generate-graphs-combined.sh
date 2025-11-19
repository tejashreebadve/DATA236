#!/bin/bash

# Generate Combined Performance Graphs from All Combined Test Results
# Compares 100, 200, 300, 400, 500 users across Auth, Property, and Booking APIs

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}📈 Generating Combined Performance Graphs${NC}"
echo ""

# Check for Python and required libraries
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed.${NC}"
    exit 1
fi

if ! python3 -c "import matplotlib, pandas" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Installing matplotlib and pandas...${NC}"
    pip3 install matplotlib pandas
fi

mkdir -p graphs

# Python script to generate combined graphs
cat > graphs/generate_combined_plots.py << 'EOF'
import pandas as pd
import matplotlib.pyplot as plt
import os
import glob

results_dir = 'results'
output_dir = 'graphs'
os.makedirs(output_dir, exist_ok=True)

all_data = []
user_counts = []

# Collect data from all combined test runs
for user_count in [100, 200, 300, 400, 500]:
    user_folder = f"{results_dir}/combined-{user_count}-users"
    
    if not os.path.exists(user_folder):
        print(f"⚠️  No results found for {user_count} users")
        continue
    
    # Find the latest .jtl file in the folder
    jtl_files = glob.glob(os.path.join(user_folder, 'results-*.jtl'))
    if not jtl_files:
        print(f"⚠️  No .jtl file found for {user_count} users")
        continue
    
    latest_jtl = max(jtl_files, key=os.path.getctime)
    print(f"Processing {latest_jtl} for {user_count} users...")
    
    try:
        df = pd.read_csv(latest_jtl)
        df['user_count'] = user_count
        all_data.append(df)
        user_counts.append(user_count)
    except Exception as e:
        print(f"Error reading {latest_jtl}: {e}")

if not all_data:
    print("❌ No data to plot. Run tests first!")
    exit(1)

combined_df = pd.concat(all_data)

# Separate by API type
login_df = combined_df[combined_df['label'].str.contains('Login', na=False)]
property_df = combined_df[combined_df['label'].str.contains('Property', na=False)]
booking_df = combined_df[combined_df['label'].str.contains('Booking', na=False)]

# Function to calculate metrics
def calc_metrics(df, user_count):
    df_user = df[df['user_count'] == user_count]
    if df_user.empty:
        return None
    
    avg_response = df_user['elapsed'].mean()
    p95_response = df_user['elapsed'].quantile(0.95)
    success_rate = (df_user['success'] == True).sum() / len(df_user) * 100
    
    # Calculate throughput
    start_time = df_user['timeStamp'].min()
    end_time = df_user['timeStamp'].max() + df_user['elapsed'].max()
    duration_seconds = (end_time - start_time) / 1000.0
    total_requests = len(df_user)
    throughput = total_requests / duration_seconds if duration_seconds > 0 else 0
    
    return {
        'avg_response': avg_response,
        'p95_response': p95_response,
        'throughput': throughput,
        'success_rate': success_rate
    }

# Prepare data for plotting
def prepare_plot_data(df, api_name):
    plot_data = []
    for user_count in sorted(user_counts):
        metrics = calc_metrics(df, user_count)
        if metrics:
            plot_data.append({
                'users': user_count,
                'avg_response': metrics['avg_response'],
                'p95_response': metrics['p95_response'],
                'throughput': metrics['throughput'],
                'success_rate': metrics['success_rate']
            })
    return pd.DataFrame(plot_data)

# Plot 1: Average Response Time vs Concurrent Users (All APIs)
plt.figure(figsize=(14, 8))
for df, name, color in [(login_df, 'Login', 'blue'), (property_df, 'Property Search', 'green'), (booking_df, 'Booking', 'red')]:
    plot_df = prepare_plot_data(df, name)
    if not plot_df.empty:
        plt.plot(plot_df['users'], plot_df['avg_response'], marker='o', label=f'{name}', color=color, linewidth=2)

plt.title('Average Response Time vs Concurrent Users (All APIs)', fontsize=16, fontweight='bold')
plt.xlabel('Concurrent Users', fontsize=12)
plt.ylabel('Average Response Time (ms)', fontsize=12)
plt.legend(fontsize=11)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'combined-response-time-all-apis.png'), dpi=300)
plt.close()
print(f"✅ Generated {os.path.join(output_dir, 'combined-response-time-all-apis.png')}")

# Plot 2: Throughput vs Concurrent Users (All APIs)
plt.figure(figsize=(14, 8))
for df, name, color in [(login_df, 'Login', 'blue'), (property_df, 'Property Search', 'green'), (booking_df, 'Booking', 'red')]:
    plot_df = prepare_plot_data(df, name)
    if not plot_df.empty:
        plt.plot(plot_df['users'], plot_df['throughput'], marker='o', label=f'{name}', color=color, linewidth=2)

plt.title('Throughput vs Concurrent Users (All APIs)', fontsize=16, fontweight='bold')
plt.xlabel('Concurrent Users', fontsize=12)
plt.ylabel('Throughput (Requests/Second)', fontsize=12)
plt.legend(fontsize=11)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'combined-throughput-all-apis.png'), dpi=300)
plt.close()
print(f"✅ Generated {os.path.join(output_dir, 'combined-throughput-all-apis.png')}")

# Plot 3: Success Rate vs Concurrent Users (All APIs)
plt.figure(figsize=(14, 8))
for df, name, color in [(login_df, 'Login', 'blue'), (property_df, 'Property Search', 'green'), (booking_df, 'Booking', 'red')]:
    plot_df = prepare_plot_data(df, name)
    if not plot_df.empty:
        plt.plot(plot_df['users'], plot_df['success_rate'], marker='o', label=f'{name}', color=color, linewidth=2)

plt.title('Success Rate vs Concurrent Users (All APIs)', fontsize=16, fontweight='bold')
plt.xlabel('Concurrent Users', fontsize=12)
plt.ylabel('Success Rate (%)', fontsize=12)
plt.ylim([0, 105])
plt.legend(fontsize=11)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'combined-success-rate-all-apis.png'), dpi=300)
plt.close()
print(f"✅ Generated {os.path.join(output_dir, 'combined-success-rate-all-apis.png')}")

print(f"\n✅ All combined graphs generated successfully in '{output_dir}/' directory!")
print("\n📊 Generated Graphs:")
print("  1. combined-response-time-all-apis.png - Response time comparison")
print("  2. combined-throughput-all-apis.png - Throughput comparison")
print("  3. combined-success-rate-all-apis.png - Success rate comparison")
EOF

python3 graphs/generate_combined_plots.py

echo -e "${GREEN}✅ Combined graphs generated!${NC}"
echo ""
echo "📊 View graphs in the 'graphs/' directory"

