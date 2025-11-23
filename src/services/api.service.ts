import { QueryTree } from '../types/api.types';
import { Database } from '../types/database.types';

const BASE_URL = 'http://localhost:8080/api';

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
    try {
      const response = await fetch(`${BASE_URL}/databases`);
      return handleResponse<Database[]>(response, 'Failed to fetch databases');
    } catch (error) {
      throw handleFetchError(error, 'Failed to fetch databases');
    }
  }
};