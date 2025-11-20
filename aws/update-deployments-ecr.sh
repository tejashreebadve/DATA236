#!/bin/bash

# Script to update all Kubernetes deployment files with ECR image paths

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./update-deployments-ecr.sh <AWS_ACCOUNT_ID> <AWS_REGION>"
    echo "Example: ./update-deployments-ecr.sh 123456789012 us-east-1"
    exit 1
fi

AWS_ACCOUNT_ID=$1
AWS_REGION=$2
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

SERVICES=("auth-service" "traveler-service" "owner-service" "property-service" "booking-service" "ai-agent-service")

echo "Updating deployment files with ECR image paths..."
echo "ECR Registry: ${ECR_REGISTRY}"
echo ""

for service in "${SERVICES[@]}"; do
    DEPLOYMENT_FILE="../k8s/deployments/${service}-deployment.yaml"
    if [ -f "$DEPLOYMENT_FILE" ]; then
        ECR_IMAGE="${ECR_REGISTRY}/rednest-${service}:latest"
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|image:.*rednest-${service}.*|image: ${ECR_IMAGE}|g" "$DEPLOYMENT_FILE"
        else
            # Linux
            sed -i "s|image:.*rednest-${service}.*|image: ${ECR_IMAGE}|g" "$DEPLOYMENT_FILE"
        fi
        
        echo "✅ Updated ${DEPLOYMENT_FILE}"
    else
        echo "⚠️  File not found: ${DEPLOYMENT_FILE}"
    fi
done

echo ""
echo "✅ All deployment files updated!"

