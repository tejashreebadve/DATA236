#!/bin/bash

# RedNest AWS Demo Deployment - Lightweight & Low Cost
# Optimized for demo purposes with minimal resources

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 RedNest AWS Demo Deployment (Lightweight)${NC}"
echo "=============================================="
echo ""

# Check prerequisites
echo -e "${YELLOW} Checking prerequisites...${NC}"

for cmd in aws kubectl eksctl docker; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED} $cmd is not installed.${NC}"
        exit 1
    fi
done

echo -e "${GREEN} All prerequisites met!${NC}"
echo ""

# Get AWS credentials
echo -e "${YELLOW} AWS Configuration${NC}"
read -p "Enter AWS Account ID: " AWS_ACCOUNT_ID
read -p "Enter AWS Region (e.g., us-east-1): " AWS_REGION
read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""

# Configure AWS CLI
echo -e "${YELLOW}  Configuring AWS CLI...${NC}"
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"
aws configure set output json

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED} AWS credentials are invalid.${NC}"
    exit 1
fi
echo -e "${GREEN} AWS credentials verified!${NC}"
echo ""

# Set variables
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
CLUSTER_NAME="rednest-demo-cluster"
NAMESPACE="rednest"

echo -e "${BLUE}📦 Step 1: Setting up ECR${NC}"
echo "=================================="

SERVICES=("auth-service" "traveler-service" "owner-service" "property-service" "booking-service" "ai-agent-service")

for service in "${SERVICES[@]}"; do
    REPO_NAME="rednest-${service}"
    if aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${GREEN}Repository ${REPO_NAME} exists${NC}"
    else
        aws ecr create-repository \
            --repository-name "$REPO_NAME" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        echo -e "${GREEN} Created ${REPO_NAME}${NC}"
    fi
done

echo ""
echo -e "${BLUE}🐳 Step 2: Building and Pushing Images${NC}"
echo "=================================="

# Login to ECR
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
cd "$(dirname "$0")/.."
docker-compose build

# Push images
echo -e "${YELLOW}Pushing images to ECR...${NC}"
for service in "${SERVICES[@]}"; do
    LOCAL_IMAGE="rednest-${service}:latest"
    ECR_IMAGE="${ECR_REGISTRY}/rednest-${service}:latest"
    docker tag "$LOCAL_IMAGE" "$ECR_IMAGE"
    docker push "$ECR_IMAGE"
    echo -e "${GREEN} Pushed ${service}${NC}"
done

echo ""
echo -e "${BLUE}☸️  Step 3: Creating EKS Cluster (Minimal)${NC}"
echo "=================================="
echo -e "${YELLOW}Using t3.small instances (2 vCPU, 2GB RAM) - minimal cost${NC}"

# Check if cluster exists
if eksctl get cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo -e "${YELLOW}Cluster ${CLUSTER_NAME} already exists${NC}"
    read -p "Use existing cluster? (y/n): " USE_EXISTING
    if [[ "$USE_EXISTING" != "y" ]]; then
        echo -e "${RED}Please delete the existing cluster first${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Creating minimal EKS cluster (takes ~15 minutes)...${NC}"
    eksctl create cluster \
        --name "$CLUSTER_NAME" \
        --region "$AWS_REGION" \
        --nodegroup-name rednest-demo-nodes \
        --node-type t3.small \
        --nodes 1 \
        --nodes-min 1 \
        --nodes-max 1 \
        --managed \
        --with-oidc \
        --full-ecr-access
    
    echo -e "${GREEN} Cluster created!${NC}"
fi

# Update kubeconfig
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
echo -e "${GREEN} kubeconfig updated${NC}"
echo ""

echo -e "${BLUE} Step 4: Updating Deployment Files${NC}"
echo "=================================="

# Update deployment files with ECR images
for service in "${SERVICES[@]}"; do
    DEPLOYMENT_FILE="k8s/deployments/${service}-deployment.yaml"
    if [ -f "$DEPLOYMENT_FILE" ]; then
        ECR_IMAGE="${ECR_REGISTRY}/rednest-${service}:latest"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|image:.*${service}.*|image: ${ECR_IMAGE}|g" "$DEPLOYMENT_FILE"
        else
            sed -i "s|image:.*${service}.*|image: ${ECR_IMAGE}|g" "$DEPLOYMENT_FILE"
        fi
    fi
done
echo -e "${GREEN} Deployment files updated${NC}"
echo ""

echo -e "${BLUE}🚀 Step 5: Deploying to Kubernetes${NC}"
echo "=================================="

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply secrets
echo -e "${YELLOW}  Make sure k8s/secrets/app-secrets.yaml is updated!${NC}"
read -p "Press Enter after updating secrets..."

kubectl apply -f k8s/secrets/app-secrets.yaml
kubectl apply -f k8s/configmaps/app-config.yaml
kubectl apply -f k8s/persistent-volumes/uploads-pvc.yaml

# Deploy Zookeeper
echo -e "${YELLOW}Deploying Zookeeper...${NC}"
kubectl apply -f k8s/deployments/zookeeper-statefulset.yaml
kubectl apply -f k8s/services/zookeeper-service.yaml
kubectl wait --for=condition=ready pod -l app=zookeeper -n "$NAMESPACE" --timeout=120s

# Deploy Kafka
echo -e "${YELLOW}Deploying Kafka...${NC}"
kubectl apply -f k8s/deployments/kafka-statefulset.yaml
kubectl apply -f k8s/services/kafka-service.yaml
kubectl wait --for=condition=ready pod -l app=kafka -n "$NAMESPACE" --timeout=120s

# Deploy all services
echo -e "${YELLOW}Deploying microservices...${NC}"
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

# Wait for deployments
kubectl wait --for=condition=available deployment --all -n "$NAMESPACE" --timeout=300s

# Create Kafka topics
echo -e "${YELLOW}Creating Kafka topics...${NC}"
KAFKA_POD=$(kubectl get pod -l app=kafka -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$KAFKA_POD" ]; then
    kubectl exec -it "$KAFKA_POD" -n "$NAMESPACE" -- \
        kafka-topics --create --if-not-exists \
        --bootstrap-server localhost:9092 \
        --topic booking-requests --partitions 3 --replication-factor 1 || true
    kubectl exec -it "$KAFKA_POD" -n "$NAMESPACE" -- \
        kafka-topics --create --if-not-exists \
        --bootstrap-server localhost:9092 \
        --topic booking-status-updates --partitions 3 --replication-factor 1 || true
fi

# Apply Ingress
kubectl apply -f k8s/ingress/ingress.yaml

echo ""
echo -e "${GREEN} Demo deployment complete!${NC}"
echo ""
echo -e "${BLUE} Status:${NC}"
kubectl get pods -n "$NAMESPACE"
echo ""
echo -e "${BLUE} Storage:${NC}"
kubectl get pvc -n "$NAMESPACE"
echo ""
echo -e "${GREEN} RedNest demo is ready!${NC}"
echo ""
echo -e "${YELLOW} Estimated Cost: ~$50-60/month${NC}"
echo "   - EKS Control Plane: ~$73/month"
echo "   - EC2 t3.small (1 node): ~$15/month"
echo "   - EBS Volumes (~10Gi total): ~$1/month"
echo "   - ECR: Free tier (500GB)"
echo ""
echo -e "${YELLOW} To reduce costs further, delete cluster after demo:${NC}"
echo "   eksctl delete cluster --name $CLUSTER_NAME --region $AWS_REGION"

