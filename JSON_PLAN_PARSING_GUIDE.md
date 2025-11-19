# JSON Plan Parsing Implementation Guide

## 📚 Overview

This document demonstrates how the Viz-TrinoFed system implements JSON parsing for actual Trino query execution plans, transforming them into interactive tree visualizations.

**Date:** October 26, 2025
**Status:** ✅ Implementation Complete & Tested

---

## 🎯 What is JSON Plan Parsing?

JSON Plan Parsing is the process of:
1. Capturing Trino's query execution plans in JSON format
2. Parsing the structured JSON data
3. Extracting operators, metrics, and relationships
4. Building a hierarchical tree structure
5. Visualizing the execution flow in the frontend

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Trino Query    │
│   Execution     │
└────────┬────────┘
         │
         │ Event Listener
         ▼
┌─────────────────┐
│  Kafka Event    │
│  {"queryId":..  │
│   "jsonPlan":.. │
│   ...}          │
└────────┬────────┘
         │
         │ Consumer
         ▼
┌──────────────────────────┐
│  TrinoEventConsumer.java │
│  - Deserializes event    │
│  - Extracts jsonPlan     │
└──────────┬───────────────┘
           │
           │ Process Event
           ▼
┌───────────────────────────┐
│  QueryEventService.java   │
│  - buildTreeFromEvents()  │
│  - Check for jsonPlan     │
└──────────┬────────────────┘
           │
           │ If jsonPlan exists
           ▼
┌────────────────────────────┐
│   QueryPlanParser.java     │
│  ┌──────────────────────┐  │
│  │ parseJsonPlan()      │  │
│  │  - Parse JSON string │  │
│  │  - Map to PlanNode   │  │
│  └──────────┬───────────┘  │
│             │              │
│  ┌──────────▼───────────┐  │
│  │convertPlanNodeTo     │  │
│  │TreeNode()            │  │
│  │ - Build hierarchy    │  │
│  │ - Extract metrics    │  │
│  │ - Set node props     │  │
│  └──────────┬───────────┘  │
│             │              │
│  ┌──────────▼───────────┐  │
│  │ parseToLong()        │  │
│  │ - Convert strings    │  │
│  │ - Handle NaN values  │  │
│  └──────────────────────┘  │
└────────────┬───────────────┘
             │
             │ QueryTreeNode
             ▼
┌──────────────────────────┐
│  QueryEventService.java  │
│  - enrichTreeWithEvent   │
│    Data()                │
│  - Add query metadata    │
│  - Propagate state       │
└──────────┬───────────────┘
           │
           │ QueryTree
           ▼
┌──────────────────────────┐
│  REST API Endpoint       │
│  GET /api/queries        │
└──────────┬───────────────┘
           │
           │ HTTP Request
           ▼
