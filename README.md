# Visualization of Trino Query Trees on Federated Systems 

## Collaborators
---
| Name | Email |
|---|---|
| Quargs Greene | qgreene@bu.edu |
| Zhengyuan Li | zhyuanl@bu.edu |
| Nathan Strahs | nstrahs@bu.edu |
| Jared Shi | jaredshi@bu.edu |
| Jacky Chen | jchen07@bu.edu |

## 1.   Vision and Goals Of The Project:

### Goal
This project aims to enhance the observability of Trino as a federated query engine by providing clear visibility into the full lifecycle of a query’s execution. While Trino allows users to query across differing data sources as if they were a single system, the lack of transparency into how queries are parsed, scheduled, and executed poses challenges for performance monitoring and troubleshooting. The current UI is complex and technical, representing a significant barrier to user understanding. By developing a visualization of query trees with extensive time-spent metrics, this project will enable users to better understand query behavior, identify performance bottlenecks, and correct errors, ultimately improving user and developer productivity with Trino. 

### Features
- Clear Phases: Separate visualizations for each phase of querying (planning, scheduling, execution, merging).
- Query tree visualization: A visual representation of Trino query plans and their decomposition into sub-queries and tasks.
- Integration of Metrics: A display of execution metrics such as planning time, scheduling delays, execution time per connector, network latency, and join/merge performance.
- Error Mapping: A list of surface errors and exceptions in the visualization, showing exactly where failures occurred within the query tree, displayed at a high-level, and optionally in low-level detail. 
- Performance Analysis: Identification of bottlenecks across the federated data sources, allowing performance tuning by making visible the impact of connector behavior, delays, and scheduling overhead.
- Intuitive UI: Interactive visualization interface using React and Typescript. 
- Trino Plugin Integration: Develop this as an open-source Trino plugin to make usage easy for widespread implementation on Trino. 


## 2. Users / Personas of the Project

This project is designed for people who work with distributed data systems and need deep visibility into how queries traverse multiple data sources. By visualizing Trino query trees and exposing timing and error data for each stage (planning, scheduling, execution, network latency, connector-level work), this tool helps users diagnose issues, optimize performance, and build more reliable systems.

---

### Primary Personas

| Persona                         | Role & Responsibilities                                                                 | Goals                                                                                      | How This Project Helps                                                                     |
|--------------------------------|------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| **Data Engineers**              | Design and maintain large-scale data pipelines across heterogeneous data sources.        | Diagnose bottlenecks, optimize data workflows, and ensure reliable cross-database pipelines. | Visualizes subquery pushdown and per-phase timings to pinpoint bottlenecks.                  |
| **Site Reliability Engineers (SREs)** | Monitor system performance and ensure reliability under heavy workloads.             | Minimize downtime, quickly identify root causes of failures, and improve incident response.  | Provides traceable failure points and timing data across connectors and network paths.       |
| **Backend / Full-stack Developers** | Build APIs and cloud-native services using Trino as a query layer.                 | Ensure backend responsiveness, troubleshoot query slowness in production.                   | Shows where time is spent across connectors and highlights problematic subqueries.            |
| **Database Administrators (DBAs)**  | Manage, tune, and maintain the health of database systems.                           | Resolve resource contention, detect slow queries, maintain consistent configurations.         | Reveals how Trino interacts with each database and where latency or errors originate.         |
| **Data Scientists**              | Integrate and analyze datasets from multiple sources.                                  | Ensure reproducible, efficient analytics and understand query performance characteristics.    | Makes the execution path of complex analytical queries visible and understandable.             |
| **DevOps Engineers / Platform Teams** | Support deployment pipelines and infrastructure at scale.                        | Optimize compute resources, orchestrate scaling strategies, and reduce CI/CD risk.            | Surfaces performance patterns to support infrastructure and scaling decisions.                 |
| **Data Analysts**                 | Query structured data to produce reports, dashboards, and insights.                   | Create reliable, accurate analyses without being blocked by performance issues.               | Allows analysts to independently understand errors and delays without relying on engineers.     |

---

### Additional Potential Users

| Persona                         | Role & Responsibilities                                                            | Goals                                                                 | How This Project Helps                                                              |
|--------------------------------|-----------------------------------------------------------------------------------|------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| **Graduate Students / Researchers** | Study or prototype distributed data systems and cloud computing.               | Understand distributed query planning, scheduling, and execution.      | Provides a visual and intuitive way to explore real-world Trino query lifecycles.     |
| **Engineering Managers / Tech Leads** | Oversee cross-functional data teams and projects.                           | Gain visibility into systemic issues and guide performance optimization. | Offers high-level insight into execution patterns and potential points of failure.     |

