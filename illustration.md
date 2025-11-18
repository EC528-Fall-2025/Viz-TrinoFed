# 🚀 Viz-TrinoFed: Complete Setup & JSON Plan Parsing Guide

This comprehensive guide walks you through starting the Viz-TrinoFed project from scratch and demonstrates the JSON Plan Parsing implementation that transforms Trino query execution plans into interactive visualizations.

**Last Updated:** October 26, 2025
**Status:** Production Ready

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Docker Desktop** installed and running
- ✅ **Java 22** installed (verify: `/usr/libexec/java_home -v 22`)
- ✅ **Node.js and npm** installed (verify: `node -v && npm -v`)
- ✅ **Project cloned** to `/Users/lizhengyuan/Viz-TrinoFed`
- ✅ **Dependencies installed** (run: `npm install` in project root)

---

## 🎯 System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Browser (localhost:5173)                       │
│                   Interactive Tree Visualization                  │
└─────────────────────────┬────────────────────────────────────────┘
                          │ REST API / WebSocket
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│              Backend - Spring Boot (Port 8080)                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  QueryEventService                                         │  │
│  │  └─> buildTreeFromEvents()                                │  │
│  │      └─> Check for jsonPlan field                         │  │
│  │          └─> If exists: QueryPlanParser.parseJsonPlan()   │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                       │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │  QueryPlanParser (KEY COMPONENT)                          │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ parseJsonPlan(String jsonPlan)                       │ │  │
│  │  │  1. Parse JSON → Map<String, PlanNode>              │ │  │
│  │  │  2. Extract root fragment (usually "0")             │ │  │
│  │  │  3. convertPlanNodeToTreeNode() recursively         │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ convertPlanNodeToTreeNode(PlanNode, fragmentId)     │ │  │
│  │  │  1. Set id, operatorType, nodeType                  │ │  │
│  │  │  2. Extract descriptor (table info)                 │ │  │
│  │  │  3. Extract outputs (columns)                       │ │  │
│  │  │  4. Extract estimates → SET METRICS:                │ │  │
│  │  │     • outputRows = parseToLong(outputRowCount)      │ │  │
│  │  │     • outputBytes = parseToLong(outputSizeInBytes)  │ │  │
│  │  │     • cpuTime = parseToLong(cpuCost)                │ │  │
│  │  │     • memoryBytes = parseToLong(memoryCost)         │ │  │
│  │  │  5. Recursively process children                    │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │ parseToLong(Object value)                           │ │  │
│  │  │  • Handles: Number, String, "NaN", "Infinity"      │ │  │
│  │  │  • Converts to Long or returns null                │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────────────┘
                          │ Kafka Consumer
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Kafka Event Stream (Port 9092)                    │
│          QueryCreatedEvent / QueryCompletedEvent                  │
│                  (includes jsonPlan field)                        │
└─────────────────────────┬────────────────────────────────────────┘
                          │ Event Listener
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                Trino Query Engine (Port 8081)                     │
│         Executes queries, generates JSON execution plans          │
└────────────┬─────────────────────────┬─────────────────────────┘
             │                         │
             ▼                         ▼
  ┌───────────────────┐    ┌──────────────────┐
  │   PostgreSQL      │    │    MongoDB       │
  │   Port: 5433      │    │   Port: 27018    │
  │ Catalog: postgres │    │ Catalog: mongodb │
  └───────────────────┘    └──────────────────┘
```

---

## 🚀 Part 1: Starting the Project from Beginning

### **Step 1: Open Docker Desktop**

```bash
# Open Docker Desktop
open -a Docker

# Wait 10-15 seconds for Docker to start

# Verify Docker is running
docker info
```

**Expected:** Docker system information displays without errors.

---

### **Step 2: Start Docker Infrastructure**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose up -d
```

**This starts:**
- 🔧 Zookeeper (Kafka dependency)
- 📨 Kafka (Event streaming on port 9092)
- 🐘 PostgreSQL (Database on port 5433)
- 🍃 MongoDB (Database on port 27018)
- 🚀 Trino (Query engine on port 8081)

**Verify all containers are running:**

```bash
docker-compose ps
```

**Expected output:**
```
NAME         IMAGE                             STATUS
kafka        confluentinc/cp-kafka:7.6.1       Up
mongodb      mongo:6.0                         Up
postgresql   postgres:15                       Up
trino        trinodb/trino:latest              Up (healthy)
zookeeper    confluentinc/cp-zookeeper:7.6.1   Up
```

