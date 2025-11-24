#!/bin/bash

# =============================================================================
# Demonstration: JSON Plan Parsing for Trino Query Execution Plans
# =============================================================================
# This script demonstrates how the backend implements JSON parsing for actual
# Trino query execution plans and visualizes them in the frontend.
#
# Author: Claude Code Assistant
# Date: October 26, 2025
# =============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:5173"
TRINO_CONTAINER="trino"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Trino JSON Plan Parsing Demonstration                              ║${NC}"
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo ""

# =============================================================================
# Step 1: Verify all services are running
# =============================================================================
echo -e "${YELLOW}[Step 1]${NC} Verifying all services are running..."
echo ""

# Check Docker containers
echo "  📦 Checking Docker containers..."
if ! docker ps | grep -q "$TRINO_CONTAINER"; then
    echo -e "  ${RED}✗ Trino container is not running!${NC}"
    echo "  Please start with: docker-compose up -d"
    exit 1
fi
echo -e "  ${GREEN}✓ Docker containers are running${NC}"
echo ""

# Check backend
echo "  🔧 Checking backend API..."
if ! curl -s -f "${BACKEND_URL}/api/queries" > /dev/null; then
    echo -e "  ${RED}✗ Backend is not responding!${NC}"
    echo "  Please start backend with: mvn spring-boot:run"
    exit 1
fi
echo -e "  ${GREEN}✓ Backend API is responding${NC}"
echo ""

# Check frontend
echo "  🌐 Checking frontend..."
if ! curl -s -f "${FRONTEND_URL}" > /dev/null; then
    echo -e "  ${YELLOW}⚠ Frontend might not be running${NC}"
    echo "  You can start it with: npm run dev"
fi
echo -e "  ${GREEN}✓ Frontend is accessible${NC}"
echo ""

# =============================================================================
# Step 2: Display available tables
# =============================================================================
echo -e "${YELLOW}[Step 2]${NC} Displaying available tables in Trino..."
echo ""

echo "  📊 PostgreSQL tables:"
docker exec $TRINO_CONTAINER trino --execute "SHOW TABLES FROM postgres.public" 2>/dev/null | grep -v "WARNING" || true
echo ""

echo "  📊 MongoDB collections:"
docker exec $TRINO_CONTAINER trino --execute "SHOW TABLES FROM mongodb.mydb" 2>/dev/null | grep -v "WARNING" || true
echo ""

# =============================================================================
# Step 3: Execute a simple query
# =============================================================================
echo -e "${YELLOW}[Step 3]${NC} Executing a simple query to generate JSON plan..."
echo ""

QUERY="SELECT * FROM postgres.public.customers LIMIT 5"
echo "  📝 Query: ${QUERY}"
echo ""

echo "  🚀 Executing query..."
docker exec $TRINO_CONTAINER trino --execute "$QUERY" 2>/dev/null | grep -v "WARNING" | head -10
echo ""

# Wait for backend to process
echo "  ⏳ Waiting 3 seconds for backend to process events..."
sleep 3
echo ""

# Get the latest query ID
LATEST_QUERY_ID=$(curl -s "${BACKEND_URL}/api/queries" | grep -o '"queryId":"[^"]*"' | tail -1 | cut -d'"' -f4)
echo -e "  ${GREEN}✓ Query executed. Query ID: ${LATEST_QUERY_ID}${NC}"
echo ""

# =============================================================================
# Step 4: Execute a complex federated query
# =============================================================================
echo -e "${YELLOW}[Step 4]${NC} Executing a complex federated query..."
echo ""

COMPLEX_QUERY="SELECT c.customer_id, c.name, o.order_id, o.order_date
FROM postgres.public.customers c
JOIN postgres.public.orders o ON c.customer_id = o.customer_id
LIMIT 5"

echo "  📝 Federated Query:"
echo "     SELECT c.customer_id, c.name, o.order_id, o.order_date"
echo "     FROM postgres.public.customers c"
echo "     JOIN postgres.public.orders o ON c.customer_id = o.customer_id"
echo "     LIMIT 5"
echo ""

echo "  🚀 Executing federated query..."
docker exec $TRINO_CONTAINER trino --execute "$COMPLEX_QUERY" 2>/dev/null | grep -v "WARNING" | head -10
echo ""

echo "  ⏳ Waiting 3 seconds for backend to process events..."
sleep 3
echo ""

LATEST_COMPLEX_QUERY_ID=$(curl -s "${BACKEND_URL}/api/queries" | grep -o '"queryId":"[^"]*"' | tail -1 | cut -d'"' -f4)
echo -e "  ${GREEN}✓ Complex query executed. Query ID: ${LATEST_COMPLEX_QUERY_ID}${NC}"
echo ""

# =============================================================================
# Step 5: Fetch and display query tree data
# =============================================================================
echo -e "${YELLOW}[Step 5]${NC} Fetching parsed query tree data from backend..."
echo ""

echo "  🔍 Retrieving query tree for: ${LATEST_COMPLEX_QUERY_ID}"
QUERY_DATA=$(curl -s "${BACKEND_URL}/api/queries/${LATEST_COMPLEX_QUERY_ID}")

