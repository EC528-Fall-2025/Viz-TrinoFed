# Test Query Scripts for Graph Visualization

These scripts generate multiple Trino queries over time to populate the graphs on the Overall Stats page with time-series data.

## 📊 Available Scripts

### 1. `quick-test-queries.sh` - Quick Start (5 queries)
**Best for:** Quick testing and seeing immediate results

Runs 5 queries with varying complexity, spaced 8 seconds apart:
- Simple SELECT
- PostgreSQL COUNT
- PostgreSQL with WHERE filter
- PostgreSQL JOIN
- Aggregation query

**Usage:**
```bash
./tests/quick-test-queries.sh
```

**Duration:** ~45 seconds

---

### 2. `generate-test-queries.sh` - Comprehensive (15 queries)
**Best for:** Full graph visualization with rich data points

Runs 15 queries with varying complexity and execution times:
- Simple queries (fast, low CPU)
- PostgreSQL queries (various complexity)
- MongoDB queries
- Federated queries (cross-database)
- Complex aggregations
- Window functions
- Multiple JOINs

**Usage:**
```bash
./tests/generate-test-queries.sh
```

**Duration:** ~2-3 minutes

---

### 3. `test-query.sh` - Single Query Test
**Best for:** Verifying the system is working

Runs a single simple query to test the end-to-end flow.

**Usage:**
```bash
./tests/test-query.sh
```

**Duration:** ~10 seconds

---

## 🎯 What Metrics Are Captured?

Each query generates data points for these graphs:

1. **Duration (ms)** - Total execution time
2. **CPU Time (ms)** - CPU processing time
3. **Peak Memory (bytes)** - Maximum memory usage
4. **Total Rows** - Number of rows returned

## 📈 Viewing the Results

After running any script:

1. Open the **Overall Stats** page in your browser
2. The graphs will automatically update every 3 seconds
3. You'll see time-series data showing:
   - Query execution patterns over time
   - Performance trends
   - Resource usage patterns

## 🔄 Continuous Data Generation

To continuously generate data for testing:

```bash
# Run the comprehensive script in a loop
while true; do
  ./tests/generate-test-queries.sh
  echo "Waiting 30 seconds before next batch..."
  sleep 30
done
```

## 🛠️ Prerequisites

Before running these scripts, ensure:

1. **Docker containers are running:**
   ```bash
   docker-compose ps
   # Should show: kafka, zookeeper, trino, postgresql, mongodb
   ```

2. **Backend is running:**
   ```bash
   curl http://localhost:8080/api/queries
   # Should return JSON (even if empty array)
   ```

3. **Sample data is loaded:**
   ```bash
   docker exec trino trino --execute "SELECT COUNT(*) FROM postgres.public.customers"
   # Should return: "5"
   ```

## 📝 Query Types Included

The comprehensive script includes:

- **Simple SELECTs** - Fast queries, baseline metrics
- **PostgreSQL queries** - Single table operations
- **MongoDB queries** - Document database operations
- **JOINs** - Multi-table operations (higher CPU)
- **Aggregations** - GROUP BY operations (moderate CPU)
- **Federated queries** - Cross-database operations (more complex)
- **Window functions** - Advanced SQL features (CPU intensive)
- **Complex analytics** - Multiple operations combined

## 🎨 Graph Features

The graphs will show:

- **X-axis:** Time (when queries were executed)
- **Y-axis:** Metric values (duration, CPU, memory, rows)
- **Data points:** Each query execution
- **Trends:** Performance patterns over time

## 💡 Tips

1. **For best visualization:** Run `generate-test-queries.sh` to get 15+ data points
2. **For quick testing:** Use `quick-test-queries.sh` for immediate feedback
3. **For continuous monitoring:** Run scripts in a loop to simulate ongoing query workload
4. **Refresh graphs:** The Overall Stats page auto-refreshes every 3 seconds

## 🐛 Troubleshooting

**No queries appearing in graphs:**
- Check backend is running: `curl http://localhost:8080/api/queries`
- Check Kafka is running: `docker ps | grep kafka`
- Wait a few seconds for events to process

**Graphs showing zero values:**
- Some simple queries may have very low metrics
- Run the comprehensive script for queries with more variation
- Check query events have statistics: `curl http://localhost:8080/api/queries | jq '.[0].events[0].statistics'`

**Queries not executing:**
- Verify Trino is healthy: `docker exec trino trino --execute "SELECT 1"`
- Check Docker containers: `docker ps`
- Review Trino logs: `docker logs trino`