┌──────────────────────────┐
│  TreePage.tsx (Frontend) │
│  - Fetch query data      │
│  - Convert to ReactFlow  │
│  - Render visualization  │
└──────────────────────────┘
```

---

## 📂 Key Files & Their Roles

### Backend (Java)

#### 1. **QueryPlanParser.java** `/backend/src/main/java/com/trinofed/parser/service/QueryPlanParser.java`

**Purpose:** Core parser that converts JSON plans into tree structures

**Key Methods:**

```java
public QueryTreeNode parseJsonPlan(String jsonPlanString)
```
- **Input:** Raw JSON plan string from Trino
- **Output:** Root `QueryTreeNode` of the execution tree
- **Process:**
  1. Parse JSON string to `Map<String, PlanNode>`
  2. Get root fragment (typically fragment "0")
  3. Recursively convert each fragment to `QueryTreeNode`
  4. Return root node with full hierarchy

```java
private QueryTreeNode convertPlanNodeToTreeNode(PlanNode planNode, String fragmentId)
```
- **Input:** A single `PlanNode` and its fragment ID
- **Output:** Corresponding `QueryTreeNode`
- **Process:**
  1. Set basic properties (id, operatorType, nodeType)
  2. Extract descriptor metadata (table info, etc.)
  3. Extract output columns
  4. Extract cost estimates → **THIS IS THE KEY FIX**
     - outputRows
     - outputBytes
     - cpuTime (CPU cost)
     - memoryBytes (memory cost)
  5. Recursively process children
  6. Return complete node

```java
private Long parseToLong(Object value)
```
- **Input:** String or Object value from JSON (could be "123", "45.67", "NaN", etc.)
- **Output:** Long value or null
- **Process:**
  1. Handle Number types directly
  2. Parse string values
  3. Handle special cases: "NaN", "Infinity" → return null
  4. Convert doubles to long
  5. Return null on parse failure

#### 2. **QueryEventService.java** `/backend/src/main/java/com/trinofed/parser/service/QueryEventService.java`

**Purpose:** Orchestrates query event processing and tree building

**Key Methods:**

```java
private QueryTreeNode buildTreeFromEvents(List<QueryEvent> events)
```
- **Input:** List of query events for a single query
- **Output:** Root `QueryTreeNode`
- **Process:**
  1. Iterate through events looking for `jsonPlan`
  2. If `jsonPlan` found → call `queryPlanParser.parseJsonPlan()`
  3. If parsed successfully → enrich with event data
  4. If no `jsonPlan` → fallback to legacy method

```java
private void enrichTreeWithEventData(QueryTreeNode node, QueryEvent event)
```
- **Input:** Tree node and corresponding event
- **Output:** void (modifies node in place)
- **Process:**
  1. Set queryId, state, sourceSystem on all nodes
  2. Set executionTime if not already set
  3. Set wallTime if not already set
  4. Recursively enrich all children

#### 3. **TrinoEventConsumer.java** `/backend/src/main/java/com/trinofed/parser/consumer/TrinoEventConsumer.java`

**Purpose:** Kafka consumer that receives Trino events

**Key Methods:**

```java
@KafkaListener(topics = "${trino.kafka.topic}")
public void consume(String message)
```
- **Input:** Raw Kafka message (JSON string)
- **Output:** void (processes event)
- **Process:**
  1. Deserialize to `TrinoEventWrapper`
  2. Convert to `QueryEvent`
  3. Pass to `queryEventService.processEvent()`

#### 4. **Model Classes**

**PlanNode.java** - Represents a node in Trino's JSON plan
```java
class PlanNode {
    private String id;
    private String name;  // Operator type (TableScan, Join, etc.)
    private Map<String, String> descriptor;
    private List<PlanOutput> outputs;
    private List<String> details;
    private List<PlanEstimate> estimates;  // Cost estimates
    private List<PlanNode> children;
}
```

**PlanEstimate.java** - Cost estimates for a plan node
```java
class PlanEstimate {
    private String outputRowCount;      // e.g., "100.5"
    private String outputSizeInBytes;   // e.g., "1024"
    private Object cpuCost;             // Can be Double or "NaN"
    private Object memoryCost;          // Can be Double or "NaN"
    private Object networkCost;         // Can be Double or "NaN"
}
```

**QueryTreeNode.java** - Tree node for visualization
```java
class QueryTreeNode {
    private String id;
    private String queryId;
    private String nodeType;           // "OPERATOR", "STAGE"
    private String operatorType;       // "TableScan", "Join", etc.
    private String sourceSystem;       // Catalog name
    private String state;              // "FINISHED", "FAILED", etc.

    // Metrics (populated from PlanEstimate)
    private Long outputRows;
    private Long outputBytes;
    private Long cpuTime;
    private Long memoryBytes;
    private Long executionTime;

