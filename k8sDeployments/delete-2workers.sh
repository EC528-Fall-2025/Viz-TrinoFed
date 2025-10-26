#!/bin/bash
NAMESPACE=default

echo "=== 🧹 Deleting old 2-worker Trino resources (if any)... ==="
kubectl delete deployment trino-coordinator trino-worker -n $NAMESPACE --ignore-not-found
kubectl delete configmap trino-coordinator-config trino-worker-config trino-catalog -n $NAMESPACE --ignore-not-found
kubectl delete secret postgres-secret mongo-secret -n $NAMESPACE --ignore-not-found
kubectl delete service trino trino-worker -n $NAMESPACE --ignore-not-found

echo "✅ All 2-worker Trino resources cleaned up."
