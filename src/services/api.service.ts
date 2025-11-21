import { QueryTree, AIAnalysisResponse, AIStatus } from '../types/api.types';
import { Database } from '../types/database.types';

// Use relative path for Docker deployment (nginx will proxy to backend)
// For development, set VITE_API_URL=http://localhost:8080/api in .env.local
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiService = {
  getAllQueries: async (): Promise<QueryTree[]> => {
    const response = await fetch(`${BASE_URL}/queries`);
    if (!response.ok) throw new Error('Failed to fetch queries');
    return response.json();
  },

  getQueryById: async (queryId: string): Promise<QueryTree> => {
    const response = await fetch(`${BASE_URL}/queries/${queryId}`);
    if (!response.ok) throw new Error(`Failed to fetch query ${queryId}`);
    return response.json();
  },

  getAllQueryIds: async (): Promise<string[]> => {
    const response = await fetch(`${BASE_URL}/queries/ids`);
    if (!response.ok) throw new Error('Failed to fetch query IDs');
    return response.json();
  },

  getDatabases: async (): Promise<Database[]> => {
    const response = await fetch(`${BASE_URL}/databases`);
    if (!response.ok) throw new Error('Failed to fetch databases');
    return response.json();
  },

  getAIStatus: async (): Promise<AIStatus> => {
    const response = await fetch(`${BASE_URL}/ai/status`);
    if (!response.ok) throw new Error('Failed to fetch AI status');
    return response.json();
  },

  analyzeQuery: async (queryId: string): Promise<AIAnalysisResponse> => {
    const response = await fetch(`${BASE_URL}/ai/analyze/${queryId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Failed to analyze query ${queryId}`);
    return response.json();
  }
};