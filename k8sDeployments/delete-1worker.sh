#!/bin/bash
NAMESPACE=default

echo "=== 🧹 Deleting old 1-worker Trino resources (if any)... ==="
kubectl delete deployment trino -n $NAMESPACE --ignore-not-found
kubectl delete configmap trino-config trino-catalog -n $NAMESPACE --ignore-not-found
kubectl delete secret postgres-secret mongo-secret -n $NAMESPACE --ignore-not-found
kubectl delete service trino -n $NAMESPACE --ignore-not-found

echo "✅ All 1-worker Trino resources cleaned up."
