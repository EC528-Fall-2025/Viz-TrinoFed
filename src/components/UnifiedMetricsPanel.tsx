import { QueryTree, AIAnalysisResponse, Fragment } from '../types/api.types';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Database, DatabaseSchema, DatabaseTable } from '../types/database.types';
import CopyPaste from './CopyPaste';
import { apiService } from '../services/api.service';
import { OperatorTree } from './OperatorTree';

interface UnifiedMetricsPanelProps {
  query: QueryTree;
  selectedFragment?: Fragment | null;
  selectedDatabase?: Database | null;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

const MOBILE_BREAKPOINT = 768;

const UnifiedMetricsPanel = ({ 
  query, 
  selectedFragment, 
  selectedDatabase,
  isOpen = true,
  onClose,
  onOpen
}: UnifiedMetricsPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [showMemoryMetrics, setShowMemoryMetrics] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // AI Analysis State
  const [aiAvailable, setAiAvailable] = useState<boolean>(false);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResponse | null>(null);

  // Check AI availability on mount
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const status = await apiService.getAIStatus();
        setAiAvailable(status.available);
      } catch (error) {
        console.error('Error checking AI status:', error);
        setAiAvailable(false);
      }
    };
    checkAIStatus();
  }, []);

  // Mobile detection
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

  // Find events with statistics
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

  // Aggregated metrics calculation
  const aggregated = useMemo(() => {
    let cpuTimeMs = 0;
    let wallTimeMs = 0;
    let queuedTimeMs = 0;
    let peakMemory = 0;
    let totalRows: number | undefined;
    let totalBytes: number | undefined;
    let completedSplits: number | undefined;
    const catalogs = new Set<string>();
    const schemas = new Set<string>();

    (query.events ?? []).forEach((event) => {
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
  }, [query.events]);

  // AI Analysis Handler
  const handleAnalyzeQuery = async () => {
    setAiAnalyzing(true);
    try {
      const result = await apiService.analyzeQuery(query.queryId);
      setAiResult(result);
    } catch (error) {
      console.error('Error analyzing query:', error);
      setAiResult({
        queryId: query.queryId,
        originalQuery: query.query,
        optimizedQuery: null,
        bottleneckAnalysis: null,
        suggestions: null,
        expectedImprovement: null,
        error: 'Failed to analyze query: ' + (error as Error).message,
        available: false,
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Helper formatting functions
  const formatBytes = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return '0 B';
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

  const renderMetricRow = (label: string, value: string | number | null, icon: string = '•') => {
    if (!value && value !== 0) return null;
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        padding: '4px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}>
        <span style={{ color: '#6c757d', fontSize: '11px' }}>
          <span style={{ marginRight: '6px' }}>{icon}</span>
          {label}
        </span>
        <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#212529' }}>
          {value}
        </span>
      </div>
    );
  };

  const renderSection = (title: string, icon: string, children: React.ReactNode) => (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        fontWeight: '600',
        fontSize: '12px',
        marginBottom: '8px',
        color: '#495057',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );

  // Calculate display values
  const cpuTimeSeconds = aggregated.cpuTimeMs ? aggregated.cpuTimeMs / 1000 : null;
  const cpuTimeDisplay = cpuTimeSeconds != null ? formatSeconds(cpuTimeSeconds) : 'N/A';
  const wallTimeDisplay = aggregated.wallTimeMs != null ? formatSeconds(aggregated.wallTimeMs / 1000) : 'N/A';
  const queuedTimeDisplay = aggregated.queuedTimeMs != null ? formatSeconds(aggregated.queuedTimeMs / 1000) : 'N/A';
  const totalExecutionDisplay = query.totalExecutionTime != null ? `${query.totalExecutionTime}ms` : 'N/A';
  const totalRowsDisplay = formatNumber(aggregated.totalRows);
  const outputBytesDisplay = formatBytes(aggregated.totalBytes);

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

  // --- 1. Render logic for when a database is selected ---
  if (selectedDatabase) {
    const db = selectedDatabase;
    return (
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        backgroundColor: 'white',
        padding: '14px 18px',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        minWidth: '400px',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflow: 'auto',
        fontSize: '12px',
        borderLeft: `5px solid ${db.status === 'ACTIVE' ? '#51cf66' : '#ff6b6b'}`
      }}>
        {/* Header */}
        <div style={{
          fontWeight: 'bold',
          marginBottom: '12px',
          fontSize: '17px',
          color: '#212529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗄️</span>
            <span>Database: {db.name}</span>
          </div>
          <span style={{
            color: db.status === 'ACTIVE' ? '#2b8a3e' : '#c92a2a',
            fontWeight: 'bold',
            backgroundColor: db.status === 'ACTIVE' ? '#d3f9d8' : '#ffe3e3',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            display: 'inline-block'
          }}>
            {db.status}
          </span>
        </div>

        {/* Basic Info */}
        {renderSection('Details', '📋',
          <>
            {renderMetricRow('Type', db.type, '•')}
            {renderMetricRow('Host', db.host ? `${db.host}:${db.port}` : 'N/A', '•')}
            {renderMetricRow('Total Queries', db.totalQueries, '•')}
            {renderMetricRow('Last Seen', formatTimestamp(db.lastSeen), '•')}
          </>
        )}

        {/* Schema Details */}
        {db.schemas && db.schemas.length > 0 && renderSection('Schemas', '🗂️',
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {db.schemas.map((schema: DatabaseSchema) => (
              <div key={schema.name} style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1971c2', marginBottom: '8px' }}>
                  Schema: {schema.name}
                </div>
                {schema.tables && schema.tables.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {schema.tables.map((table: DatabaseTable) => (
                      <div key={table.name} style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#212529', marginBottom: '6px' }}>
                          Table: {table.name}
                        </div>
                        {table.columns && table.columns.length > 0 ? (
                          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {table.columns.map(col => (
                              <div key={col.name}>
                                <span>• {col.name}:</span>
                                <span style={{ color: '#0b7285', marginLeft: '4px' }}>{col.type}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#6c757d', fontStyle: 'italic' }}>No columns found.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#6c757d', fontStyle: 'italic' }}>No tables found in this schema.</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Collection Details (for MongoDB) */}
        {db.collections && db.collections.length > 0 && renderSection('Collections', '🗂️',
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {db.collections.map((coll) => (
              <div key={coll.name} style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2b8a3e', marginBottom: '8px' }}>
                  Collection: {coll.name}
                </div>
                {coll.fields && coll.fields.length > 0 ? (
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {coll.fields.map(field => (
                      <div key={field.name}>
                        <span>• {field.name}:</span>
                        <span style={{ color: '#0b7285', marginLeft: '4px' }}>{field.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: '#6c757d', fontStyle: 'italic' }}>No fields found.</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- 2. Render logic for when a fragment is selected ---
  if (selectedFragment) {
    const fragment = selectedFragment;
    return (
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        backgroundColor: 'white',
        padding: '14px 18px',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        maxWidth: '600px',
        minWidth: '450px',  
        maxHeight: '90vh',
        overflow: 'auto',
        fontSize: '12px',
        borderLeft: `5px solid #1976d2`
      }}>
        {/* Header */}
        <div style={{
          fontWeight: 'bold',
          marginBottom: '12px',
          fontSize: '17px',
          color: '#212529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧩</span>
            <span>Fragment {fragment.fragmentId}</span>
          </div>
          <span style={{
            color: '#1971c2',
            fontWeight: 'bold',
            backgroundColor: '#d0ebff',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            display: 'inline-block',
          }}>
            {fragment.partitioningType}
          </span>
        </div>

        {/* Performance Metrics */}
        {renderSection('Performance', '⚡',
          <>
            {renderMetricRow('CPU Time', fragment.cpuTime, '🖥️')}
            {renderMetricRow('Scheduled', fragment.scheduledTime, '⏳')}
            {renderMetricRow('Blocked', fragment.blockedTime, '⏰')}
            {renderMetricRow('Task Count', fragment.taskCount, '📦')}
            {renderMetricRow('Peak Memory', fragment.peakMemory, '🧠')}
          </>
        )}

        {/* Input Data */}
        {renderSection('Input', '📊',
          <>
            {renderMetricRow('Input Rows', formatNumber(fragment.inputRows), '•')}
            {renderMetricRow('Input Size', fragment.inputBytes, '•')}
          </>
        )}

        {/* Output Data */}
        {renderSection('Output', '📊',
          <>
            {renderMetricRow('Output Rows', formatNumber(fragment.outputRows), '•')}
            {renderMetricRow('Output Size', fragment.outputBytes, '•')}
          </>
        )}

        {/* Operators Section */}
        {fragment.operators && fragment.operators.length > 0 &&
          renderSection(`Operators (${fragment.operators.length})`, '⚙️',
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <OperatorTree operators={fragment.operators} />
            </div>
          )
        }

        {/* Output Layout */}
        {fragment.outputLayout &&
          renderSection('Output Layout', '📋',
            <div style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              backgroundColor: '#f8f9fa',
              padding: '8px 10px',
              borderRadius: '5px',
              border: '1px solid #dee2e6',
              color: '#212529',
              wordBreak: 'break-all'
            }}>
              {fragment.outputLayout}
            </div>
          )
        }

        {/* Output Partitioning */}
        {fragment.outputPartitioning &&
          renderSection('Output Partitioning', '📋',
            <div style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              backgroundColor: '#f8f9fa',
              padding: '8px 10px',
              borderRadius: '5px',
              border: '1px solid #dee2e6',
              color: '#212529',
              wordBreak: 'break-all'
            }}>
              {fragment.outputPartitioning}
            </div>
          )
        }
      </div>
    );
  }

  // --- 3. DEFAULT: Render query-wide metrics ---
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

        {renderSection('Basic Information', '📝',
          <>
            {renderMetricRow('Query ID', query.queryId ?? 'N/A', '🔑')}
            {renderMetricRow('User', query.user ?? 'N/A', '👤')}
            {renderMetricRow('Event Count', formatNumber(query.events?.length ?? 0), '📝')}
            {renderMetricRow('Start Time', formatTimestamp(query.startTime), '🕐')}
            {renderMetricRow('End Time', formatTimestamp(query.endTime), '🕑')}
            {renderMetricRow('Duration', queryDurationDisplay, '⏱️')}
          </>
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
          renderSection('Instant Metrics', '📊',
            <>
              {renderMetricRow('CPU Time', formatSeconds(stats.cpuTime), '🖥️')}
              {renderMetricRow('Wall Time', formatSeconds(stats.wallTime), '⏰')}
              {renderMetricRow('Queued Time', formatSeconds(stats.queuedTime), '⏳')}
              {renderMetricRow('Peak Memory', formatBytes(stats.peakUserMemoryBytes), '🧠')}
            </>
          )
        )}

        {renderSection('Aggregated Performance', '⚡',
          <>
            {renderMetricRow('Total Execution', totalExecutionDisplay, '⏱️')}
            {renderMetricRow('CPU Time', cpuTimeDisplay, '🖥️')}
            {renderMetricRow('Wall Time', wallTimeDisplay, '⏰')}
            {renderMetricRow('Queued Time', queuedTimeDisplay, '⏳')}
            {renderMetricRow('Peak Memory', peakMemoryDisplay, '🧠')}
          </>
        )}

        {renderSection('Data Metrics', '💾',
          <>
            {renderMetricRow('Total Rows', totalRowsDisplay, '📊')}
            {renderMetricRow('Output Data', outputBytesDisplay, '📤')}
            {renderMetricRow('Completed Splits', formatNumber(aggregated.completedSplits ?? null), '✂️')}
          </>
        )}

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
              {renderMetricRow('Peak Memory', peakMemoryDisplay, '🧠')}
              {renderMetricRow('Peak Task Memory', stats?.peakTaskTotalMemory ? formatBytes(stats.peakTaskTotalMemory) : 'N/A', '🗄️')}
            </div>
          )}
        </div>

        {stats?.operatorSummaries && stats.operatorSummaries.length > 0 && (
          renderSection('Operator Summaries', '⚙️',
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
          )
        )}

        {(aggregated.catalogs.length > 0 || aggregated.schemas.length > 0) && (
          renderSection('Catalogs & Schemas', '🗂️',
            <>
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
            </>
          )
        )}

        {/* SQL Query Section */}
        {query.query &&
          renderSection('SQL Query', '💻',
            <div style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              backgroundColor: '#f8f9fa',
              padding: '8px 10px',
              borderRadius: '5px',
              maxHeight: '100px',
              overflow: 'auto',
              border: '1px solid #dee2e6',
              color: '#212529',
              lineHeight: '1.4'
            }}>
              {query.query}
            </div>
          )
        }

        {/* AI Query Optimization Section */}
        {renderSection('AI Query Optimization', '🤖',
          <div>
            <div style={{ marginBottom: '10px' }}>
              <button
                onClick={handleAnalyzeQuery}
                disabled={!aiAvailable || aiAnalyzing}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: aiAvailable ? '#1971c2' : '#adb5bd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: aiAvailable ? 'pointer' : 'not-allowed',
                  opacity: aiAnalyzing ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (aiAvailable && !aiAnalyzing) {
                    e.currentTarget.style.backgroundColor = '#1864ab';
                  }
                }}
                onMouseLeave={(e) => {
                  if (aiAvailable) {
                    e.currentTarget.style.backgroundColor = '#1971c2';
                  }
                }}
              >
                {aiAnalyzing ? '🔄 Analyzing...' : aiAvailable ? '✨ Analyze Query with AI' : '⚠️ AI Feature Not Configured'}
              </button>
              {!aiAvailable && (
                <div style={{
                  fontSize: '10px',
                  color: '#868e96',
                  marginTop: '6px',
                  textAlign: 'center'
                }}>
                  Configure AWS Bedrock credentials to enable AI analysis
                </div>
              )}
            </div>

            {aiResult && (
              <div style={{
                marginTop: '12px',
                backgroundColor: aiResult.error ? '#ffe3e3' : '#e7f5ff',
                padding: '10px',
                borderRadius: '6px',
                border: `2px solid ${aiResult.error ? '#ff6b6b' : '#1971c2'}`
              }}>
                {aiResult.error ? (
                  <div style={{ color: '#c92a2a', fontSize: '11px' }}>
                    <strong>Error:</strong> {aiResult.error}
                  </div>
                ) : (
                  <>
                    {/* Bottleneck Analysis */}
                    {aiResult.bottleneckAnalysis && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px', color: '#1971c2' }}>
                          📊 Bottleneck Analysis
                        </div>
                        <div style={{ fontSize: '10px', color: '#495057', lineHeight: '1.5' }}>
                          {aiResult.bottleneckAnalysis}
                        </div>
                      </div>
                    )}

                    {/* Optimized Query */}
                    {aiResult.optimizedQuery && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px', color: '#1971c2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>✨ Optimized Query</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(aiResult.optimizedQuery || '')}
                            style={{
                              backgroundColor: 'white',
                              border: '1px solid #1971c2',
                              color: '#1971c2',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              cursor: 'pointer'
                            }}
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          backgroundColor: 'white',
                          padding: '8px 10px',
                          borderRadius: '5px',
                          maxHeight: '150px',
                          overflow: 'auto',
                          border: '1px solid #339af0',
                          color: '#212529',
                          lineHeight: '1.4'
                        }}>
                          {aiResult.optimizedQuery}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px', color: '#1971c2' }}>
                          💡 Optimization Suggestions
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '10px', color: '#495057' }}>
                          {aiResult.suggestions.map((suggestion, idx) => (
                            <li key={idx} style={{ marginBottom: '4px', lineHeight: '1.5' }}>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Expected Improvement */}
                    {aiResult.expectedImprovement && (
                      <div style={{
                        backgroundColor: '#d3f9d8',
                        padding: '8px',
                        borderRadius: '5px',
                        borderLeft: '3px solid #51cf66'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px', color: '#2b8a3e' }}>
                          🎯 Expected Improvement
                        </div>
                        <div style={{ fontSize: '10px', color: '#2b8a3e', lineHeight: '1.5' }}>
                          {aiResult.expectedImprovement}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Section */}
        {query.errorMessage &&
          renderSection('⚠️ Error Details', '🚨',
            <div style={{
              backgroundColor: '#ffe3e3',
              color: '#c92a2a',
              padding: '8px',
              borderRadius: '5px',
              fontSize: '10px',
              borderLeft: '3px solid #c92a2a'
            }}>
              {query.errorMessage}
            </div>
          )
        }

        {/* Individual Event Details */}
        {query.events && query.events.length > 0 &&
          renderSection(`Event Timeline (${query.events.length})`, '⏳',
            <>
              {query.events.map((event, idx) => (
                <div key={idx} style={{
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '5px',
                  borderLeft: `3px solid ${
                    event.state === 'FINISHED' ? '#51cf66' :
                    event.state === 'FAILED' ? '#ff6b6b' :
                    event.state === 'RUNNING' ? '#ffd43b' : '#74c0fc'
                  }`
                }}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '11px',
                    color: '#212529',
                    marginBottom: '5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{event.eventType}</span>
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: 'white',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      fontWeight: 'normal',
                      color: '#6c757d'
                    }}>
                      {event.state}
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#868e96', marginBottom: '5px' }}>
                    {formatTimestamp(event.timestamp)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#495057' }}>
                    {event.cpuTimeMs && <div>CPU: {event.cpuTimeMs}ms</div>}
                    {event.wallTimeMs && <div>Wall: {event.wallTimeMs}ms</div>}
                    {event.queuedTimeMs && <div>Queued: {event.queuedTimeMs}ms</div>}
                    {event.totalRows && <div>Rows: {formatNumber(event.totalRows)}</div>}
                    {event.totalBytes && <div>Data: {formatBytes(event.totalBytes)}</div>}
                    {event.peakMemoryBytes && <div>Memory: {formatBytes(event.peakMemoryBytes)}</div>}
                    {event.completedSplits && <div>Splits: {event.completedSplits}</div>}
                    {event.errorMessage && (
                      <div style={{ color: '#c92a2a', marginTop: '3px', fontWeight: 'bold' }}>
                        Error: {event.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )
        }
      </div>
    </>
  );
};

export default UnifiedMetricsPanel;
