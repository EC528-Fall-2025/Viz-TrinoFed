## 1.   Vision and Goals Of The Project:

The vision section describes the final desired state of the project once the project is complete. It also specifies the key goals of the project. This section provides a context for decision-making. A shared vision among all team members can help ensuring that the solution meets the intended goals. A solid vision clarifies perspective and facilitates decision-making.

The vision statement should be specific enough that you can look at a proposed solution and say either "yes, this meets the vision and goals", or "no, it does not".

## 2. Users/Personas Of The Project:

This section describes the principal user roles of the project together with the key characteristics of these roles. This information will inform the design and the user scenarios. A complete set of roles helps in ensuring that high-level requirements can be identified in the product backlog.

Again, the description should be specific enough that you can determine whether user A, performing action B, is a member of the set of users the project is designed for.

** **

## 3.   Scope and Features Of The Project:

The Scope places a boundary around the solution by detailing the range of features and functions of the project. This section helps to clarify the solution scope and can explicitly state what will not be delivered as well.

It should be specific enough that you can determine that e.g. feature A is in-scope, while feature B is out-of-scope.

** **

## 4. Solution Concept

## Introduction
To complement the processing of queries on Trino, a distributed SQL query engine written in Java, our project aims to make the user end even more friendly and reveal more information than already shown about the lifecycle of each query. We want to reveal the complete life cycle of a query across all federated data sources. Taking the already shown runtime metrics and query plan structures from Trino, we will enrich them with more information like error data or connector-level performance, then display them in an interactive display tree, whether in a plugin, separate hosted website, or in any way most visually pleasing and precise. Thus, our project can give developers and engineers an intuitive view at query execution, failures and bookmarks. 

## Global Architectural Structure Of the Project:
### 1. Data Collection Layer
- Retrieve query plans and details in JSON format. This is done with Trino’s EXPLAIN (TYPE DISTRIBUTED, FORMAT JSON) SQL command or with coordinator endpoints.
- Capture runtime metrics through Trino’s API and own built in metrics, EXPLAIN ANALYZE output, or directly from any workers on the system. Some metrics we will capture include execution time, errors, execution time and I/O information.  
- Use a broker such as Kafka to capture execution events and push them downstream to our visualization services and display them.

### 2. Processing and Aggregation Layer
- **Metrics Aggregator**: Normalize raw events like planning, execution, scheduling, join stages and merge stages into a common schema.
- **Error Mapping**: Associate from connectors (like PostgreSQL errors) with the corresponding nodes in the query tree.
- **Time Allocation**: Calculate the time spent in each stage with scheduling, connector execution, and network transfer metrics.
- **Observability Integration**: Export enhanced metrics from our project to either Prometheus or Grafana for time monitoring alongside visualization.

### 3. Visualization Layer
- **Render the tree**: The distributed query tree should be a visible, interactive, step by step and easy to follow tree. We will use React frontend with visualizer tools.
- **Each node should reveal**:
  - Operator/sub-query type (scan, join, aggregate etc.)
  - Source system (PostgreSQL or MongoDB)
  - Execution metrics (rows processed, latency, cost)
  - Errors or warnings
- **Timeline**: Create a timeline on the sidebar to show the order of planning, scheduling, execution and merging to complement the tree structure.
- **User Interaction**: Allow users to scroll through the tree, walk through execution flow, collapse or expand subtrees and nodes to focus on bottlenecks and walk through individual metrics. 

### 4. Deployment Model
- **Backend**:  A lightweight service, likely written in Java, the same language as Trino, or Node.js to integrate with React better. This backend connects to Trino and handles the plans, metrics, and then exposes them via GraphQL API to the frontend
- **Scalability**: Deploy on Kubernetes with Kafka for event streaming. Use Prometheus/Grafana for observability. 
- Modular components for others to integrate with existing Trino monitoring tools.

 
## Design Implications and Discussion:

This section discusses the implications and reasons of the design decisions made during the global architecture design.

## 5. Acceptance criteria

This section discusses the minimum acceptance criteria at the end of the project and stretch goals.

## 6.  Release Planning:

Release planning section describes how the project will deliver incremental sets of features and functions in a series of releases to completion. Identification of user stories associated with iterations that will ease/guide sprint planning sessions is encouraged. Higher level details for the first iteration is expected.

** **

## General comments

Remember that you can always add features at the end of the semester, but you can't go back in time and gain back time you spent on features that you couldn't complete.

** **
