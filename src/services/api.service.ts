import { QueryTree, AIAnalysisResponse, AIStatus } from '../types/api.types';
import { Database } from '../types/database.types';

// Use relative path for Docker deployment (nginx will proxy to backend)
// For development, set VITE_API_URL=http://localhost:8080/api in .env.local
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const handleResponse = async <T>(response: Response, errorMessage: string): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`${errorMessage}: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
};

const handleFetchError = (error: unknown, defaultMessage: string): Error => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new Error(`Network error: Cannot connect to backend at ${BASE_URL}. Make sure the backend is running on http://localhost:8080`);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(defaultMessage);
};

export const apiService = {
  getAllQueries: async (): Promise<QueryTree[]> => {
    try {
      const response = await fetch(`${BASE_URL}/queries`);
      return handleResponse<QueryTree[]>(response, 'Failed to fetch queries');
    } catch (error) {
      throw handleFetchError(error, 'Failed to fetch queries');
    }
  },

  getQueryById: async (queryId: string): Promise<QueryTree> => {
    try {
      const response = await fetch(`${BASE_URL}/queries/${queryId}`);
      return handleResponse<QueryTree>(response, `Failed to fetch query ${queryId}`);
    } catch (error) {
      throw handleFetchError(error, `Failed to fetch query ${queryId}`);
    }
  },

  getAllQueryIds: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${BASE_URL}/queries/ids`);
      return handleResponse<string[]>(response, 'Failed to fetch query IDs');
    } catch (error) {
      throw handleFetchError(error, 'Failed to fetch query IDs');
    }
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