**Wait for Trino to be ready (30-60 seconds):**

```bash
# Check Trino status
curl http://localhost:8081/v1/info/state

# Should return: "ACTIVE"
```

---

### **Step 3: Start the Backend (Spring Boot)**

**Open a NEW terminal window:**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed/backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run
```

**What's happening:**
- Compiles Java code
- Starts Spring Boot application
- Connects to Kafka
- Begins consuming query events
- Starts REST API on port 8080

**Look for these logs:**
```
INFO ... Started TrinoKafkaParserApplication in X.XXX seconds
INFO ... Tomcat started on port(s): 8080 (http)
INFO ... Kafka consumer subscribed to topics: [trino-query-events]
```

**Verify backend is running:**

```bash
# In another terminal
curl http://localhost:8080/api/queries

# Should return: [] or list of queries
```

**⚠️ Keep this terminal open!**

---

### **Step 4: Start the Frontend (React + Vite)**

**Open ANOTHER NEW terminal window:**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed
npm run dev
```

**What's happening:**
- Starts Vite development server
- Compiles React application
- Enables hot module replacement (HMR)
- Serves on port 5173

**Look for:**
```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Verify frontend is running:**

```bash
# In another terminal
curl http://localhost:5173 | head -20

# Should return: HTML content
```

**⚠️ Keep this terminal open!**

---

### **Step 5: Access the Application**

**Open your browser:**

```bash
open http://localhost:5173
```

Or navigate to: **http://localhost:5173**

**You should see:**
- Database nodes on the left (if any queries have been run)
- Empty visualization (no queries yet)
- Controls at the bottom left

---

## 📊 Part 2: Understanding JSON Plan Parsing

Before we test queries, let's understand how JSON Plan Parsing works.

### **What is JSON Plan Parsing?**

When you execute a query in Trino:
1. Trino creates an **execution plan** (how it will execute your query)
2. This plan is a **tree structure** of operators (TableScan, Join, Filter, etc.)
3. Trino can export this as **JSON format**
4. Our backend **parses this JSON** and extracts:
   - Operator types (what operations are performed)
   - Cost estimates (rows, bytes, CPU, memory)
   - Parent-child relationships (tree structure)
   - Table metadata (which tables are accessed)

### **The Parsing Flow**

```
User executes query in Trino
          ↓
Trino generates execution plan
          ↓
Trino's Kafka Event Listener publishes event
          ↓
Event contains: {
  queryId: "20251026_...",
  query: "SELECT * FROM ...",
  state: "FINISHED",
  jsonPlan: "{...}"  ← THE KEY FIELD
}
          ↓
Backend's TrinoEventConsumer receives event
          ↓
QueryEventService.buildTreeFromEvents()
   ├─ Checks if jsonPlan exists
   └─ Calls QueryPlanParser.parseJsonPlan(jsonPlan)
          ↓
QueryPlanParser.parseJsonPlan()
   ├─ Parses JSON string → Map<String, PlanNode>
   ├─ Gets root fragment (fragment "0")
   └─ Recursively converts to QueryTreeNode
          ↓
convertPlanNodeToTreeNode(PlanNode, fragmentId)
   ├─ Extracts operator type (e.g., "TableScan")
   ├─ Extracts cost estimates:
   │   ├─ outputRows = parseToLong("5.0") → 5
   │   ├─ outputBytes = parseToLong("640") → 640
   │   ├─ cpuTime = parseToLong(856.0) → 856
   │   └─ memoryBytes = parseToLong(0.0) → 0
   └─ Recursively processes children
          ↓
enrichTreeWithEventData()
   └─ Adds query state, timing, metadata
          ↓
QueryTree object created with full hierarchy
          ↓
Exposed via REST API: GET /api/queries
          ↓
