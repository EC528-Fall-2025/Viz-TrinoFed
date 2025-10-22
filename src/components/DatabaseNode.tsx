import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database } from '../types/database.types';

interface DatabaseNodeProps {
  data: Database & { label: string };
}

const DatabaseNode = memo(({ data }: DatabaseNodeProps) => {
  const getBackgroundColor = () => {
    return '#ffffff'; // Always white background
  };

  const getBorderColor = () => {
    if (data.status === 'ACTIVE') return '#51cf66';
    if (data.status === 'INACTIVE') return '#ff6b6b';
    return '#e9ecef';
  };

  const getTypeColor = () => {
    switch (data.type.toLowerCase()) {
      case 'postgresql': return '#336791';
      case 'mysql': return '#4479a1';
      case 'mongodb': return '#47A248';
      case 'system': return '#6c757d';
      default: return '#495057';
    }
  };

  const getTotalTables = () => {
    if (data.type === 'mongodb') {
      return data.collections ? data.collections.length : 0;
    } else {
      return data.schemas.reduce((total, schema) => total + schema.tables.length, 0);
    }
  };

  const getTotalRows = () => {
    if (data.type === 'mongodb') {
      return data.collections?.reduce((total, collection) => 
        total + (collection.documentCount || 0), 0) || 0;
    } else {
      return data.schemas.reduce((total, schema) => 
        total + schema.tables.reduce((schemaTotal, table) => 
          schemaTotal + (table.rowCount || 0), 0), 0);
    }
  };

  const formatNumber = (num: number) => {
    if (num === 0) return '0';
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: '12px',
        border: `3px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        minWidth: '280px',
        maxWidth: '350px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
      }}
    >
      <Handle 
        type="source" 
        position={Position.Top} 
        style={{ background: getTypeColor(), width: 12, height: 12 }} 
      />
      
      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '18px',
          marginBottom: '6px',
          color: '#212529'
        }}>
          🗄️ {data.name}
        </div>
        
        <div style={{ 
          fontSize: '13px', 
          color: getTypeColor(),
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '4px'
        }}>
          {data.type}
        </div>

        {data.host && (
          <div style={{ 
            fontSize: '11px', 
            color: '#6c757d',
            fontFamily: 'monospace'
          }}>
            {data.host}:{data.port}
          </div>
        )}

        <div style={{ 
          fontSize: '12px', 
          color: data.status === 'ACTIVE' ? '#2b8a3e' : '#c92a2a',
          fontWeight: 'bold',
          marginTop: '6px',
          padding: '4px 8px',
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          {data.status}
        </div>
      </div>

      <div style={{ 
        fontSize: '12px', 
        color: '#212529', 
        lineHeight: '1.6',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        paddingTop: '10px'
      }}>
        {/* MongoDB Display - Only show collections */}
        {data.type === 'mongodb' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>📦 Collections:</span>
              <span style={{ fontWeight: 'bold' }}>
                {data.collections?.length || 0}
              </span>
            </div>
            
            {data.collections && data.collections.length > 0 ? (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#495057', fontSize: '11px' }}>
                  Collection Details:
                </div>
                {data.collections.slice(0, 4).map((collection, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: '#6c757d',
                    fontSize: '10px',
                    marginBottom: '2px'
                  }}>
                    <span>• {collection.name}</span>
                    <span>{collection.fields?.length || 0} fields</span>
                  </div>
                ))}
                {data.collections.length > 4 && (
                  <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '10px' }}>
                    +{data.collections.length - 4} more collections
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '10px' }}>
                No collections discovered yet
              </div>
            )}
          </>
        )}

        {/* Relational Database Display - Show schemas and tables */}
        {data.type !== 'mongodb' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>📋 Schemas:</span>
              <span style={{ fontWeight: 'bold' }}>
                {data.schemas?.length || 0}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>📊 Tables:</span>
              <span style={{ fontWeight: 'bold' }}>
                {getTotalTables()}
              </span>
            </div>
            
            {getTotalRows() > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>📈 Rows:</span>
                <span style={{ fontWeight: 'bold' }}>{formatNumber(getTotalRows())}</span>
              </div>
            )}

            {data.schemas && data.schemas.length > 0 ? (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#495057', fontSize: '11px' }}>
                  Schema Details:
                </div>
                {data.schemas.slice(0, 3).map((schema, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: '#6c757d',
                    fontSize: '10px',
                    marginBottom: '2px' 
                  }}>
                    <span>• {schema.name === 'public' ? `${schema.name} (default)` : schema.name}</span>
                    <span>{schema.tables?.length || 0} tables</span>
                  </div>
                ))}
                {data.schemas.length > 3 && (
                  <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '10px' }}>
                    +{data.schemas.length - 3} more schemas
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '10px' }}>
                No schemas discovered yet
              </div>
            )}
          </>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ background: getTypeColor(), width: 12, height: 12 }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right" // Explicitly setting the handle ID to match the edge's sourceHandle
        style={{ background: getTypeColor(), width: 12, height: 12 }} 
      />
    </div>
  );
});

DatabaseNode.displayName = 'DatabaseNode';

export default DatabaseNode;
