#!/bin/bash

# Optional: Stop old docker-compose containers to avoid confusion
# This won't affect Kubernetes pods

echo "🧹 Cleaning up old docker-compose containers..."

# Stop and remove old containers (if any are running)
docker-compose down 2>/dev/null || true

# List any remaining containers with "data236" or "rednest" in the name
echo ""
echo "Old containers (from docker-compose):"
docker ps -a --filter "name=data236" --filter "name=rednest" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "No old containers found"

echo ""
echo "ℹ️  Note: Kubernetes pods (k8s_*) are separate and won't be affected"
echo "   These old containers are safe to remove if you want a clean slate"