    private Map<String, Object> metadata;
    private List<QueryTreeNode> children;
}
```

### Frontend (TypeScript/React)

#### **TreePage.tsx** `/src/pages/TreePage.tsx`

**Purpose:** Main visualization component

**Key Functions:**

```typescript
function convertToQueryNodeData(node: QueryTreeNode): QueryNodeData
```
- Converts backend `QueryTreeNode` to frontend `QueryNodeData`
- Maps states to status colors
- Extracts metrics for display

```typescript
function toReactFlow(nodes: QueryNodeData[], databases: Database[])
```
- Converts `QueryNodeData` trees to ReactFlow nodes and edges
- Creates database nodes
- Builds parent-child relationships
- Returns nodes and edges for visualization

---

## 🔧 Implementation Details

### 1. **JSON Plan Format**

Trino's JSON plan uses a fragment-based structure:

```json
{
  "0": {
    "id": "0",
    "name": "Output",
    "descriptor": {},
    "outputs": [
      {"type": "integer", "name": "customer_id"},
      {"type": "varchar", "name": "name"}
    ],
    "estimates": [{
      "outputRowCount": "5.0",
      "outputSizeInBytes": "500",
      "cpuCost": 123.45,
      "memoryCost": 1024,
      "networkCost": 0.0
    }],
    "children": [
      {
        "id": "1",
        "name": "TableScan",
        "descriptor": {
          "table": "postgres.public.customers"
        },
        "outputs": [...],
        "estimates": [...],
        "children": []
      }
    ]
  }
}
```

### 2. **Parsing Flow**

```
JSON String
    │
    ├─> objectMapper.readValue()
    │
    ├─> Map<String, PlanNode>
    │
    ├─> Get fragment "0" (root)
    │
    ├─> convertPlanNodeToTreeNode()
    │   │
    │   ├─> Create QueryTreeNode
    │   ├─> Set id, operatorType, nodeType
    │   ├─> Extract metadata
    │   ├─> Extract outputs
    │   ├─> Extract estimates
    │   │   │
    │   │   ├─> parseToLong(outputRowCount) → setOutputRows()
    │   │   ├─> parseToLong(outputSizeInBytes) → setOutputBytes()
    │   │   ├─> parseToLong(cpuCost) → setCpuTime()
    │   │   └─> parseToLong(memoryCost) → setMemoryBytes()
    │   │
    │   └─> Recursively process children
    │
    └─> Return root QueryTreeNode
```

### 3. **The Critical Fix**

**Problem:** Original parser extracted metrics into `metadata` map but didn't set them as direct properties on `QueryTreeNode`.

**Solution:** Added direct property setting in `convertPlanNodeToTreeNode()`:

```java
// Extract cost estimates
if (planNode.getEstimates() != null && !planNode.getEstimates().isEmpty()) {
    PlanEstimate estimate = planNode.getEstimates().get(0);

    // Store in metadata (for backward compatibility)
    Map<String, Object> costInfo = new HashMap<>();
    costInfo.put("outputRowCount", estimate.getOutputRowCount());
    // ... more metadata ...
    metadata.put("estimates", costInfo);

    // ✅ NEW: Set as direct properties for frontend compatibility
    treeNode.setOutputRows(parseToLong(estimate.getOutputRowCount()));
    treeNode.setOutputBytes(parseToLong(estimate.getOutputSizeInBytes()));
    treeNode.setCpuTime(parseToLong(estimate.getCpuCost()));
    treeNode.setMemoryBytes(parseToLong(estimate.getMemoryCost()));
}
```

**Why This Works:**
- Frontend expects metrics as direct properties on `QueryTreeNode`
- `TreePage.tsx` accesses `node.outputRows`, `node.cpuTime`, etc.
- Without this fix, all metrics would be `null` in the UI

### 4. **State Enrichment**

**Problem:** Parsed nodes from JSON plan don't have query-level state.

**Solution:** Added enrichment in `enrichTreeWithEventData()`:

```java
private void enrichTreeWithEventData(QueryTreeNode node, QueryEvent event) {
    if (node == null) return;

    // Set query-level metadata on all nodes
    node.setQueryId(event.getQueryId());
    node.setState(event.getState());            // ← Critical for UI status
    node.setSourceSystem(event.getCatalog());

    // Set timing if not already set
    if (node.getExecutionTime() == null) {
        node.setExecutionTime(event.getExecutionTime());
    }

    // Recursively enrich children
    for (QueryTreeNode child : node.getChildren()) {
        enrichTreeWithEventData(child, event);
    }
}
```

---

## 🧪 Testing the Implementation

### 1. **Run the Demonstration Script**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed
./demo-json-plan-parsing.sh
```

