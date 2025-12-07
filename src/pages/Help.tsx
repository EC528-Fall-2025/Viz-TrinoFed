export default function Help() {
  const statuses = [
    { color: "#2563eb", symbol: "✅", text: "The query finished successfully." },
    { color: "#dc2626", symbol: "❌", text: "The query has failed." },
    { color: "#6b7280", symbol: "❓", text: "The query status is unknown." },
    { color: "#d1d5db", symbol: "⏳", text: "The query is queued." },
    { color: "#16a34a", symbol: "😊", text: "The query is running successfully." },
    { color: "#ca8a04", symbol: "😐", text: "The query is running with high latency." },
  ];

  const instructions = [
    { text: "To copy the query ID, click the copy icon on the top right of the query node." },
    { text: "To see more query details, click the expand icon on the top right of the query node." },
    { text: "To see the query history, click the query history button in the navigation bar." },
    { text: "To see the current query, click the current query button in the navigation bar." },
  ];

  const queryMetrics = [
    { label: "Query ID", description: "Unique identifier for each query execution." },
    { label: "User", description: "The username that submitted the query." },
    { label: "Event Count", description: "Number of events generated during query execution." },
    { label: "Start Time", description: "When the query began execution." },
    { label: "End Time", description: "When the query finished execution." },
    { label: "Duration", description: "Total time from start to finish." },
  ];

  const aggregatedPerformance = [
    { label: "CPU Time", description: "Total CPU processing time used by the query." },
    { label: "Wall Time", description: "Total elapsed real-world time for query execution." },
    { label: "Queued Time", description: "Time spent waiting in the queue before execution." },
    { label: "Peak Memory", description: "Maximum memory used during query execution." },
  ];

  const dataFlow = [
    { label: "Physical Input", description: "Raw data read from the source (rows and bytes)." },
    { label: "Processed Input", description: "Data after initial processing and filtering (rows and bytes)." },
    { label: "Output", description: "Final result set returned by the query (rows and size)." },
    { label: "Completed Splits", description: "Number of data splits successfully processed." },
  ];

  const dataMetrics = [
    { label: "Total Rows", description: "Cumulative number of rows processed across all stages of the query." },
    { label: "Total Data", description: "Total amount of data (in bytes, KB, MB, etc.) processed by the query." },
    { label: "Completed Splits", description: "Number of individual data partitions that have been successfully processed." },
  ];

  const cpuTimeDistribution = [
    { label: "P0 (Minimum)", description: "The fastest task execution time - represents the best-case CPU time." },
    { label: "P25 (25th Percentile)", description: "25% of tasks completed faster than this time." },
    { label: "P50 (Median)", description: "The middle value - 50% of tasks were faster, 50% were slower." },
    { label: "P75 (75th Percentile)", description: "75% of tasks completed faster than this time." },
    { label: "P90 (90th Percentile)", description: "90% of tasks completed faster than this time - useful for identifying slow outliers." },
    { label: "P95 (95th Percentile)", description: "95% of tasks completed faster than this time - highlights performance issues." },
    { label: "P99 (99th Percentile)", description: "99% of tasks completed faster than this time - shows worst-case scenarios." },
    { label: "P100 (Maximum)", description: "The slowest task execution time - represents the worst-case CPU time." },
  ];

  const operatorSummaries = [
    { label: "Operators", description: "Individual processing units that perform specific operations (e.g., scan, filter, join, aggregate) in the query execution plan." },
    { label: "Input Rows", description: "Number of rows received by the operator from previous operations." },
    { label: "Output Rows", description: "Number of rows produced by the operator and passed to subsequent operations." },
    { label: "CPU Time", description: "Total CPU time spent executing this specific operator." },
    { label: "Blocked Time", description: "Time the operator spent waiting (e.g., for data, locks, or resources)." },
  ];

  const taskStatistics = [
    { label: "Tasks", description: "Parallel execution units that process different portions of data independently." },
    { label: "Task Count", description: "Total number of tasks created to execute the query in parallel." },
    { label: "Task Distribution", description: "How tasks are distributed across workers and stages for optimal parallelism." },
    { label: "Completed Tasks", description: "Number of tasks that have successfully finished execution." },
  ];

  const additionalMetrics = [
    { label: "Scheduled Time", description: "Time spent scheduling the query for execution before it actually starts running." },
    { label: "Analysis Time", description: "Time spent analyzing and validating the query syntax and semantics." },
    { label: "Planning Time", description: "Time spent creating the optimal execution plan and determining how to execute the query." },
    { label: "Cumulative Memory", description: "Total memory consumed across all stages and operators during query execution." },
  ];

  const fragmentMetrics = [
    { label: "Fragments", description: "Independent units of work that can be executed in parallel. A query is divided into multiple fragments for distributed execution." },
    { label: "Fragment Performance", description: "CPU time, scheduled time, blocked time, and peak memory usage specific to this fragment." },
    { label: "Fragment Input/Output", description: "Number of rows and data size flowing into and out of the fragment." },
    { label: "Fragment Operators", description: "List of operators executed within this specific fragment (e.g., LocalMerge, PartialSort, RemoteSource)." },
    { label: "Output Layout", description: "The schema and column arrangement of data produced by the fragment." },
    { label: "Output Partitioning", description: "How the output data is partitioned across workers (e.g., SINGLE, HASH, BROADCAST)." },
  ];

  const toc = [
    { label: "Colors & Icons", id: "colors-icons" },
    { label: "Query Interface", id: "query-interface" },
    { label: "Query Metrics", id: "query-metrics" },
    { label: "Aggregated Performance", id: "aggregated-performance" },
    { label: "Data Flow", id: "data-flow" },
    { label: "Data Metrics", id: "data-metrics" },
    { label: "CPU Time Distribution", id: "cpu-time-distribution" },
    { label: "Operator Summaries", id: "operator-summaries" },
    { label: "Task Statistics", id: "task-statistics" },
    { label: "Additional Metrics", id: "additional-metrics" },
    { label: "Fragment Information", id: "fragment-information" },
  ];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          display: "flex",
          maxWidth: "1200px",
          margin: "60px auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#1f2937",
          minHeight: "100vh"
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            flex: "0 0 220px",
            borderRight: "1px solid #e5e7eb",
            padding: "30px 15px",
            position: "sticky",
            top: "20px",
            height: "fit-content",
          }}
        >
          <h2 style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>Contents</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {toc.map((item) => (
              <li key={item.id} style={{ marginBottom: "0.6rem" }}>
                <a
                  href={`#${item.id}`}
                  style={{
                    color: "#2563eb",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "inline-block",
                    maxWidth: "100%",
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <div style={{ flex: 1, padding: "40px 60px" }}>
          <h1 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
            Help Page
          </h1>

          {/* Thin separator line */}
          <div
            style={{
              height: "1px",
              backgroundColor: "#e5e7eb",
              marginBottom: "2rem",
              width: "100%",
            }}
          />

          <section id="colors-icons" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Meanings of Colors & Icons</h2>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {statuses.map((s, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.75rem",
                  padding: "12px 16px",
                  backgroundColor: `${s.color}10`,
                  borderLeft: `3px solid ${s.color}`,
                  borderRadius: "6px",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      color: s.color,
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {s.symbol}
                  </span>
                  <span style={{ flex: 1 }}>{s.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="query-interface" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Using the Query Interface</h2>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {instructions.map((item, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.75rem",
                  padding: "12px 16px",
                  backgroundColor: "#f8fafc",
                  borderLeft: "3px solid #2563eb",
                  borderRadius: "6px",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {item.symbol}
                  </span>
                  <span style={{ flex: 1 }}>{item.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="query-metrics" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Understanding Query Metrics</h2>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {queryMetrics.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="aggregated-performance" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Aggregated Performance</h2>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {aggregatedPerformance.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="data-flow" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Data Flow</h2>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {dataFlow.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="data-metrics" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Data Metrics</h2>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {dataMetrics.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="cpu-time-distribution" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>CPU Time Distribution</h2>
            <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
              CPU Time Distribution shows how execution time varies across different tasks in your query. 
              Percentiles help identify performance patterns and bottlenecks.
            </p>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {cpuTimeDistribution.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="operator-summaries" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Operator Summaries</h2>
            <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
              Operators are the building blocks of query execution. Each operator performs a specific operation 
              like scanning tables, filtering rows, joining data, or aggregating results.
            </p>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {operatorSummaries.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="task-statistics" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Task Statistics</h2>
            <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
              Tasks are parallel execution units that allow queries to process data concurrently across multiple workers, 
              improving performance for large datasets.
            </p>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {taskStatistics.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="additional-metrics" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Additional Metrics</h2>
            <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
              These metrics track the query lifecycle from submission to execution, helping identify bottlenecks 
              in query preparation and resource usage.
            </p>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {additionalMetrics.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="fragment-information" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "1.5rem", color: "#1f2937", fontWeight: 600 }}>
              Fragment Information
            </h2>
            <p style={{ marginBottom: "1.5rem", color: "#4b5563", lineHeight: "1.6" }}>
              Fragments represent independent units of work in distributed query execution. Each fragment can run 
              in parallel across multiple workers, containing its own operators, performance metrics, and data flow characteristics.
            </p>
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {fragmentMetrics.map((metric, i) => (
                <li key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "0.5rem",
                  width: "100%"
                }}>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      marginRight: "0.5rem",
                      width: "1.5rem",
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {metric.symbol}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong>{metric.label}:</strong> {metric.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p style={{ textAlign: "center", color: "#6b7280", marginTop: "2rem", fontSize: "0.85rem" }}>
            Trino Web UI — Help Section
          </p>
        </div>
      </div>
    </>
  );
}
