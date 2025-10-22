# 🧪 Testing Guide

This guide shows you how to test the complete Kafka-integrated backend with sample data.

---

## ✅ Prerequisites Check

Before testing, verify everything is running:

```bash
# Check Docker containers (should show 5 containers)
docker ps

# Expected output:
# - kafka
# - zookeeper
# - postgresql
# - mongodb
# - trino
```

```bash
# Check backend is running (should return 200)
curl -I http://localhost:8080/api/queries
```

---

## 🎯 Test 1: Basic System Test (Quickest)

Run the automated test script:

```bash
./test-query.sh
```

**Expected Output:**
```
🧪 Testing Trino Query Events System...

1️⃣ Running test query on Trino...
"1"

2️⃣ Waiting 5 seconds for Kafka events to be processed...

3️⃣ Checking backend for query events...
[
  "20251002_XXXXXX_XXXXX_XXXXX"
]

4️⃣ Fetching all queries...
[
  {
    "queryId": "20251002_XXXXXX_XXXXX_XXXXX",
    "query": "SELECT 1 as test_value",
    "state": "FINISHED",
    ...
  }
]

✅ Test complete!
```

**✅ Success:** If you see a query ID and full query details, the system is working!

---

## 🗄️ Test 2: PostgreSQL Sample Data

### Step 1: Check if data was loaded

```bash
docker exec trino trino --execute "SELECT COUNT(*) FROM postgres.public.customers"
```

**Expected Output:**
```
"5"
```

### Step 2: Query customer data

```bash
docker exec trino trino --execute "
SELECT name, email, city, country
FROM postgres.public.customers
"
```

**Expected Output:**
```
"John Doe","john.doe@email.com","New York","USA"
"Jane Smith","jane.smith@email.com","London","UK"
"Bob Johnson","bob.johnson@email.com","Toronto","Canada"
"Alice Brown","alice.brown@email.com","Sydney","Australia"
"Charlie Wilson","charlie.wilson@email.com","Berlin","Germany"
```

### Step 3: Check backend captured the query

```bash
# Wait a moment for processing
sleep 3

# Check query IDs
curl http://localhost:8080/api/queries/ids | jq '.'
```

**Expected:** You should see the query ID from step 2

```bash
# Get full query details
curl http://localhost:8080/api/queries | jq '.[-1].query'
```

**Expected:** Should show the SELECT query you just ran

---

## 📦 Test 3: MongoDB Sample Data

### Step 1: Check MongoDB products

```bash
docker exec trino trino --execute "
SELECT name, brand, price, instock
FROM mongodb.sample_db.products
"
```

**Expected Output:**
```
"Laptop","TechCorp","999.99","true"
"Mouse","TechCorp","25.5","true"
"Keyboard","KeyMaster","75.0","true"
"Monitor","ViewTech","299.99","true"
"Webcam","CamTech","89.99","false"
```

### Step 2: Query product reviews

```bash
docker exec trino trino --execute "
SELECT productname, rating, comment
FROM mongodb.sample_db.reviews
WHERE rating >= 5
"
```

**Expected Output:**
```
"Laptop","5","Excellent laptop, very fast and reliable!"
"Keyboard","5","Amazing mechanical keyboard, great for gaming!"
"Laptop","5","Perfect for work and development. Highly recommended!"
```

---

## 🔗 Test 4: Federated Query (PostgreSQL + MongoDB)

This is the **killer feature** - querying across different databases!

```bash
docker exec trino trino --execute "
SELECT
    c.name as customer_name,
    c.country,
    o.product_name,
    o.quantity,
    p.brand,
    p.price as current_price
FROM postgres.public.customers c
JOIN postgres.public.orders o ON c.id = o.customer_id
LEFT JOIN mongodb.sample_db.products p ON LOWER(o.product_name) = LOWER(p.name)
ORDER BY c.name
LIMIT 5
"
```

**Expected Output:**
```
"Alice Brown","Australia","Headphones",1,NULL,NULL
"Alice Brown","Australia","Wireless Charger",1,NULL,NULL
"Bob Johnson","Canada","Monitor",1,"ViewTech","299.99"
"Bob Johnson","Canada","Webcam",1,"CamTech","89.99"
"Charlie Wilson","Germany","Tablet",1,NULL,NULL
```

### Verify it was captured:

```bash
sleep 3
curl http://localhost:8080/api/queries | jq '.[-1] | {query, state, queryId}'
```

**Expected:** Should show the federated query with state "FINISHED"

---

## 📊 Test 5: Complex Analytics Query

Test a more complex query that triggers the backend to capture detailed metrics:

```bash
docker exec trino trino --execute "
WITH customer_spending AS (
    SELECT
        c.name,
        c.country,
        SUM(o.price * o.quantity) as total_spent,
        COUNT(o.id) as order_count
    FROM postgres.public.customers c
    JOIN postgres.public.orders o ON c.id = o.customer_id
    GROUP BY c.name, c.country
),
high_rated_products AS (
    SELECT
        productname,
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
    FROM mongodb.sample_db.reviews
    GROUP BY productname
    HAVING AVG(rating) >= 4.5
)
SELECT
    cs.name,
    cs.country,
    cs.total_spent,
    cs.order_count
FROM customer_spending cs
ORDER BY cs.total_spent DESC
"
```

**Expected Output:**
```
"John Doe","USA","1089.94","3"
"Alice Brown","Australia","546.97","2"
"Charlie Wilson","Germany","399.99","1"
"Bob Johnson","Canada","389.98","2"
"Jane Smith","UK","122.97","2"
```