This script:
- ✅ Verifies all services are running
- ✅ Executes test queries
- ✅ Shows query results
- ✅ Fetches parsed data from API
- ✅ Verifies metrics are populated
- ✅ Provides visualization instructions

### 2. **Manual Testing**

#### Step 1: Execute a query
```bash
docker exec trino trino --execute "SELECT * FROM postgres.public.customers LIMIT 5"
```

#### Step 2: Check backend logs
Look for:
```
INFO ... Parsing query tree from JSON plan for query: 20251026_xxxxx
INFO ... Successfully parsed JSON plan with operator: TableScan
INFO ... Processed event for query: 20251026_xxxxx
```

#### Step 3: Check API response
```bash
curl http://localhost:8080/api/queries | jq '.[0].root'
```

**Expected output:**
```json
{
  "id": "0",
  "queryId": "20251026_195701_00005_67rxd",
  "operatorType": "Output",
  "nodeType": "OPERATOR",
  "state": "FINISHED",
  "outputRows": 5,
  "outputBytes": 500,
  "cpuTime": 123,
  "memoryBytes": 1024,
  "children": [...]
}
```

#### Step 4: Verify in frontend
Open `http://localhost:5173`

**Check:**
- ✅ Query nodes appear
- ✅ Operator types are visible ("TableScan", "Join", etc.)
- ✅ Metrics are displayed (not "null")
- ✅ Tree structure shows parent-child relationships
- ✅ Color coding reflects query state

### 3. **Test with Complex Query**

```sql
SELECT
    c.customer_id,
    c.name,
    o.order_id,
    o.order_date
FROM postgres.public.customers c
JOIN postgres.public.orders o
    ON c.customer_id = o.customer_id
LIMIT 10;
```

**Expected visualization:**
```
[Database: PostgreSQL] ──► [Output]
                                │
                                ├─► [Join]
                                │   ├─► [TableScan: customers]
                                │   └─► [TableScan: orders]
                                │
                                └─► [Limit]
```

---

## 🔍 Debugging Guide

### Issue: No metrics displayed (all null)

**Symptoms:**
- Nodes appear in UI
- Operator types are visible
- But `outputRows`, `cpuTime`, etc. show `null`

**Cause:**
- Old version of parser running
- Not calling `parseToLong()` on estimates

**Solution:**
```bash
cd /Users/lizhengyuan/Viz-TrinoFed/backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn clean package -DskipTests
# Restart backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run
```

### Issue: No children in tree structure

**Symptoms:**
- Only root node appears
- No child operators visible

**Cause:**
- `jsonPlan` field is null/empty in events
- Trino's Kafka listener not including JSON plan

**Solution:**

**Option 1:** Check if Trino version supports JSON plan in events
- Requires Trino 400+ with enhanced event listener

**Option 2:** Use query execution via API
- Fetch JSON plan from Trino REST API
- Requires additional implementation

**Option 3:** Enhance event listener configuration
```properties
# trino/etc/event-listener.properties
event-listener.name=kafka
kafka-event-listener.broker-endpoints=kafka:29092
kafka-event-listener.publish-created-event=true
kafka-event-listener.publish-completed-event=true
# Add if available:
kafka-event-listener.include-query-plan=true
kafka-event-listener.plan-format=json
```

### Issue: Parser fails with exception

**Symptoms:**
- Backend logs show parsing errors
- Nodes don't appear in UI

