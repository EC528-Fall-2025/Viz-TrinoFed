import { QueryTree, QueryEvent } from '../types/api.types';
import { useState } from 'react';

interface StatisticsPanelProps {
  query: QueryTree;
}

const StatisticsPanel = ({ query }: StatisticsPanelProps) => {
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);

  // Find events with statistics
  const eventsWithStats = query.events?.filter(e => e.statistics) || [];
  if (eventsWithStats.length === 0) return null;

  const selectedEvent = eventsWithStats[selectedEventIndex];
  const stats = selectedEvent.statistics as Record<string, any>;

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

  const renderMetricCard = (title: string, value: string | number, icon: string, color: string) => (
    <div style={{
      backgroundColor: 'white',
      padding: '12px',
      borderRadius: '8px',
      border: `2px solid ${color}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '4px' }}>
        <span style={{ marginRight: '4px' }}>{icon}</span>
        {title}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: color }}>
        {value}
      </div>
    </div>
  );

  const renderSection = (title: string, icon: string, children: React.ReactNode) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontWeight: '600',
        fontSize: '13px',
        marginBottom: '10px',
        color: '#495057',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '6px',
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
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#495057' }}>
          {label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '10px' }}>
          {dist.slice(0, 9).map((item: any, idx: number) => (
            <div key={idx} style={{
              padding: '6px',
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
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
          Operator Performance
        </div>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {operators.slice(0, 10).map((op: any, idx: number) => (
            <div key={idx} style={{
              padding: '10px',
              marginBottom: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              borderLeft: '4px solid #1971c2'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px', color: '#212529' }}>
                {op.operatorType || `Operator ${idx + 1}`}
                {op.planNodeId && <span style={{ color: '#6c757d', marginLeft: '8px', fontWeight: 'normal' }}>
                  (Node: {op.planNodeId})
                </span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTaskStatistics = (tasks: any[] | null | undefined) => {
    if (!tasks || tasks.length === 0) return null;

    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
          Task Distribution
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {tasks.slice(0, 6).map((task: any, idx: number) => (
            <div key={idx} style={{
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              fontSize: '10px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#212529' }}>
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

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 10,
      backgroundColor: 'white',
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      maxWidth: '500px',
      maxHeight: '85vh',
      overflow: 'auto',
      fontSize: '12px',
      borderRight: '5px solid #1971c2',
      marginRight: '60px' // Add margin to avoid zoom controls
    }}>
      {/* Header */}
      <div style={{
        fontWeight: 'bold',
        marginBottom: '16px',
        fontSize: '18px',
        color: '#212529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📈</span>
          <span>Detailed Statistics</span>
        </div>
      </div>

      {/* Event Selector */}
      {eventsWithStats.length > 1 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '6px' }}>
            Select Event
          </div>
          <select
            value={selectedEventIndex}
            onChange={(e) => setSelectedEventIndex(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              fontSize: '12px',
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

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {renderMetricCard('CPU Time', formatTime(stats.cpuTime), '🖥️', '#1971c2')}
        {renderMetricCard('Wall Time', formatTime(stats.wallTime), '⏰', '#2b8a3e')}
        {renderMetricCard('Queued Time', formatTime(stats.queuedTime), '⏳', '#f08c00')}
        {renderMetricCard('Peak Memory', formatBytes(stats.peakUserMemoryBytes), '🧠', '#9c36b5')}
      </div>

      {/* Data Flow Section */}
      {renderSection('Data Flow', '📊',
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: '#6c757d' }}>Physical Input</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1971c2' }}>
              {formatNumber(stats.physicalInputRows)} rows
            </div>
            <div style={{ fontSize: '10px', color: '#868e96' }}>
              {formatBytes(stats.physicalInputBytes)}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: '#6c757d' }}>Processed Input</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2b8a3e' }}>
              {formatNumber(stats.processedInputRows)} rows
            </div>
            <div style={{ fontSize: '10px', color: '#868e96' }}>
              {formatBytes(stats.processedInputBytes)}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: '#6c757d' }}>Output</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#f08c00' }}>
              {formatNumber(stats.outputRows)} rows
            </div>
            <div style={{ fontSize: '10px', color: '#868e96' }}>
              {formatBytes(stats.outputBytes)}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: '#6c757d' }}>Completed Splits</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#9c36b5' }}>
              {formatNumber(stats.completedSplits)}
            </div>
          </div>
        </div>
      )}

      {/* CPU Time Distribution */}
      {stats.cpuTimeDistribution && renderSection('CPU Time Distribution', '⏱️',
        renderDistribution(stats.cpuTimeDistribution, 'Percentiles')
      )}

      {/* Operator Summaries */}
      {stats.operatorSummaries && renderSection('Operator Summaries', '⚙️',
        renderOperatorSummaries(stats.operatorSummaries)
      )}

      {/* Task Statistics */}
      {stats.taskStatistics && renderSection('Task Statistics', '📦',
        renderTaskStatistics(stats.taskStatistics)
      )}

      {/* Additional Metrics */}
      {renderSection('Additional Metrics', '📋',
        <div style={{ fontSize: '11px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
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
    </div>
  );
};

export default StatisticsPanel;
