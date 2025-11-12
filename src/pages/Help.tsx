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
    { symbol: "➡️", text: "To copy the query ID, click the copy icon on the top right of the query node." },
    { symbol: "➡️", text: "To see more query details, click the expand icon on the top right of the query node." },
    { symbol: "➡️", text: "To see the query history, click the query history button in the navigation bar." },
    { symbol: "➡️", text: "To see the current query, click the current query button in the navigation bar." },
  ];

  const queryMetrics = [
    { symbol: "🔑", label: "Query ID", description: "Unique identifier for each query execution." },
    { symbol: "👤", label: "User", description: "The username that submitted the query." },
    { symbol: "📝", label: "Event Count", description: "Number of events generated during query execution." },
    { symbol: "🕐", label: "Start Time", description: "When the query began execution." },
    { symbol: "🕑", label: "End Time", description: "When the query finished execution." },
    { symbol: "⏱️", label: "Duration", description: "Total time from start to finish." },
  ];

  const aggregatedPerformance = [
    { symbol: "🖥️", label: "CPU Time", description: "Total CPU processing time used by the query." },
    { symbol: "⏰", label: "Wall Time", description: "Total elapsed real-world time for query execution." },
    { symbol: "⏳", label: "Queued Time", description: "Time spent waiting in the queue before execution." },
    { symbol: "🧠", label: "Peak Memory", description: "Maximum memory used during query execution." },
  ];



  const toc = [
    { label: "Colors & Icons", id: "colors-icons" },
    { label: "Query Interface", id: "query-interface" },
    { label: "Query Metrics", id: "query-metrics" },
    { label: "Aggregated Performance", id: "aggregated-performance" },
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
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",  // ← Change this line
          color: "#1f2937",
        }}
      >
        {/* Sidebar */}
      <nav
        style={{
          flex: "0 0 220px",
          borderRight: "1px solid #e5e7eb",
          padding: "30px 15px", // slightly smaller padding for compactness
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
                  fontSize: "0.875rem", // smaller font for items
                  whiteSpace: "nowrap", // prevent wrapping
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
    Help
  </h1>

  {/* Thin separator line */}
  <div
    style={{
      height: "1px",
      backgroundColor: "#e5e7eb", // light gray like GitHub
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
          backgroundColor: `${s.color}10`, // 10% opacity of the status color
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
              flexShrink: 0,  // Add this to prevent icon from shrinking
              textAlign: "center",
            }}
          >
            {s.symbol}
          </span>
          <span style={{ flex: 1 }}>{s.text}</span>  {/* Add flex: 1 */}
        </li>
      ))}
    </ul>
  </section>

<section
  id="query-interface"
  style={{
    marginBottom: "2rem",
  }}
>
  <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Using the Query Interface</h2>
  <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
    {instructions.map((item, i) => (
      <li key={i} style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: "0.75rem",
        padding: "12px 16px",
        backgroundColor: "#f8fafc", // light gray background
        borderLeft: "3px solid #2563eb", // blue accent
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

<section
            id="query-metrics"
            style={{
              marginBottom: "2rem",
            }}
          >
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

          <section
            id="aggregated-performance"
            style={{
              marginBottom: "2rem",
            }}
          >
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


          <p style={{ textAlign: "center", color: "#6b7280", marginTop: "2rem", fontSize: "0.85rem" }}>
            Trino Web UI — Help Section
          </p>
        </div>
      </div>
    </>
  );
}
