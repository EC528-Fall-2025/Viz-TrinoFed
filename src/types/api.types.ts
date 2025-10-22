export interface QueryTreeNode {
  id: string;
  queryId: string;
  nodeType: string;
  operatorType: string;
  sourceSystem: string;
  state: string;
  executionTime: number | null;
  inputRows: number | null;
  outputRows: number | null;
  inputBytes: number | null;
  outputBytes: number | null;
  cpuTime: number | null;
  wallTime: number | null;
  memoryBytes: number | null;
  errorMessage: string | null;
  warnings: string[] | null;
  metadata: Record<string, any> | null;
  children: QueryTreeNode[];
  parentId: string | null;
}

export interface QueryEvent {
  queryId: string;
  eventType: string;
  timestamp: string;
  query: string;
  state: string;
  user: string;
  source: string | null;
  catalog: string | null;
  schema: string | null;
  executionTime: number | null;
  cpuTimeMs: number | null;
  wallTimeMs: number | null;
  queuedTimeMs: number | null;
  peakMemoryBytes: number | null;
  totalBytes: number | null;
  totalRows: number | null;
  completedSplits: number | null;
  plan: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface QueryTree {
  queryId: string;
  query: string;
  user: string;
  state: string;
  startTime: string;
  endTime: string;
  totalExecutionTime: number | null;
  errorMessage: string | null;
  root: QueryTreeNode | null;
  events: QueryEvent[];
}

