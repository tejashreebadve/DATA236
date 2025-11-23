#!/bin/bash

# Script to verify EBS volumes are properly configured and bound

set -e

NAMESPACE="rednest"

echo "Verifying EBS Persistent Volumes"
echo "=================================="
echo ""

# Check Persistent Volume Claims
echo "📦 Persistent Volume Claims:"
kubectl get pvc -n "$NAMESPACE"
echo ""

# Check if all PVCs are bound
BOUND_COUNT=$(kubectl get pvc -n "$NAMESPACE" -o jsonpath='{.items[*].status.phase}' | grep -o "Bound" | wc -l | tr -d ' ')
TOTAL_COUNT=$(kubectl get pvc -n "$NAMESPACE" --no-headers | wc -l | tr -d ' ')

if [ "$BOUND_COUNT" -eq "$TOTAL_COUNT" ]; then
    echo " All PVCs are Bound!"
else
    echo " Some PVCs are not bound. Checking details..."
    kubectl get pvc -n "$NAMESPACE" -o wide
fi

echo ""
echo " Persistent Volumes:"
kubectl get pv
echo ""

# Check storage classes
echo " Storage Classes:"
kubectl get storageclass
echo ""

# Check Kafka volume specifically
echo " Kafka Volume Details:"
KAFKA_PVC=$(kubectl get pvc -n "$NAMESPACE" -l app=kafka -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ ! -z "$KAFKA_PVC" ]; then
    kubectl describe pvc "$KAFKA_PVC" -n "$NAMESPACE" | grep -A 10 "Volume:"
else
    echo "  Kafka PVC not found"
fi

echo ""
echo " Verification complete!"

