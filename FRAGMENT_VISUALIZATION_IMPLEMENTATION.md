# Fragment-Based Visualization Implementation

This document describes the implementation of the fragment-based visualization feature for the Viz-TrinoFed project.

## Overview

The visualization now displays Trino query execution plan fragments as nodes, showing how data flows through different execution stages. Fragments are parsed from the text-based `plan` field in Kafka events and rendered as sequential nodes in the UI.

## What Was Implemented

### Backend Changes

#### 1. New Model: `Fragment.java`
- **Location**: `backend/src/main/java/com/trinofed/parser/model/Fragment.java`
- **Purpose**: Represents a single fragment from a Trino query execution plan
- **Key Fields**:
  - `fragmentId`: Unique identifier for the fragment
  - `partitioningType`: Type of partitioning (e.g., SINGLE, HASH, ROUND_ROBIN)
  - Timing metrics: `cpuTime`, `scheduledTime`, `blockedTime`
  - Data metrics: `inputRows`, `inputBytes`, `outputRows`, `outputBytes`
  - Resource metrics: `peakMemory`, `taskCount`
  - `operators`: List of operator strings from the execution plan
  - `outputLayout` and `outputPartitioning`: Fragment output configuration

#### 2. New Service: `TextPlanParser.java`
- **Location**: `backend/src/main/java/com/trinofed/parser/service/TextPlanParser.java`
- **Purpose**: Parses text-based Trino execution plans into Fragment objects
- **Key Methods**:
  - `parseTextPlan(String planText)`: Main parsing method that returns a list of Fragment objects
  - `parseFragmentMetrics()`: Extracts timing and resource metrics
  - `parseTimeToMs()`: Converts time values (ms/s) to milliseconds
  - `parseBytesToLong()`: Converts byte sizes (B/KB/MB/GB) to bytes
- **Parsing Logic**:
  - Uses regex to identify fragment headers: `Fragment X [TYPE]`
  - Extracts metrics from the fragment info line
  - Captures operator tree lines
  - Returns fragments sorted by fragmentId in descending order

#### 3. Updated Model: `QueryTree.java`
- **Change**: Added `fragments` field to store parsed fragments
- **Type**: `List<Fragment>`
- **Default**: Empty list

#### 4. Updated Service: `QueryEventService.java`
- **Changes**:
  - Injected `TextPlanParser` service
  - Updated `buildQueryTree()` to parse fragments from the `plan` field
  - Fragments are parsed when building QueryTree objects
  - Existing tree/events structure remains intact (backward compatible)

### Frontend Changes

#### 5. New Type: `Fragment` Interface
- **Location**: `src/types/api.types.ts`
- **Purpose**: TypeScript interface matching the backend Fragment model
- **Usage**: Type safety for fragment data throughout the frontend

#### 6. New Component: `FragmentNode.tsx`
- **Location**: `src/components/FragmentNode.tsx`
- **Purpose**: React component for rendering fragment nodes in the visualization
- **Features**:
  - Displays fragment ID and partitioning type prominently
  - Shows timing metrics (CPU, Scheduled, Blocked)
  - Shows data metrics (Input/Output rows and bytes)
  - Shows resource metrics (Peak Memory, Task Count)
  - Displays output layout and partitioning configuration
  - Preview of operators (first 5)
  - Status colors based on CPU time
  - 4 connection handles (top, bottom, left, right)
  - Copy/paste functionality and modal support

#### 7. New Component: `OutputNode.tsx`
- **Location**: `src/components/OutputNode.tsx`
- **Purpose**: Displays the final output stage of the query execution
- **Features**:
  - Shows "Output" label with green theme
  - Displays total output rows
  - Shows total execution time
  - Query state/status
  - Query preview (first 150 chars)
  - Only has a left handle (terminal node)
  - Green color scheme to indicate successful completion

#### 8. Updated Component: `TreePage.tsx`
- **Changes**:
  - Imported `Fragment` type, `FragmentNode`, and `OutputNode` components
  - Added `fragmentNode` and `outputNode` to node types registry
  - Added `FRAGMENT_NODE_W`, `FRAGMENT_NODE_H`, `OUTPUT_NODE_W`, and `OUTPUT_NODE_H` constants
  - **Updated Function**: `convertFragmentsToNodes(fragments, databases, queryTree)`
    - Converts Fragment objects to ReactFlow nodes
    - Creates sequential edges between fragments (descending order)
    - **Adds Output node after Fragment 0**
    - Connects Fragment 0 to Output node with green edge
    - Connects database nodes to highest fragment ID
    - Uses dagre layout for positioning (includes output node)
  - **Updated Logic**: `loadData()` function now:
    1. Checks if `queryToDisplay.fragments` exists and has items
    2. If yes, uses `convertFragmentsToNodes()` for visualization
    3. If no, falls back to existing tree/events visualization
    4. Maintains backward compatibility

## How It Works

### Data Flow

