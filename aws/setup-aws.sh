#!/bin/bash

#  AWS Deployment Setup Script
# This script sets up AWS ECR, EKS, and deploys RedNest to AWS

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE} RedNest AWS Deployment Setup${NC}"
echo "=================================="
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED} AWS CLI is not installed.${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED} kubectl is not installed.${NC}"
    echo "Install it from: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

if ! command -v eksctl &> /dev/null; then
    echo -e "${YELLOW} eksctl is not installed.${NC}"
    echo "Installing eksctl..."
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew tap weaveworks/tap
        brew install weaveworks/tap/eksctl
    else
        echo "Please install eksctl: https://github.com/weaveworks/eksctl"
        exit 1
    fi
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED} Docker is not installed.${NC}"
    exit 1
fi

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
echo -e "${YELLOW}🔍 Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED} AWS credentials are invalid.${NC}"
    exit 1
fi
echo -e "${GREEN} AWS credentials verified!${NC}"
echo ""

# Set variables
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
CLUSTER_NAME="rednest-cluster"
NAMESPACE="rednest"

echo -e "${BLUE} Step 1: Setting up ECR (Elastic Container Registry)${NC}"
echo "=================================="

# Create ECR repositories
SERVICES=("auth-service" "traveler-service" "owner-service" "property-service" "booking-service" "ai-agent-service")

for service in "${SERVICES[@]}"; do
    REPO_NAME="rednest-${service}"
    echo -e "${YELLOW}Creating ECR repository: ${REPO_NAME}...${NC}"
    
    if aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${GREEN}Repository ${REPO_NAME} already exists${NC}"
    else
        aws ecr create-repository \
            --repository-name "$REPO_NAME" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        echo -e "${GREEN} Created repository: ${REPO_NAME}${NC}"
    fi
done

echo ""
echo -e "${BLUE}🐳 Step 2: Building and Pushing Docker Images${NC}"
echo "=================================="

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
echo -e "${GREEN} Logged in to ECR${NC}"
echo ""

# Build and push images
echo -e "${YELLOW}Building Docker images...${NC}"
cd "$(dirname "$0")/.."
docker-compose build

echo ""
echo -e "${YELLOW}Pushing images to ECR...${NC}"

for service in "${SERVICES[@]}"; do
    LOCAL_IMAGE="rednest-${service}:latest"
    ECR_IMAGE="${ECR_REGISTRY}/rednest-${service}:latest"
    
    echo -e "${YELLOW}Tagging and pushing ${service}...${NC}"
    docker tag "$LOCAL_IMAGE" "$ECR_IMAGE"
    docker push "$ECR_IMAGE"
    echo -e "${GREEN} Pushed ${service}${NC}"
done

echo ""
echo -e "${BLUE}☸️  Step 3: Creating EKS Cluster${NC}"
echo "=================================="

# Check if cluster exists
if eksctl get cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo -e "${YELLOW}Cluster ${CLUSTER_NAME} already exists${NC}"
    read -p "Do you want to use existing cluster? (y/n): " USE_EXISTING
    if [[ "$USE_EXISTING" != "y" ]]; then
        echo -e "${RED}Please delete the existing cluster first or use a different name${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Creating EKS cluster: ${CLUSTER_NAME}...${NC}"
    echo "This may take 15-20 minutes..."
    
    eksctl create cluster \
        --name "$CLUSTER_NAME" \
        --region "$AWS_REGION" \
        --nodegroup-name rednest-nodes \
        --node-type t3.medium \
        --nodes 2 \
        --nodes-min 2 \
        --nodes-max 4 \
        --managed \
        --with-oidc \
        --ssh-access \
        --full-ecr-access
    
    echo -e "${GREEN} Cluster created!${NC}"
fi

# Update kubeconfig
echo -e "${YELLOW}Updating kubeconfig...${NC}"
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
echo -e "${GREEN} kubeconfig updated${NC}"
echo ""

echo -e "${BLUE} Step 4: Updating Kubernetes Configurations${NC}"
echo "=================================="

# Update deployment files with ECR images
echo -e "${YELLOW}Updating deployment files with ECR image paths...${NC}"