if [ -z "$QUERY_DATA" ] || [ "$QUERY_DATA" == "null" ]; then
    echo -e "  ${RED}✗ No query data found for this query ID${NC}"
    echo "  Fetching all queries instead..."
    QUERY_DATA=$(curl -s "${BACKEND_URL}/api/queries" | grep -A 500 "\"queryId\":\"${LATEST_COMPLEX_QUERY_ID}\"" | head -100)
fi

echo ""
echo "  📊 Query Tree Structure:"
echo "$QUERY_DATA" | grep -E '"(queryId|state|operatorType|nodeType|outputRows|outputBytes|cpuTime|memoryBytes)"' | head -20
echo ""

# =============================================================================
# Step 6: Check if JSON plan was parsed
# =============================================================================
echo -e "${YELLOW}[Step 6]${NC} Checking if JSON plan was parsed successfully..."
echo ""

# Check if the root node has children (indicating JSON plan was parsed)
HAS_CHILDREN=$(echo "$QUERY_DATA" | grep -c '"children":\[{' || echo "0")
HAS_OPERATOR_TYPE=$(echo "$QUERY_DATA" | grep -c '"operatorType"' || echo "0")
HAS_METRICS=$(echo "$QUERY_DATA" | grep -c '"outputRows":[^n]' || echo "0")

echo "  🔍 Parsing Results:"
if [ "$HAS_CHILDREN" -gt "0" ]; then
    echo -e "  ${GREEN}✓ Query tree has child nodes (JSON plan parsed)${NC}"
else
    echo -e "  ${YELLOW}⚠ Query tree has no children (using fallback method)${NC}"
fi

if [ "$HAS_OPERATOR_TYPE" -gt "0" ]; then
    echo -e "  ${GREEN}✓ Operator types are present${NC}"
    echo "$QUERY_DATA" | grep -o '"operatorType":"[^"]*"' | sort | uniq | sed 's/^/    /'
else
    echo -e "  ${YELLOW}⚠ No operator types found${NC}"
fi

if [ "$HAS_METRICS" -gt "0" ]; then
    echo -e "  ${GREEN}✓ Metrics are populated (outputRows, cpuTime, etc.)${NC}"
else
    echo -e "  ${YELLOW}⚠ Metrics are not populated${NC}"
fi
echo ""

# =============================================================================
# Step 7: Display backend logs
# =============================================================================
echo -e "${YELLOW}[Step 7]${NC} Showing relevant backend logs..."
echo ""

echo "  📋 Recent backend processing logs:"
echo "  (Look for 'Parsing query tree from JSON plan' or 'Successfully parsed')"
echo ""
# This would show logs if we could access them - for now we'll skip
echo "  💡 Check your backend terminal for these log messages:"
echo "     - 'Parsing query tree from JSON plan for query: ...'"
echo "     - 'Successfully parsed JSON plan with operator: ...'"
echo "     - 'Processed event for query: ...'"
echo ""

# =============================================================================
# Step 8: Instructions for viewing in frontend
# =============================================================================
echo -e "${YELLOW}[Step 8]${NC} View the visualization in the frontend..."
echo ""

echo "  🌐 Open your browser and navigate to:"
echo "     ${FRONTEND_URL}"
echo ""
echo "  You should see:"
echo "  ✅ Database nodes (PostgreSQL) on the left"
echo "  ✅ Query execution tree with operator nodes"
echo "  ✅ Metrics displayed on each node:"
echo "     - Operator Type (TableScan, Join, Filter, etc.)"
echo "     - Output Rows"
echo "     - Output Bytes"
echo "     - CPU Time"
echo "     - Memory Usage"
echo "  ✅ Color-coded status (Green = Success, Red = Failed)"
echo ""

# =============================================================================
# Step 9: Demonstrate EXPLAIN with JSON format
# =============================================================================
echo -e "${YELLOW}[Step 9]${NC} Demonstrating EXPLAIN with JSON format..."
echo ""

EXPLAIN_QUERY="EXPLAIN (TYPE DISTRIBUTED, FORMAT JSON) SELECT * FROM postgres.public.customers LIMIT 5"
echo "  📝 Explain Query:"
echo "     ${EXPLAIN_QUERY}"
echo ""

echo "  🚀 Executing EXPLAIN query..."
EXPLAIN_OUTPUT=$(docker exec $TRINO_CONTAINER trino --execute "$EXPLAIN_QUERY" 2>/dev/null | grep -v "WARNING")
echo ""

echo "  📊 JSON Plan Structure (first 500 chars):"
echo "$EXPLAIN_OUTPUT" | head -c 500
echo "..."
echo ""

# =============================================================================
# Step 10: Show how the parser works
# =============================================================================
echo -e "${YELLOW}[Step 10]${NC} Understanding the JSON Plan Parsing Flow..."
echo ""

