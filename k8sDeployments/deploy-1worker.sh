#!/bin/bash
set -e  # Exit immediately on error

NAMESPACE=default

# --- Delete all old Trino resources ---
echo "=== 🧹 Deleting old Trino resources (if any)... ==="
kubectl delete deployment trino -n $NAMESPACE --ignore-not-found
kubectl delete configmap trino-config trino-catalog -n $NAMESPACE --ignore-not-found
kubectl delete secret postgres-secret mongo-secret -n $NAMESPACE --ignore-not-found
kubectl delete service trino -n $NAMESPACE --ignore-not-found

# --- Wait for pods to fully terminate ---
echo "Waiting for pods to terminate..."
sleep 5
kubectl get pods -n $NAMESPACE | grep trino || echo "No Trino pods remaining."

# --- Recreate Trino configmaps ---
echo "Creating Trino configmap..."
kubectl create configmap trino-config \
  --from-file=config.properties=../trino/etc/config.properties \
  --from-file=event-listener.properties=../trino/etc/event-listener.properties \
  --from-file=jvm.config=../trino/etc/jvm.config \
  -n $NAMESPACE

echo "Creating catalog config..."
kubectl create configmap trino-catalog \
  --from-file=../trino/etc/catalog/ \
  -n $NAMESPACE

# --- Recreate secrets ---
echo "Creating secrets..."
kubectl create secret generic postgres-secret --from-literal=password=changeme -n $NAMESPACE
kubectl create secret generic mongo-secret --from-literal=password=changeme -n $NAMESPACE

# --- Redeploy Trino ---
echo "Deploying Trino (single coordinator + 1 worker)..."
kubectl apply -f trino-deployment.yaml -n $NAMESPACE

# --- Watch pods start up ---
echo "Watching pods start up..."
kubectl get pods -n $NAMESPACE -w