Frontend fetches and visualizes
```

### **Key Implementation: The Critical Fix**

**Problem:** Original parser extracted metrics into metadata but didn't set them as direct properties.

**Solution:** In `QueryPlanParser.java`, we now set metrics directly:

```java
// Extract cost estimates from PlanEstimate
if (planNode.getEstimates() != null && !planNode.getEstimates().isEmpty()) {
    PlanEstimate estimate = planNode.getEstimates().get(0);

    // Store in metadata (for reference)
    Map<String, Object> costInfo = new HashMap<>();
    costInfo.put("outputRowCount", estimate.getOutputRowCount());
    costInfo.put("outputSizeInBytes", estimate.getOutputSizeInBytes());
    metadata.put("estimates", costInfo);

    // ✅ CRITICAL FIX: Set as direct properties for frontend
    treeNode.setOutputRows(parseToLong(estimate.getOutputRowCount()));
    treeNode.setOutputBytes(parseToLong(estimate.getOutputSizeInBytes()));
    treeNode.setCpuTime(parseToLong(estimate.getCpuCost()));
    treeNode.setMemoryBytes(parseToLong(estimate.getMemoryCost()));
}
```

**Why this matters:**
- Frontend expects: `node.outputRows`, `node.cpuTime`, etc.
- Without this fix: All metrics would be `null` in the UI
- With this fix: Metrics are properly displayed

### **Example JSON Plan Structure**

```json
{
  "0": {
    "id": "0",
    "name": "Output",
    "descriptor": {},
    "outputs": [
      {"type": "bigint", "name": "customer_id"},
      {"type": "varchar(100)", "name": "name"}
    ],
    "estimates": [{
      "outputRowCount": "5.0",
      "outputSizeInBytes": "640",
      "cpuCost": 856.0,
      "memoryCost": 0.0,
      "networkCost": 640.0
    }],
    "children": [{
      "id": "131",
      "name": "TableScan",
      "descriptor": {
        "table": "postgres.public.customers"
      },
      "outputs": [...],
      "estimates": [{
        "outputRowCount": "5.0",
        "outputSizeInBytes": "800",
        "cpuCost": 800.0,
        "memoryCost": 0.0
      }],
      "children": []
    }]
  }
}
```

**After parsing, this becomes:**

```json
{
  "id": "0",
  "operatorType": "Output",
  "nodeType": "OPERATOR",
  "outputRows": 5,
  "outputBytes": 640,
  "cpuTime": 856,
  "memoryBytes": 0,
  "children": [{
    "id": "131",
    "operatorType": "TableScan",
    "nodeType": "OPERATOR",
    "outputRows": 5,
    "outputBytes": 800,
    "cpuTime": 800,
    "memoryBytes": 0,
    "metadata": {
      "table": "postgres.public.customers"
    },
    "children": []
  }]
}
```

---

## 🧪 Part 3: Testing JSON Plan Parsing

Now let's see the parsing in action!

### **Step 6: Open Trino CLI**

**Open ANOTHER terminal:**

```bash
docker exec -it trino trino
```

**You should see:**
```
trino>
```

---

### **Step 7: Check Available Data**

```sql
-- Show catalogs
SHOW CATALOGS;
```

**Expected output:**
```
    Catalog
--------------
 mongodb
 postgres
 system
```

```sql
-- Show tables in PostgreSQL
SHOW TABLES FROM postgres.public;
```

**Expected output:**
```
    Table
-----------
 actor
 customers
 orders