### Check backend metrics:

```bash
sleep 3
curl http://localhost:8080/api/queries | jq '.[-1] | {
    queryId,
    state,
    cpuTimeMs,
    wallTimeMs,
    completedSplits,
    plan: (.plan[:100] + "...")
}'
```

**Expected:** Should show performance metrics like CPU time, wall time, etc.

---

## 🔍 Test 6: API Endpoint Testing

### Test all API endpoints:

#### 1. Get all query IDs
```bash
curl http://localhost:8080/api/queries/ids | jq '.'
```

**Expected:** Array of query IDs
```json
[
  "20251002_200813_00003_sb834",
  "20251002_201234_00004_sb834",
  ...
]
```

#### 2. Get all queries with details
```bash
curl http://localhost:8080/api/queries | jq 'length'
```

**Expected:** Number showing total queries captured

#### 3. Get specific query by ID
```bash
# Get the first query ID
QUERY_ID=$(curl -s http://localhost:8080/api/queries/ids | jq -r '.[0]')

# Fetch that specific query
curl "http://localhost:8080/api/queries/$QUERY_ID" | jq '{
    queryId,
    query,
    state,
    user,
    startTime,
    endTime
}'
```

**Expected:** Full details of that specific query

---

## 🎨 Test 7: Multiple Queries in Sequence

Run multiple queries and watch them appear in the backend:

```bash
# Query 1: Simple SELECT
docker exec trino trino --execute "SELECT 'Test 1' AS message"

# Query 2: PostgreSQL aggregation
docker exec trino trino --execute "
SELECT country, COUNT(*) as customer_count
FROM postgres.public.customers
GROUP BY country
"

# Query 3: MongoDB filter
docker exec trino trino --execute "
SELECT name, price
FROM mongodb.sample_db.products
WHERE instock = true
"

# Wait for processing
sleep 5

# Check all captured queries
curl http://localhost:8080/api/queries | jq '[.[] | {query: .query[:50], state}]'
```

**Expected:** All 3 queries should appear with state "FINISHED"

---

## 🚨 Test 8: Error Handling (Intentional Failures)

Test that the backend captures failed queries:

```bash
# Try a query with invalid syntax
docker exec trino trino --execute "SELECT * FROM nonexistent.table.name" 2>&1 || echo "Query failed as expected"

sleep 3

# Check if the failed query was captured
curl http://localhost:8080/api/queries | jq '.[-1] | {query, state, errorMessage}'
```

**Expected:** Should show state as "FAILED" with error details

---

## 🔄 Test 9: Real-time Updates Test

Test that queries appear immediately:

```bash
# Terminal 1: Watch the API in real-time
watch -n 2 'curl -s http://localhost:8080/api/queries/ids | jq "length"'

# Terminal 2: Run queries
docker exec trino trino --execute "SELECT 'Query 1'"
docker exec trino trino --execute "SELECT 'Query 2'"
docker exec trino trino --execute "SELECT 'Query 3'"
```

**Expected:** The count should increase by 3 (one for each query)

---

## 📈 Test 10: Performance Test

Run multiple queries quickly:

```bash
for i in {1..10}; do
    docker exec trino trino --execute "SELECT $i AS query_number, current_timestamp" &
done
wait

sleep 5

# Check that all 10 were captured
curl http://localhost:8080/api/queries | jq '[.[] | select(.query | contains("query_number"))] | length'
```

**Expected:** Should show 10 (all queries captured)

---

## ✅ Success Criteria

Your system is **fully working** if:

- ✅ `./test-query.sh` completes successfully
- ✅ PostgreSQL queries return customer data
- ✅ MongoDB queries return product data
- ✅ Federated queries join both databases
- ✅ All queries appear in `/api/queries`
- ✅ Query states show "FINISHED" or "FAILED"
- ✅ Performance metrics are captured (CPU time, wall time)

---

## 🐛 Troubleshooting

### No queries appearing in backend?

**Check 1: Is backend running?**
```bash
curl -I http://localhost:8080/api/queries
# Should return "HTTP/1.1 200"
```

**Check 2: Is Kafka receiving events?**
```bash
docker logs trino | grep -i kafka | tail -5
# Should show "Published event" messages
```

**Check 3: Is backend consuming from Kafka?**
```bash
docker logs -f $(docker ps -q --filter ancestor=trinodb/trino) &
docker exec trino trino --execute "SELECT 1"
# Watch for Kafka publish messages
```

### PostgreSQL data not loading?

```bash
# Check if init script ran
docker logs postgresql | grep -i "database system is ready"

# Manually check data
docker exec postgresql psql -U postgres -d testdb -c "SELECT COUNT(*) FROM customers;"
```

### MongoDB data not loading?

```bash
# Check if init script ran
docker logs mongodb | grep -i "initialized"

# Manually check data
docker exec mongodb mongosh -u admin -p password --eval "db.getSiblingDB('sample_db').products.count()"
```

---

## 🎓 Next Steps

After successful testing:

1. ✅ Create visualizations in frontend
2. ✅ Add query filtering and search
3. ✅ Implement WebSocket for real-time updates
4. ✅ Parse execution plans for tree visualization
5. ✅ Add performance dashboards

---

## 📞 Need Help?

If tests fail:
1. Check the Troubleshooting section above
2. Review `SETUP.md` for configuration
3. Check Docker logs: `docker logs <container_name>`
4. Verify all services are running: `docker ps`
