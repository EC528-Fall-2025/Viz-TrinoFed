import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { QueryTree } from '../types/api.types';
import CardList from '../components/CardList';
import { CardProps } from '../components/Card';
import CopyPaste from '../components/CopyPaste';


export default function QueryHistory() {
  const [queries, setQueries] = useState<QueryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadQueries = async () => {
      try {
        const data = await apiService.getAllQueries();
        setQueries(data);
      } catch (err) {
        console.error('Failed to load query history:', err);
        setError('Failed to connect to backend');
      } finally {
        setLoading(false);
      }
    };
    loadQueries();
  }, []);

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
      
      return `${index + 1}. Query ID: ${query.queryId}
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

  // Convert QueryTree data to CardProps format
  const cards: CardProps[] = queries.map((query) => ({
    title: query.queryId,
    description: query.query || 'No query text available',
    status: query.state === 'FINISHED' ? 'ok' : 
            query.errorMessage ? 'failed' : 
            query.state === 'RUNNING' ? 'idle' : 'unknown',
    timestamp: query.startTime,
    onClick: () => handleQueryClick(query.queryId)
  }));

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
      {queries.length === 0 ? (
        <p>No queries found.</p>
      ) : (
        <CardList cards={cards} />
      )}
    </div>
  );
}
