import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { QueryTree } from '../types/api.types';
import { CardProps } from '../components/Card';
import CopyPaste from '../components/CopyPaste';

// Time category helper function
const getTimeCategory = (timestamp: string | undefined): string => {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const queryTime = new Date(timestamp);
  const diffMs = now.getTime() - queryTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) === 1 ? '' : 's'} ago`;
};

// group queries by time
const groupQueriesByTime = (cards: CardProps[]): Map<string, CardProps[]> => {
  const groups = new Map<string, CardProps[]>();
  
  //newest first sort
  const sortedCards = [...cards].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA; // descending order, newest first
  });
  
  // group by time cateogry
  sortedCards.forEach(card => {
    const category = getTimeCategory(card.timestamp);
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(card);
  });
  
  // order of time categories
  const categoryOrder = [
    'Just now',
    (cat: string) => cat.includes('minute'),
    (cat: string) => cat.includes('hour'),
    'Yesterday',
    (cat: string) => cat.includes('day') && !cat.includes('Yesterday'),
    (cat: string) => cat.includes('week'),
    (cat: string) => cat.includes('month'),
    (cat: string) => cat.includes('year'),
    'Unknown'
  ];
  
  //sort groups by time
  const sortedGroups = new Map(
    Array.from(groups.entries()).sort((a, b) => {
      const [catA] = a;
      const [catB] = b;
      
      // Helper function to get category priority
      const getPriority = (cat: string): number => {
        if (cat === 'Just now') return 0;
        if (cat.includes('minute')) {
          const num = parseInt(cat);
          return 1000 + num;
        }
        if (cat.includes('hour')) {
          const num = parseInt(cat);
          return 2000 + num * 60;
        }
        if (cat === 'Yesterday') return 3000;
        if (cat.includes('day')) {
          const num = parseInt(cat);
          return 4000 + num;
        }
        if (cat.includes('week')) {
          const num = parseInt(cat);
          return 5000 + num * 7;
        }
        if (cat.includes('month')) {
          const num = parseInt(cat);
          return 6000 + num * 30;
        }
        if (cat.includes('year')) {
          const num = parseInt(cat);
          return 7000 + num * 365;
        }
        return 10000; 
      };
      
      return getPriority(catA) - getPriority(catB);
    })
  );
  
  return sortedGroups;
};

// Query Card Component with expandable query text and rename functionality
const QueryCard = ({ 
  card, 
  onClick, 
  customName, 
  onRename,
  onDelete
}: { 
  card: CardProps; 
  onClick: () => void;
  customName?: string;
  onRename: (newName: string) => void;
  onDelete: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(customName || '');
  const maxLength = 200;
  const needsExpansion = card.description && card.description.length > maxLength;
  
  const displayText = needsExpansion && !isExpanded 
    ? card.description.substring(0, maxLength) + '...'
    : card.description;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return '#4CAF50';
      case 'failed': return '#f44336';
      case 'running': return '#2196F3';
      case 'queued': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const handleRename = () => {
    if (newName.trim() && newName !== customName) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(customName || '');
      setIsRenaming(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: card.status === 'finished' ? '#E3F2FD' : '#f5f5f5',
        border: `1px solid ${card.status === 'finished' ? '#2196F3' : '#ddd'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left',
        position: 'relative'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1, marginRight: '12px' }}>
          {isRenaming ? (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleRename}
                autoFocus
                placeholder="Enter custom name"
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '4px 8px',
                  border: '2px solid #2196F3',
                  borderRadius: '4px',
                  outline: 'none',
                  flex: 1
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                {customName || card.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setNewName(customName || '');
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#2196F3',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E3F2FD';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Rename
              </button>
            </div>
          )}
          {customName && (
            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
              ID: {card.title}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: getStatusColor(card.status || 'unknown'),
            color: 'white',
            fontWeight: '600',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}
        >
          {card.status || 'unknown'}
        </div>
      </div>
      
      <div style={{ 
        fontSize: '13px', 
        color: '#555', 
        marginBottom: '8px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {displayText || 'No query text available'}
      </div>
      
      {needsExpansion && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #2196F3',
            color: '#2196F3',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2196F3';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#2196F3';
          }}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#777' }}>
          <strong>Timestamp:</strong> {card.timestamp ? new Date(card.timestamp).toLocaleString() : 'N/A'}
        </div>
        
        {/* Delete Button */}
        <button onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this query from your history?')) {
              onDelete();
            }
          }}
          style={{
            backgroundColor: '#f44336',  
            border: '1px solid #f44336',
            color: 'white',           
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#d32f2f'; 
            e.currentTarget.style.borderColor = '#d32f2f';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f44336';
            e.currentTarget.style.borderColor = '#f44336';
            e.currentTarget.style.color = 'white';
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default function QueryHistory() {
  const [queries, setQueries] = useState<QueryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [deletedQueries, setDeletedQueries] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  const loadQueries = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAllQueries();
      setQueries(data);
      
      // Load custom names from localStorage
      const savedNames = localStorage.getItem('queryCustomNames');
      if (savedNames) {
        setCustomNames(JSON.parse(savedNames));
      }
      
      // Load deleted queries from localStorage
      const savedDeleted = localStorage.getItem('deletedQueries');
      if (savedDeleted) {
        setDeletedQueries(new Set(JSON.parse(savedDeleted)));
      }
    } catch (err) {
      console.error('Failed to load query history:', err);
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const handleRename = (queryId: string, newName: string) => {
    const updatedNames = { ...customNames, [queryId]: newName };
    setCustomNames(updatedNames);
    localStorage.setItem('queryCustomNames', JSON.stringify(updatedNames));
  };

  const handleDelete = (queryId: string) => {
    const updatedDeleted = new Set(deletedQueries);
    updatedDeleted.add(queryId);
    setDeletedQueries(updatedDeleted);
    localStorage.setItem('deletedQueries', JSON.stringify(Array.from(updatedDeleted)));
  };

  const handleQueryClick = (queryId: string) => {
    console.log('Card clicked, navigating to query:', queryId);
    navigate(`/?queryId=${queryId}`);
  };

  const formatQueryHistory = (queries: QueryTree[]): string => {
    if (queries.length === 0) return 'No queries found.';
    
    const header = 'QUERY HISTORY REPORT\n' + '='.repeat(50) + '\n\n';
    const timestamp = new Date().toLocaleString();
    const summary = `Generated: ${timestamp}\nTotal Queries: ${queries.length}\n\n`;
    
    const queryDetails = queries.map((query, index) => {
      const status = query.state === 'FINISHED' ? 'COMPLETED' : 
                    query.errorMessage ? 'FAILED' : 
                    query.state === 'RUNNING' ? 'RUNNING' : 'UNKNOWN';
      
      const duration = query.startTime && query.endTime ? 
        new Date(query.endTime).getTime() - new Date(query.startTime).getTime() : null;
      
      const durationText = duration ? `${(duration / 1000).toFixed(2)}s` : 'N/A';
      
      const customName = customNames[query.queryId] ? `\n   Custom Name: ${customNames[query.queryId]}` : '';
      
      return `${index + 1}. Query ID: ${query.queryId}${customName}
   Status: ${status}
   User: ${query.user}
   Start Time: ${query.startTime ? new Date(query.startTime).toLocaleString() : 'N/A'}
   End Time: ${query.endTime ? new Date(query.endTime).toLocaleString() : 'N/A'}
   Duration: ${durationText}
   Events: ${query.events?.length || 0}
   ${query.errorMessage ? `Error: ${query.errorMessage}` : ''}
   SQL Query: ${query.query ? query.query.substring(0, 200) + (query.query.length > 200 ? '...' : '') : 'N/A'}
   
${'-'.repeat(80)}
`;
    }).join('\n');
    
    return header + summary + queryDetails;
  };

  // Convert QueryTree data to CardProps format with filtering
  const cards: CardProps[] = queries
    .filter(query => !deletedQueries.has(query.queryId)) // Filter out deleted queries
    .filter(query => {
      // Status filter
      if (statusFilter !== 'all') {
        const queryStatus = query.state === 'FINISHED' ? 'finished' :
                           query.errorMessage ? 'failed' :
                           query.state === 'RUNNING' ? 'running' :
                           query.state === 'QUEUED' ? 'queued' : 'unknown';
        if (queryStatus !== statusFilter) return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const customName = customNames[query.queryId]?.toLowerCase() || '';
        const queryText = query.query?.toLowerCase() || '';
        const queryId = query.queryId.toLowerCase();
        
        return customName.includes(searchLower) || 
               queryText.includes(searchLower) || 
               queryId.includes(searchLower);
      }
      
      return true;
    })
    .map((query) => {
      let status: CardProps['status'] = 'unknown';
      if (query.state === 'FINISHED') {
        status = 'finished';
      } else if (query.errorMessage) {
        status = 'failed';
      } else if (query.state === 'RUNNING') {
        status = 'running';
      } else if (query.state === 'QUEUED') {
        status = 'queued';
      } else if (query.state === 'IDLE') {
        status = 'idle';
      } else if (query.state === 'OK') {
        status = 'ok';
      }

      return {
        title: query.queryId,
        description: query.query || 'No query text available',
        status,
        timestamp: query.startTime,
        onClick: () => handleQueryClick(query.queryId)
      };
    });

  // Group cards by time
  const groupedCards = groupQueriesByTime(cards);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div ref={pageRef} style={{ padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Query History</h1>
        {queries.length > 0 && (
          <CopyPaste 
            dataToCopy={formatQueryHistory(queries)}
            style={{
              position: 'relative',
              top: 'auto',
              right: '40%',
              marginLeft: '20px'
            }}
          />
        )}
      </div>

      {/* Toolbar with Search, Refresh, and Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '180px', marginRight: '48px' }}>
          <span style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            fontSize: '16px',
            color: '#666'
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#2196F3'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadQueries}
          style={{
            padding: '8px 16px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
            e.currentTarget.style.borderColor = '#2196F3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.borderColor = '#ddd';
          }}
        >
          <span style={{ fontSize: '16px' }}>🔄</span>
          Refresh
        </button>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '8px 16px',
            backgroundColor: showFilters ? '#E3F2FD' : '#fff',
            border: `1px solid ${showFilters ? '#2196F3' : '#ddd'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: '500',
            color: showFilters ? '#2196F3' : '#333',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            if (!showFilters) {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.borderColor = '#2196F3';
            }
          }}
          onMouseLeave={(e) => {
            if (!showFilters) {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#ddd';
            }
          }}
        >
          <span style={{ fontSize: '16px' }}>⚙️</span>
          Filter
          {statusFilter !== 'all' && (
            <span style={{
              backgroundColor: '#2196F3',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              1
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{
          backgroundColor: '#f9f9f9',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>
            Filter by Status:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'finished', 'failed', 'running', 'queued'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: statusFilter === status ? '#2196F3' : '#fff',
                  color: statusFilter === status ? '#fff' : '#333',
                  border: `1px solid ${statusFilter === status ? '#2196F3' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== status) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== status) {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {queries.length === 0 ? (
        <p>No queries found.</p>
      ) : cards.length === 0 ? (
        <p>No queries match your search or filter criteria.</p>
      ) : (
        <div>
          {Array.from(groupedCards.entries()).map(([category, categoryCards]) => (
            <div key={category} style={{ marginBottom: '30px' }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#666',
                marginBottom: '12px',
                textAlign: 'left'
              }}>
                {category}
              </h2>
              <div>
                {categoryCards.map((card, index) => (
                  <QueryCard 
                    key={`${card.title}-${index}`} 
                    card={card} 
                    onClick={card.onClick || (() => {})}
                    customName={customNames[card.title]}
                    onRename={(newName) => handleRename(card.title, newName)}
                    onDelete={() => handleDelete(card.title)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}