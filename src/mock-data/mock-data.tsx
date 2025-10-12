import { QueryNodeData } from "../components/Node";

export const demoNodes: QueryNodeData[] = [
    {
      id: "q_8f2a",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "ok",
      durationMs: 123,
      rows: 87654,
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "data", label: "Query ID", value: "q_8f2a" },
        { kind: "meter", label: "CPU", value: 62, max: 100, format: v => `${v}%` },
        { kind: "meter", label: "Network Latency", value: 123, max: 500, format: v => `${v} ms` },
        { kind: "text", label: "Node Count", value: <strong>12</strong> },
        { kind: "time", label: "Started", datetime: new Date().toISOString() },
      ],
      children: [
        {
          id: "q_8f2a_scan",
          stage: "Scan",
          title: "Scan — orders",
          status: "ok",
          rows: 12345,
          durationMs: 40,
          metrics: [
            { kind: "code", label: "Predicate", value: "create_time >= now() - interval '1 day'" },
            { kind: "text", label: "Bytes Read", value: "48 MB" },
          ],
        },
        {
          id: "q_8f2a_agg",
          stage: "Aggregate",
          title: "Aggregate — GROUP BY hour",
          status: "ok",
          durationMs: 55,
          metrics: [
            { kind: "text", label: "Partial", value: "true" },
            { kind: "text", label: "Spill", value: "none" },
          ],
        },
      ],
    },
    {
      id: "q_8f2a_2",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "queued",
      durationMs: 123,
      rows: 87654,
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      children: [
        {
          id: "q_8f2a_2_scan",
          stage: "Scan",
          title: "Scan — orders",
          status: "unknown",
          durationMs: 40,
          rows: 12345,
          metrics: [
            { kind: "code", label: "Predicate", value: "create_time >= now() - interval '1 day'" },
            { kind: "text", label: "Bytes Read", value: "48 MB" },
          ],
        },
        {
          id: "q_8f2a_2_agg",
          stage: "Aggregate",
          title: "Aggregate — GROUP BY hour",
          status: "idle",
          durationMs: 55,
          metrics: [
            { kind: "text", label: "Partial", value: "true" },
            { kind: "text", label: "Spill", value: "none" },
          ],
        },
      ],
    },
    {
      id: "q_8f2a_3",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "failed",
      durationMs: 123,
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "text", label: "Error", value: "Connection timed out" },
      ],
      children: [],
    },
    {
      id: "q_8f2a_4",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "finished",
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "text", label: "Finished", value: "true" },
      ],
      children: [],
    },
    {
      id: "q_8f2a_5",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "unknown",
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "text", label: "Unknown", value: "true" },
      ],
      children: [],
    },
    {
      id: "q_8f2a_6",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "finished",
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "text", label: "Finished", value: "true" },
      ],
      children: []
    },
    {
      id: "q_8f2a_7",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "finished",
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "text", label: "Finished", value: "true" },
      ],
      children: []
    },
    {
      id: "q_8f2a_8",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "finished",
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "text", label: "Finished", value: "true" },
      ],
      children: []
    },
    {
      id: "q_8f2a_9",
      stage: "Execution",
      title: "Execution — PostgreSQL",
      connector: "PostgreSQL",
      status: "finished",
      timestamp: new Date().toISOString(),
      defaultOpen: true,
      metrics: [
        { kind: "text", label: "Finished", value: "true" },
      ],
      children: [
        {
          id: "q_8f2a_9_scan",
          stage: "Scan",
          title: "Scan — orders",
          status: "unknown",
          durationMs: 40,
          rows: 12345,
        },
        {
          id: "q_8f2a_9_agg",
          stage: "Aggregate",
          title: "Aggregate — GROUP BY hour",
          status: "unknown",
          durationMs: 55,
        }
      ]
    },
  ];