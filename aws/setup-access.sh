#!/bin/bash

# Script to setup

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE="rednest"

echo -e "${BLUE}🌐 RedNest Access Setup${NC}"
echo "=========================="
echo ""
echo "Choose access method:"
echo "1) Port-forwarding (easiest, local access)"
echo "2) LoadBalancer (public URL, costs ~$16/month per service)"
echo "3) Ingress with LoadBalancer (one URL for all, recommended)"
echo ""
read -p "Enter choice (1/2/3): " CHOICE

case $CHOICE in
  1)
    echo -e "${YELLOW}Setting up port-forwarding...${NC}"
    echo ""
    echo "You'll need multiple terminals. Starting port-forwards..."
    echo ""
    
    # Create port-forward script
    cat > /tmp/rednest-port-forwards.sh << 'EOF'
#!/bin/bash
# Port-forward all RedNest services

NAMESPACE="rednest"

echo "Starting port-forwards in background..."
echo "Access services at:"
echo "  - Auth: http://localhost:3001"
echo "  - Traveler: http://localhost:3002"
echo "  - Owner: http://localhost:3003"
echo "  - Property: http://localhost:3004"
echo "  - Booking: http://localhost:3005"
echo "  - AI Agent: http://localhost:3006"
echo ""
echo "Press Ctrl+C to stop all port-forwards"
echo ""

# Port-forward in background
kubectl port-forward svc/auth-service 3001:3001 -n $NAMESPACE &
kubectl port-forward svc/traveler-service 3002:3002 -n $NAMESPACE &
kubectl port-forward svc/owner-service 3003:3003 -n $NAMESPACE &
kubectl port-forward svc/property-service 3004:3004 -n $NAMESPACE &
kubectl port-forward svc/booking-service 3005:3005 -n $NAMESPACE &
kubectl port-forward svc/ai-agent-service 3006:3006 -n $NAMESPACE &

# Wait for user interrupt
trap "killall kubectl; exit" INT TERM
wait
EOF
    
    chmod +x /tmp/rednest-port-forwards.sh
    
    echo -e "${GREEN}✅ Port-forward script created: /tmp/rednest-port-forwards.sh${NC}"
    echo ""
    echo "To start port-forwards, run:"
    echo "  /tmp/rednest-port-forwards.sh"
    echo ""
    echo "Or run individually in separate terminals:"
    echo "  kubectl port-forward svc/auth-service 3001:3001 -n rednest"
    echo "  kubectl port-forward svc/property-service 3004:3004 -n rednest"
    echo "  ..."
    ;;
    
  2)
    echo -e "${YELLOW}Setting up LoadBalancers...${NC}"
    echo "This will create a LoadBalancer for each service (~$16/month each)"
    echo ""
    read -p "Continue? (y/n): " CONFIRM
    if [[ "$CONFIRM" != "y" ]]; then
        echo "Cancelled"
        exit 0
    fi
    
    SERVICES=("auth-service:3001" "traveler-service:3002" "owner-service:3003" "property-service:3004" "booking-service:3005" "ai-agent-service:3006")
    
    for svc_port in "${SERVICES[@]}"; do
        IFS=':' read -r svc port <<< "$svc_port"
        echo "Updating $svc to LoadBalancer..."
        kubectl patch svc "$svc" -n "$NAMESPACE" -p '{"spec":{"type":"LoadBalancer"}}'
    done
    
    echo ""
    echo -e "${GREEN}✅ LoadBalancers created!${NC}"
    echo "Waiting for EXTERNAL-IPs to be assigned (2-3 minutes)..."
    echo ""
    
    # Wait and show status
    sleep 30
    kubectl get svc -n "$NAMESPACE" | grep LoadBalancer
    
    echo ""
    echo "Run this command to see URLs:"
    echo "  kubectl get svc -n rednest"
    ;;
    
  3)
    echo -e "${YELLOW}Setting up Ingress with LoadBalancer...${NC}"
    echo ""
    
    # Check if ingress controller exists
    if ! kubectl get svc -n ingress-nginx &> /dev/null; then
        echo "Installing NGINX Ingress Controller..."
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/aws/deploy.yaml
        echo "Waiting for ingress controller to be ready..."
        kubectl wait --namespace ingress-nginx \
          --for=condition=ready pod \
          --selector=app.kubernetes.io/component=controller \
          --timeout=300s
    fi
    
    echo "Applying ingress configuration..."
    kubectl apply -f ../k8s/ingress/ingress.yaml
    
    echo ""
    echo -e "${GREEN}✅ Ingress configured!${NC}"
    echo "Waiting for LoadBalancer IP (2-3 minutes)..."
    echo ""
    
    # Wait and show status
    for i in {1..12}; do
        INGRESS_IP=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        if [ ! -z "$INGRESS_IP" ]; then
            echo -e "${GREEN}✅ Ingress is ready!${NC}"
            echo ""
            echo "Access your app at:"
            echo "  http://$INGRESS_IP"
            echo ""
            echo "API endpoints:"
            echo "  - Auth: http://$INGRESS_IP/api/auth"
            echo "  - Property: http://$INGRESS_IP/api/property"
            echo "  - Booking: http://$INGRESS_IP/api/booking"
            echo "  - Traveler: http://$INGRESS_IP/api/traveler"
            echo "  - Owner: http://$INGRESS_IP/api/owner"
            echo "  - AI Agent: http://$INGRESS_IP/api/ai-agent"
            break
        fi
        echo "Waiting... ($i/12)"
        sleep 10
    done
    
    if [ -z "$INGRESS_IP" ]; then
        echo -e "${YELLOW}⚠️  Ingress IP not ready yet. Check status:${NC}"
        echo "  kubectl get ingress -n rednest"
        echo "  kubectl get svc -n ingress-nginx"
    fi
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"