**Check backend logs for:**
```
ERROR ... Error parsing JSON plan: ...
```

**Common causes:**
1. **Invalid JSON format**
   - Solution: Log raw `jsonPlan` string and validate JSON

2. **Unexpected structure**
   - Solution: Check if Trino version has different format
   - Update `PlanNode` model to match

3. **Type conversion errors**
   - Solution: Enhance `parseToLong()` to handle more cases

---

## 🚀 Advanced Features

### 1. **Operator Type Detection**

The parser recognizes these Trino operators:

- **TableScan** - Reading from table
- **Filter** - WHERE conditions
- **Project** - Column selection
- **Join** - JOIN operations
- **Aggregate** - GROUP BY
- **TopN** - ORDER BY + LIMIT
- **Exchange** - Data shuffle
- **Output** - Final output
- **Limit** - LIMIT clause
- **Sort** - ORDER BY

### 2. **Metadata Extraction**

For each operator, the parser extracts:

```java
// TableScan example
if ("TableScan".equals(planNode.getName())) {
    if (planNode.getDescriptor().containsKey("table")) {
        String tableInfo = planNode.getDescriptor().get("table");
        // "postgres.public.customers"
        metadata.put("table", tableInfo);
    }
}
```

### 3. **Cost Estimation**

From `PlanEstimate`:
- **outputRowCount** - Estimated rows produced
- **outputSizeInBytes** - Estimated data size
- **cpuCost** - Estimated CPU cycles
- **memoryCost** - Estimated memory usage
- **networkCost** - Estimated network transfer

### 4. **Fragment Handling**

Trino splits queries into fragments:
- **Fragment 0** - Coordinator fragment (root)
- **Fragment 1+** - Worker fragments

Parser processes all fragments and links them.

---

## 📊 Example: Complete Parse Flow

