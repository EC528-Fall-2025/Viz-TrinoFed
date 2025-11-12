export default function Help() {
  const statuses = [
    { color: "#2563eb", symbol: "✅", text: "Blue with a check mark: The query finished successfully." },
    { color: "#dc2626", symbol: "❌", text: "Red with a sad face: The query has failed." },
    { color: "#6b7280", symbol: "❓", text: "Grey with a question mark: The query status is unknown." },
    { color: "#d1d5db", symbol: "⏳", text: "White with an hourglass: The query is queued." },
    { color: "#16a34a", symbol: "😊", text: "Green with a happy face: The query is running successfully." },
    { color: "#ca8a04", symbol: "😐", text: "Yellow with a neutral face: The query is running with high latency." },
  ];

  const instructions = [
    "To copy the query ID, click the copy icon on the top right of the query node.",
    "To see more query details, click the expand icon on the top right of the query node.",
    "To see the query history, click the query history button in the navigation bar.",
    "To see the current query, click the current query button in the navigation bar.",
  ];

  const toc = [
    { label: "Meanings of Colors & Icons", id: "colors-icons" },
    { label: "Using the Query Interface", id: "query-interface" },
  ];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          display: "flex",
          maxWidth: "1500px",
          margin: "60px auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          fontFamily: "'Lato', Arial, sans-serif",
          color: "#1f2937",
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            flex: "0 0 220px",
            borderRight: "1px solid #e5e7eb",
            padding: "40px 20px",
            position: "sticky",
            top: "20px",
            height: "fit-content",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Contents</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {toc.map((item) => (
              <li key={item.id} style={{ marginBottom: "0.8rem" }}>
                <a
                  href={`#${item.id}`}
                  style={{ color: "#2563eb", textDecoration: "none" }}
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

          <section
  id="colors-icons"
  style={{
    marginBottom: "2rem",
    paddingLeft: "40px",   // wider padding to match header
    paddingRight: "40px",  // wider padding to match header
  }}
>
  <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Meanings of Colors & Icons</h2>
  <ul style={{ listStyle: "none", padding: 0 }}>
    {statuses.map((s, i) => (
      <li key={i} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
        <span
          style={{
            fontSize: "1.1rem",
            marginRight: "0.5rem",
            color: s.color,
            width: "1.5rem",
            textAlign: "center",
          }}
        >
          {s.symbol}
        </span>
        <span>{s.text}</span>
      </li>
    ))}
  </ul>
</section>

<section
  id="query-interface"
  style={{
    marginBottom: "2rem",
    paddingLeft: "40px",  // wider padding
    paddingRight: "40px",
  }}
>
  <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Using the Query Interface</h2>
  <ul>
    {instructions.map((line, i) => (
      <li key={i} style={{ marginBottom: "0.4rem" }}>{line}</li>
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