```

---

### **Step 8: Execute a Simple Query**

```sql
SELECT * FROM postgres.public.customers LIMIT 5;
```

**What happens behind the scenes:**

1. **Trino executes query**
2. **Event listener captures:**
   - Query ID
   - Query text
   - Execution state
   - **JSON plan** (if available)
3. **Kafka receives event**
4. **Backend consumes event:**
   ```
   INFO: Received Kafka message
   INFO: Parsing query tree from JSON plan for query: 20251026_xxxxx
   INFO: Successfully parsed JSON plan with operator: TableScan
   INFO: Processed event for query: 20251026_xxxxx
   ```
5. **QueryPlanParser extracts:**
   - Operator: TableScan
   - Table: postgres.public.customers
   - Metrics: outputRows=5, outputBytes=~640, etc.
6. **Tree structure built**
7. **API exposes data**
8. **Frontend polls and visualizes**

**Check your backend terminal** - you should see logs like:
```
INFO ... Parsing query tree from JSON plan for query: 20251026_200512_00001_xxxxx
INFO ... Successfully parsed JSON plan with operator: TableScan
INFO ... Processed event for query: 20251026_200512_00001_xxxxx
```

---

### **Step 9: Verify Parsing via API**

**In another terminal:**

```bash
# Get all queries
curl -s http://localhost:8080/api/queries | jq '.[0]' | head -50
```

**Look for these fields in the response:**

```json
{
  "queryId": "20251026_200512_00001_xxxxx",
  "query": "SELECT * FROM postgres.public.customers LIMIT 5",
  "state": "FINISHED",
  "root": {
    "id": "0",
    "operatorType": "Output",           ← Parsed from JSON
    "nodeType": "OPERATOR",
    "outputRows": 5,                    ← Metric extracted!
    "outputBytes": 640,                 ← Metric extracted!
    "cpuTime": 856,                     ← Metric extracted!
    "memoryBytes": 0,                   ← Metric extracted!
    "children": [{
      "id": "131",
      "operatorType": "TableScan",      ← Parsed from JSON
      "outputRows": 5,                  ← Metric extracted!
      "metadata": {
        "table": "postgres.public.customers"  ← Table info!
      }
    }]
  }
}
```

**✅ If you see these fields populated (not null), JSON parsing is working!**

---

### **Step 10: View in Frontend**

**Go to your browser:** http://localhost:5173

**You should now see:**

1. **Database Node** (PostgreSQL) on the left
2. **Query Execution Tree:**
   - Root node: "Output"
   - Child node: "TableScan"
   - Edge connecting them
3. **Metrics on each node:**
   - Output Rows: 5
   - Output Bytes: 640
   - CPU Time: 856 ms
   - Node color: Green (success)

**The page auto-refreshes every 2 seconds** to show new queries.

---

### **Step 11: Execute a Complex Federated Query**

Back in Trino CLI:

```sql
SELECT
    c.customer_id,
    c.name,
    o.order_id,
    o.order_date
FROM postgres.public.customers c
JOIN postgres.public.orders o
    ON c.customer_id = o.customer_id
LIMIT 5;
```

**What to observe:**

**Backend logs:**
```
INFO: Parsing query tree from JSON plan for query: 20251026_200600_00002_xxxxx
INFO: Successfully parsed JSON plan with operator: Output
INFO: Processed event for query: 20251026_200600_00002_xxxxx
```

**Frontend visualization should show:**
```
[PostgreSQL Database Node]
        ↓
    [Output]
        ↓
     [Join]  ← Join operator parsed!
      ↙   ↘
[TableScan:   [TableScan:
 customers]    orders]
```

**Each node shows metrics:**
- Operator type (Join, TableScan, etc.)
- Rows processed
- Bytes transferred
- CPU time used
- Memory consumed

---

### **Step 12: Test EXPLAIN to See Raw JSON Plan**

```sql
EXPLAIN (TYPE DISTRIBUTED, FORMAT JSON)
SELECT * FROM postgres.public.customers LIMIT 5;
```

**This shows the raw JSON plan that Trino generates** (same format our parser consumes).

**You'll see JSON output like:**
```json
{
  "0": {
    "id": "0",
    "name": "Output",
    "estimates": [{
      "outputRowCount": "5.0",
      "outputSizeInBytes": "640",
      ...
    }],
    "children": [...]
  }
}
```

**This is what `QueryPlanParser.parseJsonPlan()` receives and parses!**

---

## 🔍 Part 4: Verifying JSON Plan Parsing

### **Verification Checklist**

#### ✅ **1. Backend Logs Show Parsing**

Check backend terminal for:
```
✓ "Parsing query tree from JSON plan for query: ..."
✓ "Successfully parsed JSON plan with operator: TableScan"
✓ "Processed event for query: ..."
```

#### ✅ **2. API Returns Populated Metrics**

```bash
curl -s http://localhost:8080/api/queries | jq '.[0].root'
```

Verify:
```json
{
  "operatorType": "Output",          ← NOT null
  "outputRows": 5,                   ← NOT null
  "cpuTime": 856,                    ← NOT null
  "children": [...]                  ← Array with children
}
```

#### ✅ **3. Frontend Displays Metrics**

Open http://localhost:5173 and verify:
- ✓ Query nodes appear
- ✓ Operator types visible ("TableScan", "Join", etc.)
- ✓ Metrics show numbers (not "null")
- ✓ Tree structure shows parent-child relationships
- ✓ Database nodes connect to query nodes
- ✓ Colors reflect status (Green = success)

#### ✅ **4. Complex Queries Show Hierarchy**

Run a JOIN query and verify:
- ✓ Join operator appears
- ✓ Multiple TableScan nodes as children
- ✓ Proper tree structure
- ✓ All metrics populated

---

## 🎓 Part 5: Understanding the Implementation

### **Key Files**

#### **1. QueryPlanParser.java**
`backend/src/main/java/com/trinofed/parser/service/QueryPlanParser.java`

**Main methods:**

```java
public QueryTreeNode parseJsonPlan(String jsonPlanString)
```
- Entry point for parsing
- Converts JSON string to tree structure

```java
private QueryTreeNode convertPlanNodeToTreeNode(PlanNode planNode, String fragmentId)
```
- Recursive converter
- Extracts all metadata and metrics
- **THE KEY FIX IS HERE** (lines 130-135)

```java
private Long parseToLong(Object value)
```
- Type conversion utility
- Handles: Number, String, "NaN", "Infinity"
- Returns Long or null

#### **2. QueryEventService.java**
`backend/src/main/java/com/trinofed/parser/service/QueryEventService.java`

**Key method:**

```java
private QueryTreeNode buildTreeFromEvents(List<QueryEvent> events)
```
- Checks for jsonPlan in events
- Calls QueryPlanParser if found
- Falls back to legacy method if not

```java
private void enrichTreeWithEventData(QueryTreeNode node, QueryEvent event)
```
- Adds query-level metadata
- Propagates state to all nodes

#### **3. Model Classes**

**PlanNode.java** - Represents Trino's JSON plan node
**PlanEstimate.java** - Cost estimates (rows, bytes, CPU, memory)
**QueryTreeNode.java** - Tree node for visualization (frontend-compatible)

---

### **The Parsing Pipeline**

```
JSON String (from Kafka event)
    ↓