---

**In short:**  
Anyone who needs to understand, debug, and optimize queries that span multiple data sources in Trino will benefit from this tool’s ability to make the entire query lifetime visible and comprehensible.

## 3.   Scope and Features Of The Project:
### 1. User-Friendly Visualization of Trino Query Trees
- Develop an interactive web UI that allows users to explore how queries are executed in Trino.  
- Replace Trino’s verbose `EXPLAIN ANALYZE` output with a simplified, user-friendly tree view.  
- Highlight the execution flow across multiple connectors (e.g., PostgreSQL, MongoDB) in a way that is accessible to non-expert users.  

---

### 2. Query Execution Tree Display
- Show how a user query is decomposed into subqueries and pushed down to different connectors.  
- Visualize the hierarchy of operations clearly: **Planning → Scheduling → Execution → Merging**.  
- Represent dependencies and data flow between subqueries using an intuitive diagram.  

---

### 3. Performance Metrics Collection and Visualization
- Collect query metrics using Trino’s **observability features** (OpenTelemetry, OpenMetrics).  
- Leverage the **Kafka Event Listener** ([Trino Kafka Listener Docs](https://trino.io/docs/current/admin/event-listeners-kafka.html)) to capture query events.  
- Correlate events using **query IDs** to build accurate execution trees.  
- Display execution times for each phase (planning, scheduling, execution, network, merging).  
- Provide both **aggregated total query time** and **per-phase breakdowns** so users can see where time is spent (Trino vs. underlying DB).  

---

### 4. Error and Failure Representation
- Capture query execution errors and display them in the execution tree at the exact phase where they occur.  
- Highlight error types (timeouts, connector failures, parsing errors) with clear, color-coded indicators.  
- Provide a **high-level error summary** with an option to drill down into detailed error logs.  

---

### 5. Interactive User Interface Features
- Implement the frontend with **ReactFlow and TypeScript** to enable interactive visualization.  
- Expand/collapse nodes for exploring subquery details.  
- Hover or click nodes to view connector metadata, execution time, and error messages.  
- Use **color-coded statuses** for quick readability:  
  - 🟢 Green = success  
  - 🟡 Yellow = slow or high latency  
  - 🔴 Red = error  

---

### 6. System Integration
- Use the official **Trino Docker image** ([Docker Hub](https://hub.docker.com/r/trinodb/trino)) for local development and testing.  
- Configure at least **two connectors** (PostgreSQL and MongoDB) as catalogs ([PostgreSQL Connector Docs](https://trino.io/docs/current/connector/postgresql.html)).  
- Run federated queries that join across PostgreSQL and MongoDB to test visualization accuracy.  
- Feed captured metrics and events from Kafka into the visualization UI.  

---

### 7. Security and Reliability Considerations
- Ensure that only **query metadata and metrics** are visualized, never sensitive query results.  
- Build fault tolerance into the metrics collection process so that it does not interfere with Trino’s execution.  

---

### 8. Scalability and Extensibility
- Support larger federated queries involving multiple subqueries across different connectors.  
- Extendable design for future connectors beyond PostgreSQL and MongoDB.  
- Provide a foundation for optional integration with external observability platforms such as Prometheus or Grafana.  

---

## Out of Scope
- Modifying Trino’s internal query engine or scheduling mechanisms.  
- Full-scale production integration with observability stacks (Prometheus, Grafana, ELK).  
- Predictive query optimization or automatic performance tuning.  
- Supporting all connectors (initial scope limited to PostgreSQL and MongoDB).  


** **

## 4. Solution Concept

## Current Architecture
<img width="781" height="772" alt="Trino Viz Architecture Diagram" src="https://github.com/user-attachments/assets/e147687f-daa8-43e4-b0cf-3cef3743c4bb" />

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

### 1. Design Implications
- **Transparency**: Makes federated query execution across multiple different data sources transparent to the convenience of engineers and programmers who need to identify bottlenecks, learn the database queries quickly, and improves presentation for software products.
- **Debugging**: Find slow queries, connector-level failures, and failed query connections.
- **Educational**: Help new users understand distributed query execution, not only new programmers but also new hires in an office to see their database easier and get started faster.
- **Extendible**: Built on open tools like Prometheus or Kafka that can then scale and integrate into existing systems.
- **Not just UI**: A pipeline of observability for distributed query execution, in depth at every step. 
- **Observability**: Doesn’t interfere with Trino events, only observing events.

### 2. Design Choices:
- **Kafka**: Kafka is a good broker because Trino generates query events asynchronously, so Kafka provides durability, scalability, and replayability. Kafka also decouples event capture from visualization.
- **JSON Queries and API Integration**: Trino has existing JSON outputs (EXPLAIN, EXPLAIN ANALYZE, REST endpoints), so we will use these existing outputs to make this product compatible with all Trino core engines, lightweight, and future proof against future Trino updates.
- **Reactflow**: The best choice for readable frontend of the tree rather than a static log output. We will have expand/collapse nodes, color-coded statuses, and hover interactions to make the simple metrics of the default Trino more readable.
- **Security choices**: Only expose query metadata and execution metrics, never query results. This way, no sensitive data is leaked. 

## 5. Acceptance criteria

### Minimum acceptance criteria
- **Core Visualization Functionality**: Develop an interactive web UI that successfully renders the query execution tree for a federated Trino query joining data from at least two different sources (PostgreSQL and MongoDB).   
- **Query Lifecycle Display**: The visualization must clearly distinguish between the primary phases of a query's lifecycle: Planning, Scheduling, Execution (per data source), and Merging.   
- **Basic Metrics & Error Reporting**: The UI must display the total time spent for a query and visually indicate where in the tree an error occurred if a query fails. The system must successfully capture this data using Trino's Kafka Event Listener.   
- **Plugin Packaging**: The final tool must be packaged as a basic, open-source Trino plugin to facilitate straightforward installation and use by the Trino community.

### Stretch goals:
- **Advanced Metric Visualization**: Display detailed, per-phase performance metrics, including planning time, network latency, scheduling delays, and join/merge time. Implement color-coded indicators (🟢, 🟡, 🔴) to denote success, high latency, or failure.   
- **Enhanced UI Interactivity**: Implement advanced UI features using ReactFlow, such as the ability to expand and collapse nodes in the query tree and hover over a node to view detailed metadata and error logs.
- **Historical Query Analysis**: Integrate a persistent storage solution (e.g., a simple database) to store query metrics, allowing users to view and analyze the history of recent query executions.
- **Broader Connector Support**: Extend the visualization tool to reliably support additional Trino connectors beyond the initial PostgreSQL and MongoDB scope.

## 6.  Release Planning:

### Sprint 1: Project Setup & Data Ingestion (9/24 - 10/1)
- Finalize system architecture and create a detailed development plan.
- Set up a local Trino environment using Docker, with PostgreSQL and MongoDB connectors configured.  
- Configure and enable the Trino Kafka Event Listener to capture query events.  
- Develop a basic backend service to consume events from Kafka.
- Initialize a skeleton frontend application using React and TypeScript.
### Sprint 2: Backend Logic & MVP Visualization (10/2 - 10/15)
- Implement backend logic to parse and correlate Kafka events using query IDs.
- Develop the data model to reconstruct a hierarchical query tree from the events.
- Create a basic, non-interactive web UI to render a static query tree for a completed query.
- Connect the frontend to the backend to display the first visual results.
### Sprint 3: Integrating Core Metrics & Error Handling (10/16-10/29)
- Enhance the backend to calculate timing for each query phase (planning, scheduling, execution, merging).  
- Display these core performance metrics on the corresponding nodes in the UI.
- Implement logic to visually flag failed nodes in the tree.
- Show high-level error messages in the UI when a user interacts with a failed node.  
### Sprint 4: UI Interactivity & Refinement (10/30-11/12)
- Implement advanced UI features like the ability to expand and collapse nodes in the query tree.
- Add color-coded statuses for quick readability (e.g., green for success, red for error).
- Refine the overall UI/UX based on feedback to ensure the visualization is intuitive.
- Conduct end-to-end testing with complex federated queries to ensure accuracy and performance.
### Sprint 5: Plugin Packaging & Documentation (11/13-11/26)
- Structure the entire application as an installable, open-source Trino plugin.
- Create clear documentation for installation, configuration, and usage.
- Perform final system testing and address any remaining bugs.
- Prepare the project for its final presentation and public release.

** **