1. **Kafka Event Consumption**: Trino sends query events to Kafka with a `plan` field containing text-based execution plan
2. **Backend Processing**:
   - `TrinoEventConsumer` receives the event
   - `QueryEventService.processEvent()` stores the event
   - `QueryEventService.buildQueryTree()` calls `TextPlanParser.parseTextPlan()` if plan exists
   - Fragments are parsed and added to the QueryTree
3. **API Response**: QueryTree with fragments is returned via REST API
4. **Frontend Rendering**:
   - TreePage checks for fragments in the QueryTree
   - If fragments exist, `convertFragmentsToNodes()` creates visualization
   - FragmentNode components render each fragment
   - ReactFlow displays the graph with database nodes connected to fragments

### Fragment Connections

- **Sequential Flow**: Fragments are connected in descending order (highest ID → lowest ID)
  - Example: Fragment 3 → Fragment 2 → Fragment 1 → Fragment 0 → Output
- **Database Connection**: Database nodes connect to the highest fragment ID (leaf fragments that typically contain TableScan operations)
- **Output Connection**: Fragment 0 connects to the Output node with a green edge to show final results
- **Layout**: Uses dagre left-to-right layout for clear sequential visualization

## Example Visualization

```
[Database] -----> [Fragment 3] -> [Fragment 2] -> [Fragment 1] -> [Fragment 0] -> [Output]
                  [tpch:orders]   [HASH]          [ROUND_ROBIN]  [SINGLE]         Final Results
                  TableScan       Aggregate       LocalMerge     RemoteMerge
```

## Testing

### Prerequisites
1. Backend running on `http://localhost:8080`
2. Frontend running on `http://localhost:5173`
3. Trino, Kafka, and databases running (via docker-compose)

### Test Steps

1. **Start the System**:
   ```bash
   docker-compose up -d
   cd backend && ./run.sh  # or mvn spring-boot:run
   npm run dev
   ```

2. **Run a Test Query**:
   ```bash
   ./test-query.sh
   ```
   Or manually:
   ```bash
   docker exec -it trino trino --execute "SELECT l_returnflag, COUNT(*) as total_count FROM tpch.tiny.lineitem GROUP BY l_returnflag ORDER BY l_returnflag;"
   ```

3. **Observe the Visualization**:
   - Open browser to `http://localhost:5173`
   - You should see fragment nodes instead of (or in addition to) event nodes
   - Each fragment shows timing, data, and resource metrics
   - Fragments are connected sequentially
   - Database nodes are connected to the highest fragment

4. **Verify Fragment Data**:
   - Check that Fragment IDs are correct (descending order in visualization)
   - Verify metrics are populated (CPU time, rows, bytes, memory)
   - Confirm operators preview shows execution plan details
   - Test the QueryPlanPanel to see full plan text

### API Testing

You can also test the API directly:

```bash
# Get all queries (should include fragments field)
curl http://localhost:8080/api/queries | jq '.[0].fragments'

# Get specific query
curl http://localhost:8080/api/queries/{queryId} | jq '.fragments'
```

## Backward Compatibility

The implementation maintains full backward compatibility:

- If no fragments are available, the visualization falls back to:
  1. Complex tree visualization (if `root` exists with children)
  2. Event timeline visualization (if only events exist)
- Existing API endpoints remain unchanged
- Existing visualizations continue to work
- No breaking changes to data models

## Future Enhancements

Potential improvements for the fragment visualization:

1. **Interactive Fragment Details**: Click on fragment to see full operator tree
2. **Fragment Metrics Comparison**: Side-by-side comparison of fragments
3. **Performance Insights**: Highlight slow fragments or bottlenecks
4. **Fragment Dependencies**: Parse RemoteSource/RemoteMerge to show actual data flow dependencies
5. **Real-time Updates**: Show fragments updating as query executes
6. **Fragment State Tracking**: Show which fragments are running/complete

## Files Modified

### Backend
- ✅ `backend/src/main/java/com/trinofed/parser/model/Fragment.java` (NEW)
- ✅ `backend/src/main/java/com/trinofed/parser/service/TextPlanParser.java` (NEW)
- ✅ `backend/src/main/java/com/trinofed/parser/model/QueryTree.java` (UPDATED)
- ✅ `backend/src/main/java/com/trinofed/parser/service/QueryEventService.java` (UPDATED)

### Frontend
- ✅ `src/types/api.types.ts` (UPDATED)
- ✅ `src/components/FragmentNode.tsx` (NEW)
- ✅ `src/components/OutputNode.tsx` (NEW)
- ✅ `src/pages/TreePage.tsx` (UPDATED)

## Build Status

- ✅ Backend compiles successfully (`mvn clean compile`)
- ✅ Frontend builds successfully (`npm run build`)
- ✅ No linter errors
- ✅ All existing functionality preserved

## Implementation Complete

All planned features have been implemented and tested. The fragment-based visualization is now fully functional and ready for use.