### Input JSON Plan

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
      "outputs": [
        {"type": "bigint", "name": "customer_id"},
        {"type": "varchar(100)", "name": "name"},
        {"type": "varchar(100)", "name": "email"}
      ],
      "estimates": [{
        "outputRowCount": "5.0",
        "outputSizeInBytes": "800",
        "cpuCost": 800.0,
        "memoryCost": 0.0,
        "networkCost": 0.0
      }],
      "children": []
    }]
  }
}
```

### Parsing Steps

1. **Parse JSON → Map**
   ```java
   Map<String, PlanNode> fragments = objectMapper.readValue(json, ...);
   // fragments.get("0") → root PlanNode
   ```

2. **Convert root PlanNode**
   ```java
   PlanNode root = fragments.get("0");
   QueryTreeNode treeRoot = convertPlanNodeToTreeNode(root, "0");
   ```

3. **Set properties**
   ```java
   treeRoot.setId("0");
   treeRoot.setOperatorType("Output");
   treeRoot.setNodeType("OPERATOR");
   ```

4. **Extract estimates**
   ```java
   PlanEstimate estimate = root.getEstimates().get(0);
   treeRoot.setOutputRows(parseToLong("5.0"));        // → 5L
   treeRoot.setOutputBytes(parseToLong("640"));       // → 640L
   treeRoot.setCpuTime(parseToLong(856.0));          // → 856L
   treeRoot.setMemoryBytes(parseToLong(0.0));        // → 0L
   ```

5. **Process children recursively**
   ```java
   for (PlanNode child : root.getChildren()) {
       QueryTreeNode childNode = convertPlanNodeToTreeNode(child, "0");
       treeRoot.getChildren().add(childNode);
   }
   ```

6. **Enrich with event data**
   ```java
   enrichTreeWithEventData(treeRoot, event);
   // Sets: queryId, state, sourceSystem, executionTime
   ```

### Output QueryTreeNode

```json
{
  "id": "0",
  "queryId": "20251026_195701_00005_67rxd",
  "operatorType": "Output",
  "nodeType": "OPERATOR",
  "state": "FINISHED",
  "sourceSystem": "postgres",
  "outputRows": 5,
  "outputBytes": 640,
  "cpuTime": 856,
  "memoryBytes": 0,
  "executionTime": 1234,
  "metadata": {
    "fragmentId": "0",
    "outputs": [
      {"name": "customer_id", "type": "bigint"},
      {"name": "name", "type": "varchar(100)"}
    ],
    "estimates": {
      "outputRowCount": "5.0",
      "outputSizeInBytes": "640",
      "cpuCost": 856.0,
      "memoryCost": 0.0,
      "networkCost": 640.0
    }
  },
  "children": [{
    "id": "131",
    "queryId": "20251026_195701_00005_67rxd",
    "operatorType": "TableScan",
    "nodeType": "OPERATOR",
    "state": "FINISHED",
    "sourceSystem": "postgres",
    "outputRows": 5,
    "outputBytes": 800,
    "cpuTime": 800,
    "memoryBytes": 0,
    "metadata": {
      "fragmentId": "0",
      "table": "postgres.public.customers",
      "outputs": [...]
    },
    "children": []
  }]
}
```

---

## 📋 Checklist for New Developers

If you're implementing similar JSON plan parsing:

- [ ] Define model classes matching Trino's JSON structure
  - [ ] `PlanNode` with all fields
  - [ ] `PlanEstimate` for cost data
  - [ ] `PlanOutput` for column info

- [ ] Implement parser service
  - [ ] `parseJsonPlan()` - Main entry point
  - [ ] `convertPlanNodeToTreeNode()` - Recursive converter
  - [ ] `parseToLong()` - Type conversion helper

- [ ] Extract all relevant data
  - [ ] Operator types
  - [ ] Cost estimates (rows, bytes, time, memory)
  - [ ] Table metadata
  - [ ] Output columns
  - [ ] Parent-child relationships

- [ ] Enrich with runtime data
  - [ ] Query state
  - [ ] Execution times
  - [ ] Error messages

- [ ] Test thoroughly
  - [ ] Simple SELECT queries
  - [ ] JOIN queries
  - [ ] Aggregation queries
  - [ ] Failed queries
  - [ ] Queries without JSON plan

- [ ] Handle edge cases
  - [ ] Null/empty JSON plan
  - [ ] "NaN" and "Infinity" values
  - [ ] Missing estimates
  - [ ] Unexpected operator types

---

## 🎓 Learning Resources

### Trino Documentation
- [Query Execution](https://trino.io/docs/current/overview/concepts.html#query-execution-model)
- [Event Listeners](https://trino.io/docs/current/develop/event-listener.html)
- [EXPLAIN](https://trino.io/docs/current/sql/explain.html)

### Code References
- `QueryPlanParser.java` - Main parser implementation
- `QueryEventService.java` - Event orchestration
- `TrinoEventWrapper.java` - Event model
- `TreePage.tsx` - Frontend visualization

---

## ✅ Summary

**What We Built:**
1. ✅ JSON plan parser that extracts Trino execution plans
2. ✅ Recursive tree builder that maintains operator hierarchy
3. ✅ Metric extraction (rows, bytes, CPU, memory)
4. ✅ Type conversion for string/object values
5. ✅ State enrichment with query metadata
6. ✅ Frontend integration for visualization

**Key Achievements:**
- Properly populates `QueryTreeNode` properties for frontend
- Handles various data types and edge cases
- Maintains backward compatibility with legacy fallback
- Provides rich metadata for debugging
- Enables interactive tree visualization

**Next Steps:**
- Enhance event listener to always include JSON plan
- Add support for more operator types
- Implement performance metrics analysis
- Add historical query comparison

---

**Questions or Issues?**
Check the demonstration script: `./demo-json-plan-parsing.sh`
Review the code in: `backend/src/main/java/com/trinofed/parser/service/`

**Last Updated:** October 26, 2025
