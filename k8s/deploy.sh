#!/bin/bash

# RedNest Kubernetes Deployment Script
# This script deploys all RedNest microservices to Kubernetes

set -e

echo "🚀 Starting RedNest Kubernetes Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker images are built
echo -e "${YELLOW}⚠️  Make sure you have built all Docker images:${NC}"
echo "   docker-compose build"
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Create namespace
echo -e "${GREEN}📦 Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Create secrets (update with your actual values first!)
echo -e "${YELLOW}⚠️  Updating secrets...${NC}"
echo -e "${YELLOW}   Please update k8s/secrets/app-secrets.yaml with your actual values before proceeding!${NC}"
read -p "Press Enter to continue after updating secrets..."

# Apply secrets
echo -e "${GREEN}🔐 Creating secrets...${NC}"
kubectl apply -f k8s/secrets/app-secrets.yaml

# Apply configmaps
echo -e "${GREEN}⚙️  Creating configmaps...${NC}"
kubectl apply -f k8s/configmaps/app-config.yaml

# Create persistent volumes
echo -e "${GREEN}💾 Creating persistent volumes...${NC}"
kubectl apply -f k8s/persistent-volumes/uploads-pvc.yaml

# Deploy Zookeeper
echo -e "${GREEN}🦓 Deploying Zookeeper...${NC}"
kubectl apply -f k8s/deployments/zookeeper-statefulset.yaml
kubectl apply -f k8s/services/zookeeper-service.yaml

# Wait for Zookeeper to be ready
echo -e "${YELLOW}⏳ Waiting for Zookeeper to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=zookeeper -n rednest --timeout=120s

# Deploy Kafka
echo -e "${GREEN}📨 Deploying Kafka...${NC}"
kubectl apply -f k8s/deployments/kafka-statefulset.yaml
kubectl apply -f k8s/services/kafka-service.yaml

# Wait for Kafka to be ready
echo -e "${YELLOW}⏳ Waiting for Kafka to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=kafka -n rednest --timeout=120s

# Deploy services
echo -e "${GREEN}🔧 Deploying microservices...${NC}"

# Auth Service
kubectl apply -f k8s/deployments/auth-service-deployment.yaml
kubectl apply -f k8s/services/auth-service-service.yaml

# Traveler Service
kubectl apply -f k8s/deployments/traveler-service-deployment.yaml
kubectl apply -f k8s/services/traveler-service-service.yaml

# Owner Service
kubectl apply -f k8s/deployments/owner-service-deployment.yaml
kubectl apply -f k8s/services/owner-service-service.yaml

# Property Service
kubectl apply -f k8s/deployments/property-service-deployment.yaml
kubectl apply -f k8s/services/property-service-service.yaml

# Booking Service
kubectl apply -f k8s/deployments/booking-service-deployment.yaml
kubectl apply -f k8s/services/booking-service-service.yaml

# AI Agent Service
kubectl apply -f k8s/deployments/ai-agent-service-deployment.yaml
kubectl apply -f k8s/services/ai-agent-service-service.yaml

# Wait for all deployments to be ready
echo -e "${YELLOW}⏳ Waiting for all services to be ready...${NC}"
kubectl wait --for=condition=available deployment --all -n rednest --timeout=300s

# Create Kafka topics (if needed)
echo -e "${GREEN}📝 Setting up Kafka topics...${NC}"
KAFKA_POD=$(kubectl get pod -l app=kafka -n rednest -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$KAFKA_POD" ]; then
    kubectl exec -it $KAFKA_POD -n rednest -- kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic booking-requests --partitions 3 --replication-factor 1 || true
    kubectl exec -it $KAFKA_POD -n rednest -- kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic booking-status-updates --partitions 3 --replication-factor 1 || true
fi

# Apply Ingress (if ingress controller is installed)
echo -e "${GREEN}🌐 Applying Ingress configuration...${NC}"
kubectl apply -f k8s/ingress/ingress.yaml

# Display status
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Current status:${NC}"
kubectl get pods -n rednest
echo ""
echo -e "${YELLOW}📡 Services:${NC}"
kubectl get svc -n rednest
echo ""
echo -e "${GREEN}🎉 RedNest is now running on Kubernetes!${NC}"

