#!/bin/bash

# Delete all Trino resources
kubectl delete deployment trino-coordinator trino-worker -n default 2>/dev/null
kubectl delete configmap trino-coordinator-config trino-worker-config trino-catalog -n default 2>/dev/null
kubectl delete secret postgres-secret mongo-secret -n default 2>/dev/null
kubectl delete service trino trino-worker -n default 2>/dev/null

# Wait for pods to be fully gone
echo "Waiting for pods to terminate..."
sleep 5
kubectl get pods -n default | grep trino

# Recreate coordinator config
echo "Creating coordinator config..."
kubectl create configmap trino-coordinator-config \
  --from-file=config.properties=../trino/etc/coordinator-config.properties \
  --from-file=event-listener.properties=../trino/etc/event-listener.properties \
  --from-file=jvm.config=../trino/etc/jvm.config

# Create worker config
echo "Creating worker config..."
kubectl create configmap trino-worker-config \
  --from-file=config.properties=../trino/etc/worker-config.properties \
  --from-file=jvm.config=../trino/etc/jvm.config

# Catalog is shared
echo "Creating catalog config..."
kubectl create configmap trino-catalog \
  --from-file=../trino/etc/catalog/

# Secrets
echo "Creating secrets..."
kubectl create secret generic postgres-secret --from-literal=password=changeme
kubectl create secret generic mongo-secret --from-literal=password=changeme

# Redeploy Trino with 2 workers
echo "Deploying Trino (1 coordinator + 2 workers)..."
kubectl apply -f trino-deployment2workers.yaml

# Watch it come up
echo "Watching pods start up..."
kubectl get pods -n default -w
