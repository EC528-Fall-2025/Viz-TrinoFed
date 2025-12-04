import * as React from "react";
import { QueryResultsDialog } from "../components/QueryResultsDialog";

interface QueryResultsContextType {
  openResults: (query: string, queryId?: string) => void;
}

const QueryResultsContext = React.createContext<QueryResultsContextType | undefined>(undefined);

export function QueryResultsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentQuery, setCurrentQuery] = React.useState<string | undefined>(undefined);
  const [currentQueryId, setCurrentQueryId] = React.useState<string | undefined>(undefined);

  const openResults = React.useCallback((query: string, queryId?: string) => {
    setCurrentQuery(query);
    setCurrentQueryId(queryId);
    setIsOpen(true);
  }, []);

  const closeResults = React.useCallback(() => {
    setIsOpen(false);
    setCurrentQuery(undefined);
    setCurrentQueryId(undefined);
  }, []);

  return (
    <QueryResultsContext.Provider value={{ openResults }}>
      {children}
      <QueryResultsDialog
        open={isOpen}
        query={currentQuery}
        queryId={currentQueryId}
        onClose={closeResults}
      />
    </QueryResultsContext.Provider>
  );
}

export function useQueryResults() {
  const context = React.useContext(QueryResultsContext);
  if (!context) {
    throw new Error("useQueryResults must be used within QueryResultsProvider");
  }
  return context;
}