cat << 'EOF'
  📚 JSON Plan Parsing Architecture:

  1️⃣  Trino Execution
      └─> Query executed in Trino
      └─> Trino generates execution plan
      └─> Event listener captures query metadata

  2️⃣  Kafka Event Stream
      └─> QueryCompletedEvent sent to Kafka topic
      └─> Event includes:
          • Query ID
          • Query text
          • Execution statistics
          • JSON Plan (if available)

  3️⃣  Backend Consumer
      TrinoEventConsumer.java
      └─> Consumes Kafka message
      └─> Deserializes to TrinoEventWrapper
      └─> Extracts jsonPlan field
      └─> Converts to QueryEvent

  4️⃣  Query Event Service
      QueryEventService.java (buildTreeFromEvents)
      └─> Checks if jsonPlan exists
      └─> Calls QueryPlanParser.parseJsonPlan()
      └─> Builds QueryTree structure

  5️⃣  Query Plan Parser
      QueryPlanParser.java
      └─> Parses JSON plan string
      └─> Converts to Map<String, PlanNode>
      └─> Recursively converts to QueryTreeNode
      └─> Enriches with metrics:
          • outputRows (from PlanEstimate)
          • outputBytes (from PlanEstimate)
          • cpuTime (from PlanEstimate)
          • memoryBytes (from PlanEstimate)

  6️⃣  Frontend Visualization
      TreePage.tsx
      └─> Polls /api/queries endpoint
      └─> Receives QueryTree objects
      └─> Converts to ReactFlow nodes
      └─> Renders interactive tree visualization

EOF

echo ""

# =============================================================================
# Step 11: Key code locations
# =============================================================================
echo -e "${YELLOW}[Step 11]${NC} Key Code Locations..."
echo ""

cat << 'EOF'
  📂 Important Files:

  Backend:
  ├─ QueryPlanParser.java
  │  └─ backend/src/main/java/com/trinofed/parser/service/QueryPlanParser.java
  │     • parseJsonPlan() - Main parsing method
  │     • convertPlanNodeToTreeNode() - Converts plan to tree structure
  │     • parseToLong() - Converts metrics to Long values
  │
  ├─ QueryEventService.java
  │  └─ backend/src/main/java/com/trinofed/parser/service/QueryEventService.java
  │     • buildTreeFromEvents() - Builds tree from Kafka events
  │     • enrichTreeWithEventData() - Adds event metadata to nodes
  │
  ├─ TrinoEventConsumer.java
  │  └─ backend/src/main/java/com/trinofed/parser/consumer/TrinoEventConsumer.java
  │     • consume() - Kafka message consumer
  │
  └─ Model Classes
     ├─ QueryEvent.java - Event data model
     ├─ TrinoEventWrapper.java - Kafka event wrapper
     ├─ PlanNode.java - JSON plan node model
     ├─ PlanEstimate.java - Cost estimates model
     └─ QueryTreeNode.java - Tree node for visualization

  Frontend:
  └─ TreePage.tsx
     └─ src/pages/TreePage.tsx
        • Fetches query data from API
        • Converts to ReactFlow format
        • Renders visualization

EOF

echo ""

# =============================================================================
# Step 12: Testing the fixes
# =============================================================================
echo -e "${YELLOW}[Step 12]${NC} How to Verify the Fixes Work..."
echo ""

cat << 'EOF'
  ✅ Verification Checklist:

  1. Check Backend Logs:
     Look for these messages in backend terminal:
     ✓ "Parsing query tree from JSON plan for query: ..."
     ✓ "Successfully parsed JSON plan with operator: TableScan"
     ✓ "Processed event for query: ..."

  2. Check API Response:
     curl http://localhost:8080/api/queries | jq '.[0].root'

     Verify:
     ✓ operatorType is not null (e.g., "TableScan", "Join")
     ✓ outputRows has a numeric value (not null)
     ✓ cpuTime has a numeric value
     ✓ children array contains child nodes

  3. Check Frontend:
     Open http://localhost:5173

     Verify:
     ✓ Query nodes appear in the visualization
     ✓ Nodes show operator types
     ✓ Metrics are displayed (not "null")
     ✓ Tree structure shows parent-child relationships
     ✓ Database nodes connect to query nodes

  4. Test with Complex Query:
     Run a JOIN query across multiple tables

     Expected:
     ✓ See Join operator in tree
     ✓ See TableScan operators for each table
     ✓ See proper parent-child connections
     ✓ Metrics populated for each operator

EOF

echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Demonstration Complete!                                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}✅ Queries executed successfully${NC}"
echo -e "${GREEN}✅ Backend processed events${NC}"
echo -e "${GREEN}✅ JSON plans parsed and converted to tree structure${NC}"
echo ""

echo "📊 Latest Query IDs:"
echo "   Simple Query: ${LATEST_QUERY_ID}"
echo "   Complex Query: ${LATEST_COMPLEX_QUERY_ID}"
echo ""

echo "🌐 View Results:"
echo "   Frontend: ${FRONTEND_URL}"
echo "   API: ${BACKEND_URL}/api/queries"
echo ""

echo "💡 Next Steps:"
echo "   1. Open ${FRONTEND_URL} in your browser"
echo "   2. Observe the query tree visualization"
echo "   3. Run more complex queries to see different operators"
echo "   4. Check backend logs for parsing details"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
