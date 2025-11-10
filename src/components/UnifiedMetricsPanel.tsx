import { useEffect, useMemo, useRef, useState } from 'react';
import CopyPaste from './CopyPaste';
import { QueryTree, QueryEvent } from '../types/api.types';
import { QueryNodeData } from './Node';

interface UnifiedMetricsPanelProps {
  query: QueryTree;
  activeFragment?: QueryNodeData | null;
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

const MOBILE_BREAKPOINT = 768;

const formatBytes = (bytes?: number | null): string => {
  if (!bytes) return '0 B';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

const formatNumber = (value?: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  return value.toLocaleString();
};

const formatSeconds = (seconds?: number | null): string => {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return 'N/A';
  if (seconds < 0) return 'N/A';
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(2);
  return `${minutes}m ${remainder}s`;
};

const formatTimestamp = (timestamp?: string | null): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

interface AggregatedEvents {
  cpuTimeMs?: number;
  wallTimeMs?: number;
  queuedTimeMs?: number;
  peakMemory?: number;
  totalRows?: number;
  totalBytes?: number;
  completedSplits?: number;
  catalogs: string[];
  schemas: string[];
}

const aggregateEvents = (events: QueryEvent[]): AggregatedEvents => {
  let cpuTimeMs = 0;
  let wallTimeMs = 0;
  let queuedTimeMs = 0;
  let peakMemory = 0;
  let totalRows: number | undefined;
  let totalBytes: number | undefined;
  let completedSplits: number | undefined;
  const catalogs = new Set<string>();
  const schemas = new Set<string>();

  events.forEach((event) => {
    if (event.cpuTimeMs) cpuTimeMs += event.cpuTimeMs;
    if (event.wallTimeMs) wallTimeMs += event.wallTimeMs;
    if (event.queuedTimeMs) queuedTimeMs += event.queuedTimeMs;
    if (event.peakMemoryBytes && event.peakMemoryBytes > peakMemory) {
      peakMemory = event.peakMemoryBytes;
    }
    if (event.totalRows !== null && event.totalRows !== undefined) {
      totalRows = event.totalRows;
    }
    if (event.totalBytes !== null && event.totalBytes !== undefined) {
      totalBytes = event.totalBytes;
    }
    if (event.completedSplits !== null && event.completedSplits !== undefined) {
      completedSplits = event.completedSplits;
    }
    if (event.catalog) catalogs.add(event.catalog);
    if (event.schema) schemas.add(event.schema);
  });

  return {
    cpuTimeMs: cpuTimeMs > 0 ? cpuTimeMs : undefined,
    wallTimeMs: wallTimeMs > 0 ? wallTimeMs : undefined,
    queuedTimeMs: queuedTimeMs > 0 ? queuedTimeMs : undefined,
    peakMemory: peakMemory > 0 ? peakMemory : undefined,
    totalRows,
    totalBytes,
    completedSplits,
    catalogs: Array.from(catalogs),
    schemas: Array.from(schemas),
  };
};

const MetricRow: React.FC<{ label: string; icon: string; value: string; testId?: string }> = ({ label, icon, value, testId }) => (
  <div
    data-testid={testId}
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
      padding: '4px 0',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      fontSize: '11px',
      color: '#212529',
    }}
  >
    <span style={{ color: '#6c757d' }}>
      <span style={{ marginRight: '6px' }}>{icon}</span>
      {label}
    </span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);

