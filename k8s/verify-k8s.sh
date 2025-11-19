#!/bin/bash

# Verify Kubernetes is working after Docker Desktop restart

echo "🔍 Verifying Kubernetes connectivity..."

# Check kubectl connection
if kubectl cluster-info > /dev/null 2>&1; then
    echo "✅ kubectl can connect to Kubernetes"
else
    echo "❌ kubectl cannot connect - Kubernetes may not be ready yet"
    exit 1
fi

# Check nodes
echo ""
echo "📦 Kubernetes Nodes:"
kubectl get nodes

# Check pods in rednest namespace
echo ""
echo "🚀 RedNest Pods:"
kubectl get pods -n rednest

# Check services
echo ""
echo "🌐 RedNest Services:"
kubectl get svc -n rednest

echo ""
echo "✅ Kubernetes is ready!"

