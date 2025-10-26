# Kubernetes Trino Deployment Instructions

## Scaling Trino
```bash
kubectl scale deployment trino --replicas=2 -n default

Kafka Event Outputs

We have 2 files: kafka-1podevents.json and kafka-2podevents.json, from the same SQL query:

SELECT * FROM postgres.public.customers;


Listened on two separate occasions, into kafka-1podevents.json output and kafka-2podevents.json output.

Using this command:

kubectl exec -it kafka-0 -n default -- kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic trino_query_complete \
  --from-beginning > [NAME OF JSON FILE]

Deployment Overview

deployment.yaml deploys Kafka, Zookeeper, Postgres, and MongoDB.

deploy-1worker.sh and deploy-2workers.sh deploy Trino with 1 and 2 workers respectively using their YAML files.

We listened to the same query on both 1 and 2 worker configurations as well:

SELECT * FROM postgres.public.customers;

Switching Between Worker Setups

If you want to switch from 1 worker → 2 workers or 2 → 1:

Run the respective delete script first:

From 1 → 2 workers:

./delete-1worker.sh


From 2 → 1 worker:

./delete-2workers.sh


Then redeploy on port 8080:

./deploy-1worker.sh
# or
./deploy-2workers.sh


Run port-forward to access Trino UI:

kubectl port-forward svc/trino 8080:8080