for service in "${SERVICES[@]}"; do
    DEPLOYMENT_FILE="k8s/deployments/${service}-deployment.yaml"
    if [ -f "$DEPLOYMENT_FILE" ]; then
        ECR_IMAGE="${ECR_REGISTRY}/rednest-${service}:latest"
        # Update image in deployment file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|image:.*${service}.*|image: ${ECR_IMAGE}|g" "$DEPLOYMENT_FILE"
        else
            sed -i "s|image:.*${service}.*|image: ${ECR_IMAGE}|g" "$DEPLOYMENT_FILE"
        fi
        echo -e "${GREEN} Updated ${DEPLOYMENT_FILE}${NC}"
    fi
done

echo ""
echo -e "${BLUE} Step 5: Deploying to Kubernetes${NC}"
echo "=================================="

# Create namespace
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Apply secrets (user needs to update these first)
echo -e "${YELLOW}  IMPORTANT: Update k8s/secrets/app-secrets.yaml with your values${NC}"
read -p "Press Enter after updating secrets..."

# Apply secrets
echo -e "${YELLOW}Applying secrets...${NC}"
kubectl apply -f k8s/secrets/app-secrets.yaml

# Apply configmaps
echo -e "${YELLOW}Applying configmaps...${NC}"
kubectl apply -f k8s/configmaps/app-config.yaml

# Create persistent volumes
echo -e "${YELLOW}Creating persistent volumes...${NC}"
kubectl apply -f k8s/persistent-volumes/uploads-pvc.yaml

# Deploy Zookeeper
echo -e "${YELLOW}Deploying Zookeeper...${NC}"
kubectl apply -f k8s/deployments/zookeeper-statefulset.yaml
kubectl apply -f k8s/services/zookeeper-service.yaml

# Wait for Zookeeper
echo -e "${YELLOW}Waiting for Zookeeper to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=zookeeper -n "$NAMESPACE" --timeout=120s

# Deploy Kafka
echo -e "${YELLOW}Deploying Kafka...${NC}"
kubectl apply -f k8s/deployments/kafka-statefulset.yaml
kubectl apply -f k8s/services/kafka-service.yaml

# Wait for Kafka
echo -e "${YELLOW}Waiting for Kafka to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=kafka -n "$NAMESPACE" --timeout=120s

# Deploy services
echo -e "${YELLOW}Deploying microservices...${NC}"
kubectl apply -f k8s/deployments/auth-service-deployment.yaml
kubectl apply -f k8s/services/auth-service-service.yaml

kubectl apply -f k8s/deployments/traveler-service-deployment.yaml
kubectl apply -f k8s/services/traveler-service-service.yaml

kubectl apply -f k8s/deployments/owner-service-deployment.yaml
kubectl apply -f k8s/services/owner-service-service.yaml

kubectl apply -f k8s/deployments/property-service-deployment.yaml
kubectl apply -f k8s/services/property-service-service.yaml

kubectl apply -f k8s/deployments/booking-service-deployment.yaml
kubectl apply -f k8s/services/booking-service-service.yaml

kubectl apply -f k8s/deployments/ai-agent-service-deployment.yaml
kubectl apply -f k8s/services/ai-agent-service-service.yaml

# Wait for deployments
echo -e "${YELLOW}Waiting for all services to be ready...${NC}"
kubectl wait --for=condition=available deployment --all -n "$NAMESPACE" --timeout=300s

# Create Kafka topics
echo -e "${YELLOW}Creating Kafka topics...${NC}"
KAFKA_POD=$(kubectl get pod -l app=kafka -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$KAFKA_POD" ]; then
    kubectl exec -it "$KAFKA_POD" -n "$NAMESPACE" -- kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic booking-requests --partitions 3 --replication-factor 1 || true
    kubectl exec -it "$KAFKA_POD" -n "$NAMESPACE" -- kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic booking-status-updates --partitions 3 --replication-factor 1 || true
    echo -e "${GREEN} Kafka topics created${NC}"
fi

# Apply Ingress
echo -e "${YELLOW}Applying Ingress...${NC}"
kubectl apply -f k8s/ingress/ingress.yaml

echo ""
echo -e "${GREEN} Deployment complete!${NC}"
echo ""
echo -e "${BLUE} Current Status:${NC}"
kubectl get pods -n "$NAMESPACE"
echo ""
echo -e "${BLUE} Services:${NC}"
kubectl get svc -n "$NAMESPACE"
echo ""
echo -e "${BLUE} Persistent Volumes:${NC}"
kubectl get pvc -n "$NAMESPACE"
echo ""
echo -e "${GREEN} RedNest is now running on AWS EKS!${NC}"