objectMapper.readValue(json, Map<String, PlanNode>.class)
    ↓
Map<String, PlanNode> fragments
    ↓
Get fragment "0" (root)
    ↓
convertPlanNodeToTreeNode(rootFragment, "0")
    ↓
For each node:
  ├─ Set id, operatorType, nodeType
  ├─ Extract descriptor (table info)
  ├─ Extract outputs (column info)
  ├─ Extract estimates:
  │   ├─ Parse outputRowCount → setOutputRows()
  │   ├─ Parse outputSizeInBytes → setOutputBytes()
  │   ├─ Parse cpuCost → setCpuTime()
  │   └─ Parse memoryCost → setMemoryBytes()
  └─ Recursively process children
    ↓
enrichTreeWithEventData(treeNode, event)
  └─ Add queryId, state, timing
    ↓
Complete QueryTreeNode tree
    ↓
Return to QueryEventService
    ↓
Store in queryTrees map
    ↓
Expose via REST API
    ↓
Frontend fetches and visualizes
```

---

## 🎯 Part 6: Testing Different Query Types

### **1. Simple SELECT**
```sql
SELECT * FROM postgres.public.customers LIMIT 5;
```
**Expected operators:** Output → TableScan

### **2. Filtered Query**
```sql
SELECT * FROM postgres.public.customers
WHERE customer_id > 5
LIMIT 5;
```
**Expected operators:** Output → Filter → TableScan

### **3. Aggregation**
```sql
SELECT customer_id, COUNT(*)
FROM postgres.public.orders
GROUP BY customer_id
LIMIT 5;
```
**Expected operators:** Output → TopN → Aggregate → TableScan

### **4. JOIN Query**
```sql
SELECT c.name, o.order_id
FROM postgres.public.customers c
JOIN postgres.public.orders o ON c.customer_id = o.customer_id
LIMIT 5;
```
**Expected operators:** Output → Join → TableScan (×2)

### **5. Multi-table JOIN**
```sql
SELECT c.name, o.order_id, o.order_date
FROM postgres.public.customers c
JOIN postgres.public.orders o ON c.customer_id = o.customer_id
ORDER BY o.order_date DESC
LIMIT 10;
```
**Expected operators:** Output → TopN → Join → TableScan (×2)

**Run each query and observe:**
- Different operator types appear
- Tree structure changes
- Metrics vary by query complexity
- All nodes show populated metrics

---

## 🔧 Troubleshooting

### **Issue: No metrics displayed (all null)**

**Symptoms:**
- Nodes appear in UI
- Operator types visible
- But outputRows, cpuTime show "null"

**Cause:** Old version of parser running

**Solution:**
```bash
# Stop backend (Ctrl+C)
cd /Users/lizhengyuan/Viz-TrinoFed/backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn clean package -DskipTests
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run
```

---

### **Issue: No children in tree**

**Symptoms:**
- Only root node visible
- No child operators

**Cause:** jsonPlan field is empty in events

**Check:**
```bash
# Look at backend logs
grep "No JSON plan available" backend_logs.txt
```

**This is expected for some query types.** The system falls back to event-based tree building.

---

### **Issue: Backend shows parsing errors**

**Check logs for:**
```
ERROR ... Error parsing JSON plan: ...
```

**Solutions:**
1. Log the raw jsonPlan string
2. Validate it's proper JSON
3. Check if Trino version matches expected format

---

### **Issue: Frontend not updating**

**Check:**
1. Frontend is running (http://localhost:5173)
2. Backend is running (http://localhost:8080)
3. Browser console (F12) for errors
4. Run a new query in Trino

---

## 📊 Service Reference

| Service    | Port  | URL                          | Purpose                    |
|------------|-------|------------------------------|----------------------------|
| Frontend   | 5173  | http://localhost:5173        | React visualization        |
| Backend    | 8080  | http://localhost:8080        | REST API & parsing         |
| Trino      | 8081  | http://localhost:8081        | Query engine               |
| PostgreSQL | 5433  | localhost:5433               | Database (postgres catalog)|
| MongoDB    | 27018 | localhost:27018              | Database (mongodb catalog) |
| Kafka      | 9092  | localhost:9092               | Event streaming            |

---

## 🎉 Success Criteria

**You'll know everything is working when:**

1. ✅ All Docker containers show "Up" status
2. ✅ Backend logs show "Started TrinoKafkaParserApplication"
3. ✅ Frontend shows "Local: http://localhost:5173/"
4. ✅ Queries execute in Trino without errors
5. ✅ Backend logs show "Parsing query tree from JSON plan"
6. ✅ Backend logs show "Successfully parsed JSON plan with operator: ..."
7. ✅ API returns queries with populated metrics
8. ✅ Frontend displays query tree with operators
9. ✅ Metrics show numbers (not null)
10. ✅ Tree structure reflects query complexity

---

## 📚 Additional Resources

**Project Documentation:**
- `JSON_PLAN_PARSING_GUIDE.md` - Detailed implementation guide
- `SHUTDOWN_STARTUP_GUIDE.md` - Shutdown/startup procedures
- `demo-json-plan-parsing.sh` - Automated demo script
- `README.md` - Project overview

**Code References:**
- `backend/src/main/java/com/trinofed/parser/service/QueryPlanParser.java` - Main parser
- `backend/src/main/java/com/trinofed/parser/service/QueryEventService.java` - Event orchestration
- `backend/src/main/java/com/trinofed/parser/model/plan/` - Plan models
- `src/pages/TreePage.tsx` - Frontend visualization

**External Documentation:**
- [Trino Documentation](https://trino.io/docs/current/)
- [Trino Event Listeners](https://trino.io/docs/current/develop/event-listener.html)
- [ReactFlow Documentation](https://reactflow.dev/)

---

## 🛑 Shutting Down

**When you're done:**

```bash
# Stop backend: Press Ctrl+C in backend terminal
# Stop frontend: Press Ctrl+C in frontend terminal
# Exit Trino CLI: Type 'quit'

# Stop Docker services
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose down
```

**To remove all data:**
```bash
docker-compose down -v
```

---

## 🎓 Summary

**What You've Learned:**

1. ✅ How to start Viz-TrinoFed from scratch
2. ✅ How JSON Plan Parsing works end-to-end
3. ✅ What happens when you execute a query
4. ✅ How the parser extracts metrics from JSON
5. ✅ How to verify parsing is working
6. ✅ How to test different query types
7. ✅ How to troubleshoot common issues

**What You've Built:**

- ✅ Fully functional Trino visualization system
- ✅ JSON plan parser that extracts operator trees
- ✅ Metrics extraction (rows, bytes, CPU, memory)
- ✅ Interactive frontend visualization
- ✅ Real-time query monitoring

**Key Achievement:**

The system successfully parses Trino's JSON execution plans and transforms them into interactive, metric-rich tree visualizations that help understand query execution!

---

**Last Updated:** October 26, 2025
**Status:** ✅ Complete & Tested
**Ready for:** Development, Testing, Demonstration
