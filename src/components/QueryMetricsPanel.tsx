import { QueryTree, QueryEvent } from '../types/api.types';

interface QueryMetricsPanelProps {
  query: QueryTree;
}

const QueryMetricsPanel = ({ query }: QueryMetricsPanelProps) => {
  const formatBytes = (bytes: number | null): string | null => {
    if (!bytes || bytes === 0) return null;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const formatNumber = (num: number | null): string | null => {
    if (!num || num === 0) return null;
    return num.toLocaleString();
  };

  const formatTimestamp = (timestamp: string | null): string | null => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (start: string | null, end: string | null): string | null => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  const getEventMetrics = (events: QueryEvent[]) => {
    const metrics: Record<string, any> = {};
    
    // Aggregate metrics from all events
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

    // Get catalog and schema from events
    const catalogs = [...new Set(events.map(e => e.catalog).filter(Boolean))];
    const schemas = [...new Set(events.map(e => e.schema).filter(Boolean))];
    if (catalogs.length > 0) metrics.catalogs = catalogs;
    if (schemas.length > 0) metrics.schemas = schemas;

    return metrics;
  };

  const eventMetrics = getEventMetrics(query.events || []);
  const duration = formatDuration(query.startTime, query.endTime);

  const renderMetricRow = (label: string, value: string | number | null, icon: string = '•') => {
    if (!value) return null;
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        padding: '4px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}>
        <span style={{ color: '#6c757d', fontSize: '12px' }}>
          <span style={{ marginRight: '6px' }}>{icon}</span>
          {label}
        </span>
        <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#212529' }}>
          {value}
        </span>
      </div>
    );
  };

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 10,
      backgroundColor: 'white',
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      maxWidth: '420px',
      maxHeight: '85vh',
      overflow: 'auto',
      fontSize: '13px',
      borderLeft: `5px solid ${
        query.state === 'FINISHED' ? '#51cf66' :
        query.errorMessage ? '#ff6b6b' :
        query.state === 'RUNNING' ? '#ffd43b' : '#74c0fc'
      }`
    }}>
      {/* Header */}
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '12px',
        fontSize: '18px',
        color: '#212529',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📊</span>
        <span>Query Metrics</span>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ 
          color: query.state === 'FINISHED' ? '#2b8a3e' : 
                 query.errorMessage ? '#c92a2a' : 
                 query.state === 'RUNNING' ? '#f08c00' : '#1971c2',
          fontWeight: 'bold',
          backgroundColor: query.state === 'FINISHED' ? '#d3f9d8' : 
                           query.errorMessage ? '#ffe3e3' : 
                           query.state === 'RUNNING' ? '#fff3bf' : '#d0ebff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          display: 'inline-block'
        }}>
          {query.state}
        </span>
      </div>

      {/* Basic Info Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontWeight: '600', 
          fontSize: '14px', 
          marginBottom: '10px',
          color: '#495057',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '6px'
        }}>
          Basic Information
        </div>
        {renderMetricRow('Query ID', query.queryId, '🔑')}
        {renderMetricRow('User', query.user, '👤')}
        {renderMetricRow('Event Count', query.events?.length || 0, '📝')}
        {renderMetricRow('Start Time', formatTimestamp(query.startTime), '🕐')}
        {renderMetricRow('End Time', formatTimestamp(query.endTime), '🕑')}
        {renderMetricRow('Duration', duration, '⏱️')}
      </div>

      {/* Performance Metrics Section */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontWeight: '600', 
          fontSize: '14px', 
          marginBottom: '10px',
          color: '#495057',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '6px'
        }}>
          Performance Metrics
        </div>
        {renderMetricRow('Total Execution', query.totalExecutionTime ? `${query.totalExecutionTime}ms` : null, '⏱️')}
        {renderMetricRow('CPU Time', eventMetrics.cpuTime ? `${eventMetrics.cpuTime}ms` : null, '🖥️')}
        {renderMetricRow('Wall Time', eventMetrics.wallTime ? `${eventMetrics.wallTime}ms` : null, '⏰')}
        {renderMetricRow('Queued Time', eventMetrics.queuedTime ? `${eventMetrics.queuedTime}ms` : null, '⏳')}
        {renderMetricRow('Peak Memory', formatBytes(eventMetrics.peakMemory), '🧠')}
      </div>

      {/* Data Metrics Section */}
      {(eventMetrics.totalRows || eventMetrics.totalBytes || eventMetrics.completedSplits) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '14px', 
            marginBottom: '10px',
            color: '#495057',
            borderBottom: '2px solid #e9ecef',
            paddingBottom: '6px'
          }}>
            Data Metrics
          </div>
          {renderMetricRow('Total Rows', formatNumber(eventMetrics.totalRows), '📊')}
          {renderMetricRow('Total Data', formatBytes(eventMetrics.totalBytes), '💾')}
          {renderMetricRow('Completed Splits', formatNumber(eventMetrics.completedSplits), '✂️')}
        </div>
      )}

      {/* Source Information */}
      {(eventMetrics.catalogs || eventMetrics.schemas) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '14px', 
            marginBottom: '10px',
            color: '#495057',
            borderBottom: '2px solid #e9ecef',
            paddingBottom: '6px'
          }}>
            Data Sources
          </div>
          {eventMetrics.catalogs && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ color: '#6c757d', fontSize: '11px', marginBottom: '4px' }}>
                📚 Catalogs
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                flexWrap: 'wrap' 
              }}>
                {eventMetrics.catalogs.map((cat: string, idx: number) => (
                  <span key={idx} style={{
                    backgroundColor: '#e7f5ff',
                    color: '#1971c2',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
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
              <div style={{ color: '#6c757d', fontSize: '11px', marginBottom: '4px' }}>
                🗂️ Schemas
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                flexWrap: 'wrap' 
              }}>
                {eventMetrics.schemas.map((schema: string, idx: number) => (
                  <span key={idx} style={{
                    backgroundColor: '#f3f0ff',
                    color: '#5f3dc4',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {schema}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SQL Query Section */}
      {query.query && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '14px', 
            marginBottom: '10px',
            color: '#495057',
            borderBottom: '2px solid #e9ecef',
            paddingBottom: '6px'
          }}>
            SQL Query
          </div>
          <div style={{ 
            fontSize: '11px', 
            fontFamily: 'monospace', 
            backgroundColor: '#f8f9fa', 
            padding: '10px 12px', 
            borderRadius: '6px', 
            maxHeight: '120px', 
            overflow: 'auto',
            border: '1px solid #dee2e6',
            color: '#212529',
            lineHeight: '1.5'
          }}>
            {query.query}
          </div>
        </div>
      )}

      {/* Error Section */}
      {query.errorMessage && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '14px', 
            marginBottom: '10px',
            color: '#c92a2a',
            borderBottom: '2px solid #ffe3e3',
            paddingBottom: '6px'
          }}>
            ⚠️ Error Details
          </div>
          <div style={{ 
            backgroundColor: '#ffe3e3',
            color: '#c92a2a',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '12px',
            borderLeft: '4px solid #c92a2a'
          }}>
            {query.errorMessage}
          </div>
        </div>
      )}

      {/* Individual Event Details */}
      {query.events && query.events.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '14px', 
            marginBottom: '10px',
            color: '#495057',
            borderBottom: '2px solid #e9ecef',
            paddingBottom: '6px'
          }}>
            Event Timeline ({query.events.length})
          </div>
          {query.events.map((event, idx) => (
            <div key={idx} style={{
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              borderLeft: `4px solid ${
                event.state === 'FINISHED' ? '#51cf66' :
                event.state === 'FAILED' ? '#ff6b6b' :
                event.state === 'RUNNING' ? '#ffd43b' : '#74c0fc'
              }`
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '12px',
                color: '#212529',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{event.eventType}</span>
                <span style={{ 
                  fontSize: '11px',
                  backgroundColor: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 'normal',
                  color: '#6c757d'
                }}>
                  {event.state}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#868e96', marginBottom: '6px' }}>
                {formatTimestamp(event.timestamp)}
              </div>
              <div style={{ fontSize: '11px', color: '#495057' }}>
                {event.cpuTimeMs && <div>CPU: {event.cpuTimeMs}ms</div>}
                {event.wallTimeMs && <div>Wall: {event.wallTimeMs}ms</div>}
                {event.queuedTimeMs && <div>Queued: {event.queuedTimeMs}ms</div>}
                {event.totalRows && <div>Rows: {formatNumber(event.totalRows)}</div>}
                {event.totalBytes && <div>Data: {formatBytes(event.totalBytes)}</div>}
                {event.peakMemoryBytes && <div>Memory: {formatBytes(event.peakMemoryBytes)}</div>}
                {event.completedSplits && <div>Splits: {event.completedSplits}</div>}
                {event.errorMessage && (
                  <div style={{ color: '#c92a2a', marginTop: '4px', fontWeight: 'bold' }}>
                    Error: {event.errorMessage}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueryMetricsPanel;

