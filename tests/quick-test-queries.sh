#!/bin/bash

echo "⚡ Quick Test Queries - Generating 5 queries for quick graph visualization..."
echo ""

# Run 5 queries with varying complexity, spaced 8 seconds apart
docker exec trino trino --execute "SELECT 1 as simple_query, current_timestamp" 2>&1 | grep -v "WARNING\|Unable to create"
echo "Query 1/5 complete. Waiting 8 seconds..."
sleep 8

docker exec trino trino --execute "SELECT COUNT(*) as count FROM postgres.public.customers" 2>&1 | grep -v "WARNING\|Unable to create"
echo "Query 2/5 complete. Waiting 8 seconds..."
sleep 8

docker exec trino trino --execute "SELECT name, country FROM postgres.public.customers WHERE country = 'USA'" 2>&1 | grep -v "WARNING\|Unable to create"
echo "Query 3/5 complete. Waiting 8 seconds..."
sleep 8

docker exec trino trino --execute "SELECT c.name, o.product_name, o.price FROM postgres.public.customers c JOIN postgres.public.orders o ON c.id = o.customer_id LIMIT 10" 2>&1 | grep -v "WARNING\|Unable to create"
echo "Query 4/5 complete. Waiting 8 seconds..."
sleep 8

docker exec trino trino --execute "SELECT country, COUNT(*) as customer_count FROM postgres.public.customers GROUP BY country ORDER BY customer_count DESC" 2>&1 | grep -v "WARNING\|Unable to create"
echo "Query 5/5 complete!"

echo ""
echo "✅ Quick test complete! Waiting 5 seconds for events to process..."
sleep 5

QUERY_COUNT=$(curl -s http://localhost:8080/api/queries | jq 'length')
echo "Total queries in system: ${QUERY_COUNT}"
echo ""
echo "Check the Overall Stats page to see your graphs!"

