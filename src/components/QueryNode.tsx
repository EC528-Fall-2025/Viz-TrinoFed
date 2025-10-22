import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { QueryTreeNode } from '../types/api.types';

interface QueryNodeProps {
  data: QueryTreeNode & { 
    label: string;
    displayName?: string;
    eventType?: string;
  };
}

const QueryNode = memo(({ data }: QueryNodeProps) => {
  const getBackgroundColor = () => {
    if (data.errorMessage) return '#ff6b6b';
    if (data.state === 'FINISHED' || data.state === 'COMPLETED') return '#51cf66';
    if (data.state === 'RUNNING') return '#ffd43b';
    if (data.state === 'QUEUED' || data.state === 'CREATED') return '#74c0fc';
    return '#e9ecef';
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes === 0) return null;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const formatNumber = (num: number | null) => {
    if (!num || num === 0) return null;
    return num.toLocaleString();
  };

  const getDisplayName = () => {
    if (data.displayName) return data.displayName;
    if (data.operatorType) return data.operatorType;
    if (data.nodeType) return data.nodeType;
    if (data.eventType) return data.eventType;
    return 'Query Event';
  };

  const hasMetrics = data.executionTime || data.inputRows || data.inputBytes || 
                     data.cpuTime || data.memoryBytes || data.wallTime;

  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: '10px',
        border: '2px solid #495057',
        backgroundColor: getBackgroundColor(),
        minWidth: '240px',
        maxWidth: '320px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ background: '#495057', width: 10, height: 10 }} 
      />
      
      <div style={{ marginBottom: '10px' }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '15px',
          marginBottom: '6px',
          color: '#212529',
          textAlign: 'center'
        }}>
          {getDisplayName()}
        </div>
        
        <div style={{ 
          fontSize: '11px', 
          color: '#6c757d',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          {data.state}
        </div>

        {data.sourceSystem && (
          <div style={{ 
            fontSize: '12px', 
            color: '#495057',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '4px',
            padding: '3px 8px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '4px'
          }}>
               {data.sourceSystem}
          </div>
        )}
      </div>

      {hasMetrics && (
        <div style={{ 
          fontSize: '11px', 
          color: '#212529', 
          lineHeight: '1.8',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          paddingTop: '8px'
        }}>
          {data.executionTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>⏱️ Execution:</span>
              <span style={{ fontWeight: 'bold' }}>{data.executionTime}ms</span>
            </div>
          )}
          
          {data.wallTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>⏰ Wall Time:</span>
              <span style={{ fontWeight: 'bold' }}>{data.wallTime}ms</span>
            </div>
          )}
          
          {data.cpuTime && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🖥️ CPU:</span>
              <span style={{ fontWeight: 'bold' }}>{data.cpuTime}ms</span>
            </div>
          )}
          
          {formatNumber(data.inputRows) && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>📥 Rows:</span>
              <span style={{ fontWeight: 'bold' }}>{formatNumber(data.inputRows)}</span>
            </div>
          )}
          
          {formatBytes(data.inputBytes) && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>💾 Data:</span>
              <span style={{ fontWeight: 'bold' }}>{formatBytes(data.inputBytes)}</span>
            </div>
          )}
          
          {formatBytes(data.memoryBytes) && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🧠 Memory:</span>
              <span style={{ fontWeight: 'bold' }}>{formatBytes(data.memoryBytes)}</span>
            </div>
          )}
        </div>
      )}

      {data.errorMessage && (
        <div style={{ 
          marginTop: '10px', 
          fontSize: '10px', 
          color: '#c92a2a',
          fontWeight: 'bold',
          padding: '6px',
          backgroundColor: 'rgba(255,255,255,0.5)',
          borderRadius: '4px',
          borderLeft: '3px solid #c92a2a'
        }}>
          ⚠️ {data.errorMessage.substring(0, 80)}{data.errorMessage.length > 80 ? '...' : ''}
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ background: '#495057', width: 10, height: 10 }} 
      />
    </div>
  );
});

QueryNode.displayName = 'QueryNode';

export default QueryNode;

