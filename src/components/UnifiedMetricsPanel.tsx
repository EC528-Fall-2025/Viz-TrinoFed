import { QueryTree, QueryEvent, Fragment } from '../types/api.types';
import { Database, DatabaseSchema, DatabaseTable } from '../types/database.types';
import { useState, useRef } from 'react';
import CopyPaste from './CopyPaste';

interface UnifiedMetricsPanelProps {
  query: QueryTree;
  selectedFragment?: Fragment | null;
  selectedDatabase?: Database | null; // NEW: Prop for selected database
}

const UnifiedMetricsPanel = ({ query, selectedFragment, selectedDatabase }: UnifiedMetricsPanelProps) => {
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Find events with statistics
  const eventsWithStats = query.events?.filter(e => e.statistics) || [];
  const selectedEvent = eventsWithStats.length > 0 ? eventsWithStats[selectedEventIndex] : null;
  const stats = selectedEvent?.statistics as Record<string, any> | null;

  const formatBytes = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (!num && num !== 0) return 'N/A';
    return num.toLocaleString();
  };

  const formatTime = (time: number | null | undefined): string => {
    if (!time && time !== 0) return 'N/A';
    if (time < 1) return `${(time * 1000).toFixed(2)} ms`;
    if (time < 60) return `${time.toFixed(2)} s`;
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    return `${minutes}m ${seconds}s`;
  };

  const formatTimestamp = (timestamp: string | null | undefined): string | null => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (start: string | null | undefined, end: string | null | undefined): string | null => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  const getEventMetrics = (events: QueryEvent[]) => {
    const metrics: Record<string, any> = {};

    let totalCpuTime = 0;
    let totalWallTime = 0;
    let totalQueuedTime = 0;
    let maxMemory = 0;
    let totalRows = 0;
    let totalBytes = 0;
    let completedSplits = 0;

    events.forEach(event => {
      if (event.cpuTimeMs) totalCpuTime += event.cpuTimeMs;
      if (event.wallTimeMs) totalWallTime += event.wallTimeMs;
      if (event.queuedTimeMs) totalQueuedTime += event.queuedTimeMs;
      if (event.peakMemoryBytes && event.peakMemoryBytes > maxMemory) {
        maxMemory = event.peakMemoryBytes;
      }
      if (event.totalRows) totalRows = event.totalRows;
      if (event.totalBytes) totalBytes = event.totalBytes;
      if (event.completedSplits) completedSplits = event.completedSplits;
    });

    if (totalCpuTime > 0) metrics.cpuTime = totalCpuTime;
    if (totalWallTime > 0) metrics.wallTime = totalWallTime;
    if (totalQueuedTime > 0) metrics.queuedTime = totalQueuedTime;
    if (maxMemory > 0) metrics.peakMemory = maxMemory;
    if (totalRows > 0) metrics.totalRows = totalRows;
    if (totalBytes > 0) metrics.totalBytes = totalBytes;
    if (completedSplits > 0) metrics.completedSplits = completedSplits;

    const catalogs = [...new Set(events.map(e => e.catalog).filter(Boolean))];
    const schemas = [...new Set(events.map(e => e.schema).filter(Boolean))];
    if (catalogs.length > 0) metrics.catalogs = catalogs;
    if (schemas.length > 0) metrics.schemas = schemas;

    return metrics;
  };

  const eventMetrics = getEventMetrics(query.events || []);
  const duration = formatDuration(query.startTime, query.endTime);

  const renderMetricRow = (label: string, value: string | number | null, icon: string = '•') => {
    if (!value && value !== 0) return null; // Allow 0 to be displayed
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

  const renderMetricCard = (title: string, value: string | number, icon: string, color: string) => (
    <div style={{
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '6px',
      border: `2px solid ${color}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '4px' }}>
        <span style={{ marginRight: '4px' }}>{icon}</span>
        {title}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: color }}>
        {value}
      </div>
    </div>
  );

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
        gap: '6px'
      }}>
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );

  const renderDistribution = (dist: any[] | null | undefined, label: string) => {
    if (!dist || dist.length === 0) return null;

    return (
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#495057' }}>
          {label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '9px' }}>
          {dist.slice(0, 9).map((item: any, idx: number) => (
            <div key={idx} style={{
              padding: '5px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#6c757d', marginBottom: '2px' }}>P{item.percentile || idx}</div>
              <div style={{ fontWeight: 'bold', color: '#212529' }}>{formatTime(item.value)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOperatorSummaries = (operators: any[] | null | undefined) => {
    if (!operators || operators.length === 0) return null;

    return (
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#495057' }}>
          Operator Performance
        </div>
        <div style={{ maxHeight: '250px', overflow: 'auto' }}>
          {operators.slice(0, 10).map((op: any, idx: number) => (
            <div key={idx} style={{
              padding: '8px',
              marginBottom: '6px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              borderLeft: '3px solid #1971c2'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '5px', color: '#212529' }}>
                {op.operatorType || `Operator ${idx + 1}`}
                {op.planNodeId && <span style={{ color: '#6c757d', marginLeft: '6px', fontWeight: 'normal' }}>
                  (Node: {op.planNodeId})
                </span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '9px' }}>
                <div>
                  <span style={{ color: '#6c757d' }}>Input: </span>
                  <span style={{ fontWeight: 'bold' }}>{formatNumber(op.inputPositions)} rows</span>
                </div>
                <div>
                  <span style={{ color: '#6c757d' }}>Output: </span>
                  <span style={{ fontWeight: 'bold' }}>{formatNumber(op.outputPositions)} rows</span>
                </div>
                <div>
                  <span style={{ color: '#6c757d' }}>CPU: </span>
                  <span style={{ fontWeight: 'bold' }}>{op.addInputCpu ? formatTime(parseFloat(op.addInputCpu) / 1000000000) : 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: '#6c757d' }}>Blocked: </span>
                  <span style={{ fontWeight: 'bold' }}>{op.blockedWall ? formatTime(parseFloat(op.blockedWall) / 1000000000) : 'N/A'}</span>
                </div>
              </div>:
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTaskStatistics = (tasks: any[] | null | undefined) => {
    if (!tasks || tasks.length === 0) return null;

    return (
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#495057' }}>
          Task Distribution
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {tasks.slice(0, 6).map((task: any, idx: number) => (
            <div key={idx} style={{
              padding: '6px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              fontSize: '9px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px', color: '#212529' }}>
                Task {idx + 1}
              </div>
              <div style={{ color: '#6c757d' }}>
                {task.totalDrivers && <div>Drivers: {task.totalDrivers}</div>}
                {task.cumulativeUserMemory && <div>Memory: {formatBytes(task.cumulativeUserMemory)}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
        borderLeft: `5px solid ${db.status === 'ACTIVE' ? '#51cf66' : '#ff6b6b'}` // Green/Red accent for status
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
        maxWidth: '550px',
        maxHeight: '90vh',
        overflow: 'auto',
        fontSize: '12px',
        borderLeft: `5px solid #1976d2` // Blue accent for fragment
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
            display: 'inline-block'
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

        {/* Operators */}
        {fragment.operators && fragment.operators.length > 0 &&
          renderSection(`Operators (${fragment.operators.length})`, '⚙️',
            <div style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              backgroundColor: '#f8f9fa',
              padding: '8px 10px',
              borderRadius: '5px',
              maxHeight: '200px',
              overflow: 'auto',
              border: '1px solid #dee2e6',
              color: '#212529',
              lineHeight: '1.4',
              whiteSpace: 'pre'
            }}>
              {fragment.operators.join('\n')}
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

  // --- 3. DEFAULT: Render query-wide metrics (existing logic) ---
  return (
    <div 
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        backgroundColor: 'white',
        padding: '14px 18px',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflow: 'auto',
        fontSize: '12px',
        borderLeft: `5px solid ${
          query.state === 'FINISHED' ? '#51cf66' :
          query.errorMessage ? '#ff6b6b' :
          query.state === 'RUNNING' ? '#ffd43b' : '#74c0fc'
        }`
      }}
    >
      <CopyPaste 
        copyParentContent={true} 
        parentRef={panelRef}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          marginLeft: '20px',
          zIndex: 20
        }}
      />
      {/* Header */}
      <div style={{
        fontWeight: 'bold',
        marginBottom: '12px',
        marginRight: '10px',
        fontSize: '17px',
        color: '#212529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px'}}>
          <span>📊</span>
          <span>Query Metrics & Statistics</span>
        </div>
        {/* Status Badge */}
        <span style={{
          color: query.state === 'FINISHED' ? '#2b8a3e' :
                 query.errorMessage ? '#c92a2a' :
                 query.state === 'RUNNING' ? '#f08c00' : '#1971c2',
          fontWeight: 'bold',
          backgroundColor: query.state === 'FINISHED' ? '#d3f9d8' :
                           query.errorMessage ? '#ffe3e3' :
                           query.state === 'RUNNING' ? '#fff3bf' : '#d0ebff',
          padding: '5px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          margin: '10px',
          display: 'inline-block'
        }}>
          {query.state}
        </span>
      </div>

      {/* Basic Info Section */}
      {renderSection('Basic Information', '📝',
        <>
          {renderMetricRow('Query ID', query.queryId, '🔑')}
          {renderMetricRow('User', query.user, '👤')}
          {renderMetricRow('Event Count', query.events?.length || 0, '📝')}
          {renderMetricRow('Start Time', formatTimestamp(query.startTime), '🕐')}
          {renderMetricRow('End Time', formatTimestamp(query.endTime), '🕑')}
          {renderMetricRow('Duration', duration, '⏱️')}
        </>
      )}

      {/* Event Selector for Detailed Statistics */}
      {eventsWithStats.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {eventsWithStats.length > 1 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '5px' }}>
                Select Event for Detailed Statistics
              </div>
              <select
                value={selectedEventIndex}
                onChange={(e) => setSelectedEventIndex(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '5px',
                  border: '1px solid #dee2e6',
                  fontSize: '11px',
                  backgroundColor: 'white'
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

      {/* Key Metrics Cards */}
      {stats && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {renderMetricCard('CPU Time', formatTime(stats.cpuTime), '🖥️', '#1971c2')}
            {renderMetricCard('Wall Time', formatTime(stats.wallTime), '⏰', '#2b8a3e')}
            {renderMetricCard('Queued Time', formatTime(stats.queuedTime), '⏳', '#f08c00')}
            {renderMetricCard('Peak Memory', formatBytes(stats.peakUserMemoryBytes), '🧠', '#9c36b5')}
          </div>
        </div>
      )}

      {/* Performance Metrics Section (from event aggregation) */}
      {renderSection('Aggregated Performance', '⚡',
        <>
          {renderMetricRow('Total Execution', query.totalExecutionTime ? `${query.totalExecutionTime}ms` : null, '⏱️')}
          {renderMetricRow('CPU Time', eventMetrics.cpuTime ? `${eventMetrics.cpuTime}ms` : null, '🖥️')}
          {renderMetricRow('Wall Time', eventMetrics.wallTime ? `${eventMetrics.wallTime}ms` : null, '⏰')}
          {renderMetricRow('Queued Time', eventMetrics.queuedTime ? `${eventMetrics.queuedTime}ms` : null, '⏳')}
          {renderMetricRow('Peak Memory', formatBytes(eventMetrics.peakMemory), '🧠')}
        </>
      )}

      {/* Data Flow Section */}
      {stats && renderSection('Data Flow', '📊',
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <div style={{ padding: '7px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <div style={{ fontSize: '9px', color: '#6c757d' }}>Physical Input</div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1971c2' }}>
              {formatNumber(stats.physicalInputRows)} rows
            </div>
            <div style={{ fontSize: '9px', color: '#868e96' }}>
              {formatBytes(stats.physicalInputBytes)}
            </div>
          </div>
          <div style={{ padding: '7px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <div style={{ fontSize: '9px', color: '#6c757d' }}>Processed Input</div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#2b8a3e' }}>
              {formatNumber(stats.processedInputRows)} rows
            </div>
            <div style={{ fontSize: '9px', color: '#868e96' }}>
              {formatBytes(stats.processedInputBytes)}
            </div>
          </div>
          <div style={{ padding: '7px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <div style={{ fontSize: '9px', color: '#6c757d' }}>Output</div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#f08c00' }}>
              {formatNumber(stats.outputRows)} rows
            </div>
            <div style={{ fontSize: '9px', color: '#868e96' }}>
              {formatBytes(stats.outputBytes)}
            </div>
          </div>
          <div style={{ padding: '7px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <div style={{ fontSize: '9px', color: '#6c757d' }}>Completed Splits</div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#9c36b5' }}>
              {formatNumber(stats.completedSplits)}
            </div>
          </div>
        </div>
      )}

      {/* Data Metrics Section (from aggregation) */}
      {(eventMetrics.totalRows || eventMetrics.totalBytes || eventMetrics.completedSplits) &&
        renderSection('Data Metrics', '💾',
          <>
            {renderMetricRow('Total Rows', formatNumber(eventMetrics.totalRows), '📊')}
            {renderMetricRow('Total Data', formatBytes(eventMetrics.totalBytes), '💾')}
            {renderMetricRow('Completed Splits', formatNumber(eventMetrics.completedSplits), '✂️')}
          </>
        )
      }

      {/* CPU Time Distribution */}
      {stats?.cpuTimeDistribution && renderSection('CPU Time Distribution', '⏱️',
        renderDistribution(stats.cpuTimeDistribution, 'Percentiles')
      )}

      {/* Operator Summaries */}
      {stats?.operatorSummaries && renderSection('Operator Summaries', '⚙️',
        renderOperatorSummaries(stats.operatorSummaries)
      )}

      {/* Task Statistics */}
      {stats?.taskStatistics && renderSection('Task Statistics', '📦',
        renderTaskStatistics(stats.taskStatistics)
      )}

      {/* Additional Metrics */}
      {stats && renderSection('Additional Metrics', '📋',
        <div style={{ fontSize: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '6px' }}>
            <div>
              <span style={{ color: '#6c757d' }}>Scheduled Time: </span>
              <span style={{ fontWeight: 'bold' }}>{formatTime(stats.scheduledTime)}</span>
            </div>
            <div>
              <span style={{ color: '#6c757d' }}>Analysis Time: </span>
              <span style={{ fontWeight: 'bold' }}>{formatTime(stats.analysisTime)}</span>
            </div>
            <div>
              <span style={{ color: '#6c757d' }}>Planning Time: </span>
              <span style={{ fontWeight: 'bold' }}>{formatTime(stats.planningTime)}</span>
            </div>
            <div>
              <span style={{ color: '#6c757d' }}>Cumulative Memory: </span>
              <span style={{ fontWeight: 'bold' }}>{formatBytes(stats.cumulativeMemory)}</span>
            </div>
            {stats.spilledBytes > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#c92a2a', fontWeight: 'bold' }}>Spilled Data: </span>
                <span style={{ fontWeight: 'bold' }}>{formatBytes(stats.spilledBytes)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source Information */}
      {(eventMetrics.catalogs || eventMetrics.schemas) &&
        renderSection('Data Sources', '🗄️',
          <>
            {eventMetrics.catalogs && (
              <div style={{ marginBottom: '6px' }}>
                <div style={{ color: '#6c757d', fontSize: '10px', marginBottom: '4px' }}>
                  📚 Catalogs
                </div>
                <div style={{
                  display: 'flex',
                  gap: '5px',
                  flexWrap: 'wrap'
                }}>
                  {eventMetrics.catalogs.map((cat: string, idx: number) => (
                    <span key={idx} style={{
                      backgroundColor: '#e7f5ff',
                      color: '#1971c2',
                      padding: '3px 7px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {eventMetrics.schemas && (
              <div style={{ marginBottom: '6px' }}>
                <div style={{ color: '#6c757d', fontSize: '10px', marginBottom: '4px' }}>
                  🗂️ Schemas
                </div>
                <div style={{
                  display: 'flex',
                  gap: '5px',
                  flexWrap: 'wrap'
                }}>
                  {eventMetrics.schemas.map((schema: string, idx: number) => (
                    <span key={idx} style={{
                      backgroundColor: '#f3f0ff',
                      color: '#5f3dc4',
                      padding: '3px 7px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {schema}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      }

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
          query.events.map((event, idx) => (
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
          ))
        )
      }
    </div>
  );
};

export default UnifiedMetricsPanel;