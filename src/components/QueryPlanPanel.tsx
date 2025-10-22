import { useState } from 'react';
import { QueryEvent } from '../types/api.types';

interface QueryPlanPanelProps {
  events: QueryEvent[];
  plan?: string | null;
}

const QueryPlanPanel = ({ events, plan }: QueryPlanPanelProps) => {
  const [showPlan, setShowPlan] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 10,
      right: 10,
      zIndex: 10,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => setShowEvents(!showEvents)}
          style={{
            padding: '6px 12px',
            backgroundColor: showEvents ? '#228be6' : '#e9ecef',
            color: showEvents ? 'white' : '#495057',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          Events ({events.length})
        </button>
        {plan && (
          <button
            onClick={() => setShowPlan(!showPlan)}
            style={{
              padding: '6px 12px',
              backgroundColor: showPlan ? '#228be6' : '#e9ecef',
              color: showPlan ? 'white' : '#495057',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            Plan
          </button>
        )}
      </div>

      {showEvents && (
        <div style={{
          padding: '12px',
          overflowY: 'auto',
          maxHeight: '400px',
          fontSize: '12px'
        }}>
          {events.map((event, idx) => (
            <div key={idx} style={{
              marginBottom: '12px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              borderLeft: `4px solid ${
                event.state === 'FINISHED' ? '#51cf66' :
                event.state === 'FAILED' ? '#ff6b6b' :
                event.state === 'RUNNING' ? '#ffd43b' : '#74c0fc'
              }`
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#212529' }}>
                {event.eventType} - {event.state}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                {formatTime(event.timestamp)}
              </div>
              {event.cpuTimeMs && (
                <div style={{ marginTop: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#495057' }}>CPU: </span>
                  <span style={{ fontWeight: 'bold' }}>{event.cpuTimeMs}ms</span>
                </div>
              )}
              {event.totalRows && (
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: '#495057' }}>Rows: </span>
                  <span style={{ fontWeight: 'bold' }}>{event.totalRows.toLocaleString()}</span>
                </div>
              )}
              {event.peakMemoryBytes && (
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: '#495057' }}>Memory: </span>
                  <span style={{ fontWeight: 'bold' }}>
                    {(event.peakMemoryBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showPlan && plan && (
        <div style={{
          padding: '12px',
          overflowY: 'auto',
          maxHeight: '400px',
          fontSize: '10px',
          fontFamily: 'monospace',
          backgroundColor: '#f8f9fa',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.4'
        }}>
          {plan}
        </div>
      )}
    </div>
  );
};

export default QueryPlanPanel;

