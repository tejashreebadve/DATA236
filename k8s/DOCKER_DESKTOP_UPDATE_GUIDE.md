# Docker Desktop Update & Kubernetes Restart Guide

## Step-by-Step Instructions

### 1. Update Docker Desktop
- Open Docker Desktop
- Click on the "New version available" notification (or go to Settings → Software updates)
- Follow the update prompts
- **Wait for the update to complete**

### 2. Restart Docker Desktop
- Quit Docker Desktop completely (right-click Docker icon → Quit)
- Wait 10-15 seconds
- Start Docker Desktop again
- Wait for it to fully start (green "Engine running" indicator)

### 3. Disable and Re-enable Kubernetes
- Go to **Settings** → **Kubernetes**
- Toggle **"Enable Kubernetes"** to **OFF**
- Wait 10 seconds
- Toggle **"Enable Kubernetes"** back to **ON**
- Wait 1-2 minutes for Kubernetes to fully start
- You should see "Kubernetes running" in the status bar

### 4. Verify Kubernetes is Working
Run this command:
```bash
./k8s/verify-k8s.sh
```

You should see:
- ✅ kubectl can connect to Kubernetes
- All pods in "Running" status
- All services listed

### 5. Setup Port-Forwards
Once verification passes:
```bash
./k8s/setup-port-forwards.sh
```

### 6. Test Your Frontend
- Open your browser to `http://localhost:3000`
- You should now see properties on the landing page!

## Troubleshooting

If port-forwards still fail after update:
1. Check if kubectl works: `kubectl get nodes`
2. Check pod status: `kubectl get pods -n rednest`
3. Try manual port-forward: `kubectl port-forward svc/auth-service 3001:3001 -n rednest`
4. Check Docker Desktop logs for any errors

