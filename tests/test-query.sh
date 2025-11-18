#!/bin/bash

echo "🧪 Testing Trino Query Events System..."
echo ""

echo "1️⃣ Running test query on Trino..."
docker exec -it trino trino --execute "SELECT 1 as test_value"

echo ""
echo "2️⃣ Waiting 5 seconds for Kafka events to be processed..."
sleep 5

echo ""
echo "3️⃣ Checking backend for query events..."
curl -s http://localhost:8080/api/queries/ids | jq '.'

echo ""
echo "4️⃣ Fetching all queries..."
curl -s http://localhost:8080/api/queries | jq '.'

echo ""
echo "✅ Test complete!"
