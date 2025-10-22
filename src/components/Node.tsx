import * as React from "react";import { Box, Chip, Typography, Divider } from "@mui/material";
import { Handle, Position } from "@xyflow/react";
import { 
  HourglassBottom, 
  QuestionMark, 
  SentimentSatisfiedAlt, 
  SentimentVeryDissatisfied, 
  SentimentNeutral, 
  Check,
  ContentCopy,
  OpenInNew,
} from "@mui/icons-material";

export const setStatusColor = (state: QueryNodeData['status']) => {
  switch(state) {
    case 'queued':
      return '#e3f2fd'; // Light blue instead of white
    case 'failed':
      return '#ffcdd2'; // Light red
    case 'idle':
      return '#fff9c4'; // Light yellow
    case 'ok':
      return '#c8e6c9'; // Light green
    case 'finished':
      return '#bbdefb'; // Light blue
    case 'unknown':
      return '#f5f5f5'; // Light gray
  }
}

export const setStatusIcon = (state: QueryNodeData['status']) => {
  switch(state) {
    case 'queued':
      return <HourglassBottom />;
    case 'failed':
      return <SentimentVeryDissatisfied />;
    case 'idle':
      return <SentimentNeutral />;
    case 'ok':
      return <SentimentSatisfiedAlt/>;
    case 'finished':
      return <Check />;
    case 'unknown':
      return <QuestionMark />;
  }
}


export type MeterMetric = {
  kind: "meter";
  label: string;
  value: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  optimum?: number;
  /** Format function for displaying value as text (e.g., "123 ms"). */
  format?: (v: number) => string;
};

export type TextMetric = {
  kind: "text";
  label: string;
  value: React.ReactNode;
};

export type CodeMetric = {
  kind: "code";
  label: string;
  value: string;
};

export type TimeMetric = {
  kind: "time";
  label: string;
  /** ISO datetime string */
  datetime: string;
  /** Optional human-readable display */
  display?: string;
};

export type DataMetric = {
  kind: "data";
  label: string;
  value: string | number;
};

export type QueryMetric = MeterMetric | TextMetric | CodeMetric | TimeMetric | DataMetric;

export interface QueryNodeData {
  id: string;
  stage: string; // e.g., "Execution", "Scan", "Aggregate"
  title?: string; // optional short title
  connector?: string; // e.g., "PostgreSQL", "MongoDB"
  status?: "unknown" | "ok" | "idle" | "queued" | "finished" | "failed";
  durationMs?: number; // optional summary duration
  rows?: number; // optional summary rows
  timestamp?: string; // ISO string for when stage started
  metrics?: QueryMetric[]; // detailed metrics
  children?: QueryNodeData[];
  next?: QueryNodeData;
  /** Whether the node is expanded initially */
  defaultOpen?: boolean;
}

function MetricList({ metrics }: { metrics?: QueryMetric[] }) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <Box component="dl" sx={{
      m: 0,
      mt: 1,
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "max-content 1fr" },
      columnGap: 2,
      rowGap: 0.5,
    }}>
      {metrics.map((m, idx) => (
        <React.Fragment key={idx}>
          <Box component="dt" sx={{ fontWeight: 600 }}>{m.label}</Box>
          <Box component="dd" sx={{ m: 0 }}>
            {m.kind === "meter" && (
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <Box
                  component="meter"
                  min={m.min ?? 0}
                  max={m.max ?? 100}
                  value={m.value}
                  low={m.low}
                  high={m.high}
                  optimum={m.optimum}
                  aria-label={m.label}
                  sx={{ width: 160, verticalAlign: "middle" }}
                />
                <Typography component="span" variant="body2">
                  {m.format ? m.format(m.value) : String(m.value)}
                </Typography>
              </Box>
            )}
            {m.kind === "text" && <Typography component="span" variant="body2">{m.value}</Typography>}
            {m.kind === "code" && (
              <Box component="code" sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: "action.selected",
                fontSize: "0.85rem",
                display: "inline-block",
              }}>{m.value}</Box>
            )}
            {m.kind === "time" && (
              <Box component="time" dateTime={m.datetime} sx={{ fontFamily: "monospace" }}>
                {m.display ?? new Date(m.datetime).toLocaleString()}
              </Box>
            )}
            {m.kind === "data" && (
              <Box component="data" value={String(m.value)} sx={{ fontFamily: "monospace" }}>
                {String(m.value)}
              </Box>
            )}
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
}

function StatusChip({ status }: { status?: QueryNodeData["status"] }) {
  if (!status) return null;
  const color =
    status === "ok" ? "success" :
    status === "idle" ? "warning" :
    status === "failed" ? "error" :
    "default";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Chip size="small" color={color as any} label={label} sx={{ fontWeight: 600, position: 'absolute', bottom: 10, right: 10, padding:0 }} />;
}