const Section: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div style={{ marginBottom: '14px' }}>
    <div
      style={{
        fontWeight: 600,
        fontSize: '12px',
        marginBottom: '8px',
        color: '#495057',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span>{icon}</span>
      <span>{title}</span>
    </div>
    {children}
  </div>
);

const UnifiedMetricsPanel = ({ query, activeFragment, isOpen, onClose, onOpen }: UnifiedMetricsPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [showMemoryMetrics, setShowMemoryMetrics] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = (matches: boolean) => setIsMobile(matches);
    update(mq.matches);
    const listener = (event: MediaQueryListEvent) => update(event.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
    mq.addListener(listener);
    return () => mq.removeListener(listener);
  }, []);

  const eventsWithStats = useMemo(
    () => query.events?.filter((event) => event.statistics) ?? [],
    [query.events]
  );

  useEffect(() => {
    if (selectedEventIndex >= eventsWithStats.length) {
      setSelectedEventIndex(0);
    }
  }, [eventsWithStats, selectedEventIndex]);

  const selectedEvent = eventsWithStats[selectedEventIndex] ?? null;
  const stats = (selectedEvent?.statistics ?? null) as Record<string, any> | null;

  const aggregated = useMemo(() => aggregateEvents(query.events ?? []), [query.events]);
  const completedEvent = useMemo(
    () => query.events?.find((event) => event.eventType === 'COMPLETED') ?? null,
    [query]
  );

  const cpuTimeSeconds = completedEvent
    ? completedEvent.statistics?.cpuTime ?? (completedEvent.cpuTimeMs ?? 0) / 1000
    : null;

  const cpuTimeDisplay = cpuTimeSeconds != null ? formatSeconds(cpuTimeSeconds) : 'N/A';
  const wallTimeDisplay = aggregated.wallTimeMs != null ? formatSeconds(aggregated.wallTimeMs / 1000) : 'N/A';
  const queuedTimeDisplay = aggregated.queuedTimeMs != null ? formatSeconds(aggregated.queuedTimeMs / 1000) : 'N/A';
  const totalExecutionDisplay =
    query.totalExecutionTime != null ? `${query.totalExecutionTime}ms` : 'N/A';

  const inputRowsDisplay =
    typeof activeFragment?.rows === 'number' ? activeFragment.rows.toLocaleString() : 'N/A';

  const outputBytesDisplay = aggregated.totalBytes != null ? formatBytes(aggregated.totalBytes) : 'N/A';
  const totalRowsDisplay = aggregated.totalRows != null ? formatNumber(aggregated.totalRows) : 'N/A';

  const peakMemoryDisplay = stats?.peakUserMemoryBytes
    ? formatBytes(stats.peakUserMemoryBytes)
    : aggregated.peakMemory
    ? formatBytes(aggregated.peakMemory)
    : 'N/A';

  const queryDurationSeconds =
    query.startTime && query.endTime
      ? (new Date(query.endTime).getTime() - new Date(query.startTime).getTime()) / 1000
      : null;
  const queryDurationDisplay = formatSeconds(queryDurationSeconds);

  const panelClassName = `metrics-side-panel ${isMobile ? 'is-mobile-drawer' : 'is-desktop-panel'} ${
    isOpen ? 'is-open' : 'is-closed'
  }`;

  return (
    <>
      {isMobile && (
        <button
          type="button"
          data-testid="open-panel-button"
          onClick={() => onOpen?.()}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 11,
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Metrics
        </button>
      )}

      <div
        ref={panelRef}
        data-testid="metrics-side-panel"
        className={panelClassName}
        aria-hidden={!isOpen}
        style={{
          position: 'absolute',
          top: isMobile ? 16 : 10,
          left: isMobile ? undefined : 10,
          right: isMobile ? 16 : undefined,
          zIndex: 10,
          backgroundColor: 'white',
          padding: '14px 18px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          maxWidth: isMobile ? 'calc(100% - 32px)' : '550px',
          width: isMobile ? 'calc(100% - 32px)' : undefined,
          maxHeight: '90vh',
          overflow: 'auto',
          fontSize: '12px',
          borderLeft: `5px solid ${
            query.state === 'FINISHED'
              ? '#51cf66'
              : query.errorMessage
              ? '#ff6b6b'
              : query.state === 'RUNNING'
              ? '#ffd43b'
              : '#74c0fc'
          }`,
          display: isOpen ? 'block' : 'none',
        }}
      >
        {onClose && (
          <button
            type="button"
            data-testid="close-button"
            aria-label="Close metrics panel"
            onClick={() => onClose()}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: 4,
            }}
          >
            ×
          </button>
        )}

        <CopyPaste
          copyParentContent={true}
          parentRef={panelRef}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 20,
          }}
        />

        <div
          style={{
            fontWeight: 'bold',
            marginBottom: '12px',
            marginRight: '10px',
            fontSize: '17px',
            color: '#212529',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px' }}>
            <span>📊</span>
            <span>Query Metrics & Statistics</span>
          </div>
          <span
            style={{
              color:
                query.state === 'FINISHED'
                  ? '#2b8a3e'
                  : query.errorMessage
                  ? '#c92a2a'
                  : query.state === 'RUNNING'
                  ? '#f08c00'
                  : '#1971c2',
              fontWeight: 'bold',
              backgroundColor:
                query.state === 'FINISHED'
                  ? '#d3f9d8'
                  : query.errorMessage
                  ? '#ffe3e3'
                  : query.state === 'RUNNING'
                  ? '#fff3bf'
                  : '#d0ebff',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              margin: '10px',
              display: 'inline-block',
            }}
          >
            {query.state}
          </span>
        </div>

        <div
          data-testid="fragment-id"
          style={{ fontWeight: 600, fontSize: '13px', color: '#495057', marginBottom: '10px' }}
        >
          Fragment: {activeFragment ? activeFragment.id : 'None selected'}
        </div>

        <Section icon="📝" title="Basic Information">
          <MetricRow icon="🔑" label="Query ID" value={query.queryId ?? 'N/A'} />
          <MetricRow icon="👤" label="User" value={query.user ?? 'N/A'} />
          <MetricRow icon="📝" label="Event Count" value={formatNumber(query.events?.length ?? 0)} />
          <MetricRow icon="🕐" label="Start Time" value={formatTimestamp(query.startTime)} />
          <MetricRow icon="🕑" label="End Time" value={formatTimestamp(query.endTime)} />
          <MetricRow icon="⏱️" label="Duration" value={queryDurationDisplay} />
        </Section>

        {activeFragment && (
          <Section icon="🧩" title="Fragment Snapshot">
            <MetricRow icon="🛠️" label="Stage" value={activeFragment.stage ?? 'N/A'} />
            <MetricRow icon="🏷️" label="Status" value={activeFragment.status ?? 'unknown'} />
            <MetricRow
              icon="📥"
              label="Input Rows"
              value={inputRowsDisplay}
              testId="metric-input-rows"
            />
            <MetricRow
              icon="⏱️"
              label="Duration"
              value={
                typeof activeFragment.durationMs === 'number'
                  ? `${activeFragment.durationMs}ms`
                  : 'N/A'
              }
            />
          </Section>
        )}

        {eventsWithStats.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            {eventsWithStats.length > 1 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>
                  Select Event for Detailed Statistics
                </div>
                <select
                  value={selectedEventIndex}
                  onChange={(event) => setSelectedEventIndex(Number(event.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    borderRadius: '5px',
                    border: '1px solid #dee2e6',
                    fontSize: '11px',
                    backgroundColor: 'white',
                  }}
                >
                  {eventsWithStats.map((event, idx) => (
                    <option key={idx} value={idx}>
                      {event.eventType} - {event.state} ({event.timestamp})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {stats && (
          <Section icon="📊" title="Instant Metrics">
            <MetricRow icon="🖥️" label="CPU Time" value={formatSeconds(stats.cpuTime)} />
            <MetricRow icon="⏰" label="Wall Time" value={formatSeconds(stats.wallTime)} />
            <MetricRow icon="⏳" label="Queued Time" value={formatSeconds(stats.queuedTime)} />
            <MetricRow icon="🧠" label="Peak Memory" value={formatBytes(stats.peakUserMemoryBytes)} />
          </Section>
        )}

        <Section icon="⚡" title="Aggregated Performance">
          <MetricRow icon="⏱️" label="Total Execution" value={totalExecutionDisplay} />
          <MetricRow icon="🖥️" label="CPU Time" value={cpuTimeDisplay} testId="metric-cpu-time" />
          <MetricRow icon="⏰" label="Wall Time" value={wallTimeDisplay} />
          <MetricRow icon="⏳" label="Queued Time" value={queuedTimeDisplay} />
          <MetricRow icon="🧠" label="Peak Memory" value={peakMemoryDisplay} />
        </Section>

        <Section icon="💾" title="Data Metrics">
          <MetricRow icon="📊" label="Total Rows" value={totalRowsDisplay} />
          <MetricRow
            icon="📤"
            label="Output Data"
            value={outputBytesDisplay}
            testId="metric-output-bytes"
          />
          <MetricRow
            icon="✂️"
            label="Completed Splits"
            value={formatNumber(aggregated.completedSplits ?? null)}
          />
        </Section>

        <div style={{ marginBottom: '14px' }}>
          <div
            data-testid="metric-group-memory"
            role="button"
            onClick={() => setShowMemoryMetrics((prev) => !prev)}
            style={{
              fontWeight: 600,
              fontSize: '12px',
              color: '#495057',
              borderBottom: '2px solid #e9ecef',
              paddingBottom: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span>Memory Metrics</span>
            <span>{showMemoryMetrics ? '▲' : '▼'}</span>
          </div>
          {showMemoryMetrics && (
            <div style={{ marginTop: '8px' }}>
              <MetricRow
                icon="🧠"
                label="Peak Memory"
                value={peakMemoryDisplay}
                testId="metric-peak-memory"
              />
              <MetricRow
                icon="🗄️"
                label="Peak Task Memory"
                value={stats?.peakTaskTotalMemory ? formatBytes(stats.peakTaskTotalMemory) : 'N/A'}
              />
            </div>
          )}
        </div>

        {stats?.operatorSummaries && stats.operatorSummaries.length > 0 && (
          <Section icon="⚙️" title="Operator Summaries">
            <div style={{ maxHeight: '240px', overflow: 'auto' }}>
              {stats.operatorSummaries.slice(0, 8).map((op: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px',
                    marginBottom: '6px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    borderLeft: '3px solid #1971c2',
                    fontSize: '10px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#212529', marginBottom: '4px' }}>
                    {op.operatorType || `Operator ${idx + 1}`}
                    {op.planNodeId && (
                      <span style={{ color: '#6c757d', marginLeft: '6px', fontWeight: 400 }}>
                        (Node: {op.planNodeId})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '9px' }}>
                    <span>
                      <strong>Input:</strong> {formatNumber(op.inputPositions)} rows
                    </span>
                    <span>
                      <strong>Output:</strong> {formatNumber(op.outputPositions)} rows
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {(aggregated.catalogs.length > 0 || aggregated.schemas.length > 0) && (
          <Section icon="🗂️" title="Catalogs & Schemas">
            {aggregated.catalogs.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#495057' }}>
                  Catalogs
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {aggregated.catalogs.map((catalog) => (
                    <span
                      key={catalog}
                      style={{
                        backgroundColor: '#e9ecef',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#495057',
                      }}
                    >
                      {catalog}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {aggregated.schemas.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#495057' }}>
                  Schemas
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {aggregated.schemas.map((schema) => (
                    <span
                      key={schema}
                      style={{
                        backgroundColor: '#f1f3f5',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#495057',
                      }}
                    >
                      {schema}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}
      </div>
    </>
  );
};

export default UnifiedMetricsPanel;
