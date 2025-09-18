## 1.   Vision and Goals Of The Project:

The vision section describes the final desired state of the project once the project is complete. It also specifies the key goals of the project. This section provides a context for decision-making. A shared vision among all team members can help ensuring that the solution meets the intended goals. A solid vision clarifies perspective and facilitates decision-making.

The vision statement should be specific enough that you can look at a proposed solution and say either "yes, this meets the vision and goals", or "no, it does not".

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

The Scope places a boundary around the solution by detailing the range of features and functions of the project. This section helps to clarify the solution scope and can explicitly state what will not be delivered as well.

It should be specific enough that you can determine that e.g. feature A is in-scope, while feature B is out-of-scope.

** **

## 4. Solution Concept

This section provides a high-level outline of the solution.

Global Architectural Structure Of the Project:

This section provides a high-level architecture or a conceptual diagram showing the scope of the solution. If wireframes or visuals have already been done, this section could also be used to show how the intended solution will look. This section also provides a walkthrough explanation of the architectural structure.

 

Design Implications and Discussion:

This section discusses the implications and reasons of the design decisions made during the global architecture design.

## 5. Acceptance criteria

This section discusses the minimum acceptance criteria at the end of the project and stretch goals.

## 6.  Release Planning:

Release planning section describes how the project will deliver incremental sets of features and functions in a series of releases to completion. Identification of user stories associated with iterations that will ease/guide sprint planning sessions is encouraged. Higher level details for the first iteration is expected.

** **

## General comments

Remember that you can always add features at the end of the semester, but you can't go back in time and gain back time you spent on features that you couldn't complete.

** **