export function QueryNode({
  id,
  stage,
  title,
  connector,
  status,
  durationMs,
  rows,
  timestamp,
  metrics,
  children,
  defaultOpen = false,
}: QueryNodeData) {
  return (
    <Box component="li" sx={{ listStyle: "none", pl: 1 }}>
      <Box component="details" open={defaultOpen} sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.25,
        '&[open]': { boxShadow: 1 },
      }}>      
        <Box component="summary" sx={{
          listStyle: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1,
          '&::-webkit-details-marker': { display: "none" },
        }}>
          {/* Left marker / caret via CSS triangle */}
          <Box aria-hidden sx={{
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "5px 0 5px 8px",
            borderColor: "transparent transparent transparent",
            mr: 1,
            transition: "transform .15s ease",
            // rotate when open
            ["details[open] > &" as any]: { transform: "rotate(90deg)" },
            // color using currentColor
            color: "text.secondary",
            borderLeftColor: "currentColor",
          }} />

          <Typography component="span" variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title ?? stage}
          </Typography>

          {connector && (
            <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
              • Connector: {connector}
            </Typography>
          )}

          {typeof rows === "number" && (
            <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
              • Rows: <Box component="data" value={rows} sx={{ fontFamily: "monospace" }}>{rows.toLocaleString()}</Box>
            </Typography>
          )}

          {typeof durationMs === "number" && (
            <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
              • Duration: <Box component="data" value={durationMs} sx={{ fontFamily: "monospace" }}>{durationMs} ms</Box>
            </Typography>
          )}

          {timestamp && (
            <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
              • <Box component="time" dateTime={timestamp}>{new Date(timestamp).toLocaleTimeString()}</Box>
            </Typography>
          )}

          <Box sx={{ ml: "auto" }}>
            <StatusChip status={status} />
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ mt: 1.25 }}>
          {/* Identity row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>ID:</Typography>
            <Box component="code" sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: "action.hover",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}>
              <Box component="data" value={id}>{id}</Box>
            </Box>
          </Box>

          <MetricList metrics={metrics} />

          {children && children.length > 0 && (
            <>
              <Divider sx={{ my: 1.25 }} />
              <Box component="ul" sx={{
                pl: 2,
                m: 0,
                display: "grid",
                gap: 1,
                padding: 1,
                borderLeft: theme => `2px dashed ${theme.palette.divider}`,
              }}>
                {children.map(child => (
                    <QueryNode key={child.id} {...child} />
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// -----------------------------
// QueryTree (top-level wrapper)
// -----------------------------
export function QueryTree({ nodes }: { nodes: QueryNodeData[] }) {
  return (
    <Box component="ul" sx={{
      m: 0,
      p: 0,
      display: "grid",
      gap: 1,
    }}>
      {nodes.map(n => (
        <QueryNode key={n.id} {...n} />
      ))}
    </Box>
  );
}


export function QueryRFNode({ data }: { data: { node: QueryNodeData } }) {
  const n = data.node;
  const hasMetrics = n.metrics && n.metrics.length > 0;
  
  return (
    <Box role="group" aria-label={`${n.stage} ${n.title ?? ''}`} tabIndex={0}
      sx={{
        width: 300, 
        maxHeight: 450, 
        overflowY: 'auto',
        borderRadius: 2, 
        border: 3, 
        borderColor: '#1976d2',
        bgcolor: 'white',
        p: 2, 
        boxShadow: 4,
        '&:focus-visible': { boxShadow: 6, borderColor: 'primary.dark' },
        '&:hover': { boxShadow: 6, borderColor: 'primary.main' },
      }}>
      <ContentCopy sx={{ position: 'absolute', top: 8, right: 8, padding: 0.5, cursor: 'pointer', fontSize: 20, color: '#666' }} />
      <OpenInNew sx={{ position: 'absolute', top: 8, right: 42, padding: 0.5, cursor: 'pointer', fontSize: 20, color: '#666' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a' }}>
          {n.title ?? n.stage}
        </Typography>
        <Box sx={{ ml: 'auto' }}>{ StatusChip({ status: n.status })}</Box>
      </Box>
      {n.connector && (
        <Typography variant="body2" sx={{ color: '#555', display: 'block', mb: 1, fontWeight: 500 }}>
          Connector: {n.connector}
        </Typography>
      )}
      
      {/* Show basic metrics if no detailed metrics available */}
      {!hasMetrics && (
        <>
          <Divider sx={{ my: 1.5, borderColor: '#ccc' }} />
          <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 2, rowGap: 1, fontSize: '0.95rem' }}>
            {typeof n.rows === 'number' && (
              <>
                <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Rows</Box>
                <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{n.rows.toLocaleString()}</Box>
              </>
            )}
            {typeof n.durationMs === 'number' && (
              <>
                <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Duration</Box>
                <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{n.durationMs} ms</Box>
              </>
            )}
          </Box>
        </>
      )}
      
      {/* Show detailed metrics if available */}
      {hasMetrics && (
        <>
          <Divider sx={{ my: 1.5, borderColor: '#ccc' }} />
          <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 2, rowGap: 0.75 }}>
            {n.metrics!.slice(0, 6).map((metric, idx) => (
              <React.Fragment key={idx}>
                <Box component="dt" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#333' }}>
                  {metric.label}:
                </Box>
                <Box component="dd" sx={{ m: 0, fontSize: '0.85rem', color: '#1a1a1a', fontWeight: 600 }}>
                  {metric.kind === 'text' ? metric.value : String(metric.value)}
                </Box>
              </React.Fragment>
            ))}
          </Box>
          {n.metrics!.length > 6 && (
            <Typography variant="body2" sx={{ display: 'block', mt: 1, fontStyle: 'italic', color: '#666', fontWeight: 500 }}>
              +{n.metrics!.length - 6} more metrics
            </Typography>
          )}
        </>
      )}
      
      <Handle id="inTop"     type="target" position={Position.Top} style={{ background: '#1976d2', width: 12, height: 12 }} />
      <Handle id="outBottom" type="source" position={Position.Bottom} style={{ background: '#1976d2', width: 12, height: 12 }} />
      <Handle id="in"        type="target" position={Position.Left} style={{ background: '#1976d2', width: 12, height: 12 }} />
      <Handle id="out"       type="source" position={Position.Right} style={{ background: '#1976d2', width: 12, height: 12 }} />
    </Box>
  );
}



