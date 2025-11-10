import { QueryNodeData } from '../Node';
import { CardProps } from '../Card';
import { QueryTree, QueryEvent } from '../../types/api.types';
import { Database } from '../../types/database.types';
import { demoNodes, demoCards } from '../../mock-data/mock-data';

const baseTimestamp = new Date('2024-05-01T12:00:00.000Z').toISOString();

export const sampleCards: CardProps[] = demoCards.slice(0, 3);

export const sampleQueryNode: QueryNodeData = {
  ...demoNodes[0],
};

const sampleEvents: QueryEvent[] = [
  {
    queryId: 'sample_query_1',
    eventType: 'CREATED',
    timestamp: baseTimestamp,
    query: 'SELECT 1 AS test_value',
    state: 'QUEUED',
    user: 'trino',
    source: 'cli',
    catalog: 'postgres',
    schema: 'public',
    executionTime: null,
    cpuTimeMs: null,
    wallTimeMs: null,
    queuedTimeMs: 45,
    peakMemoryBytes: null,
    totalBytes: null,
    totalRows: null,
    completedSplits: null,
    plan: null,
    errorCode: null,
    errorMessage: null,
    statistics: null,
  },
  {
    queryId: 'sample_query_1',
    eventType: 'COMPLETED',
    timestamp: new Date('2024-05-01T12:00:01.200Z').toISOString(),
    query: 'SELECT 1 AS test_value',
    state: 'FINISHED',
    user: 'trino',
    source: 'cli',
    catalog: 'postgres',
    schema: 'public',
    executionTime: 350,
    cpuTimeMs: 12,
    wallTimeMs: 400,
    queuedTimeMs: 45,
    peakMemoryBytes: 128 * 1024,
    totalBytes: 1024,
    totalRows: 1,
    completedSplits: 1,
    plan: 'Fragment 0 [SINGLE]\n  Output layout: [expr]\n  Output: expr := 1',
    errorCode: null,
    errorMessage: null,
    statistics: {
      cpuTime: 0.012,
      wallTime: 0.4,
      queuedTime: 0.045,
      peakUserMemoryBytes: 131072,
      outputBytes: 1024,
      outputRows: 1,
    },
  },
];

export const sampleQueryTree: QueryTree = {
  queryId: 'sample_query_1',
  query: 'SELECT 1 AS test_value',
  user: 'trino',
  state: 'FINISHED',
  startTime: baseTimestamp,
  endTime: new Date('2024-05-01T12:00:01.200Z').toISOString(),
  totalExecutionTime: 400,
  errorMessage: null,
  root: {
    id: 'root-1',
    queryId: 'sample_query_1',
    nodeType: 'OPERATOR',
    operatorType: 'Output',
    sourceSystem: 'PostgreSQL',
    state: 'FINISHED',
    executionTime: 12,
    inputRows: 1,
    outputRows: 1,
    inputBytes: 1024,
    outputBytes: 1024,
    cpuTime: 12,
    wallTime: 400,
    memoryBytes: 131072,
    errorMessage: null,
    warnings: [],
    metadata: {
      outputs: [
        { name: 'expr', type: 'integer' },
      ],
      descriptor: { columnNames: ['expr'] },
      details: ['expr := 1'],
    },
    children: [
      {
        id: 'child-1',
        queryId: 'sample_query_1',
        nodeType: 'OPERATOR',
        operatorType: 'Values',
        sourceSystem: 'PostgreSQL',
        state: 'FINISHED',
        executionTime: 8,
        inputRows: 1,
        outputRows: 1,
        inputBytes: 1024,
        outputBytes: 1024,
        cpuTime: 8,
        wallTime: 300,
        memoryBytes: 65536,
        errorMessage: null,
        warnings: [],
        metadata: {
          outputs: [
            { name: 'expr', type: 'integer' },
          ],
          details: ["(integer '1')"],
        },
        children: [],
        parentId: 'root-1',
      },
    ],
    parentId: null,
  },
  events: sampleEvents,
};

export const sampleQueryTreeWithStats: QueryTree = {
  ...sampleQueryTree,
  events: sampleEvents.map((event) => ({
    ...event,
    statistics: event.statistics ?? {
      cpuTime: 0.012,
      wallTime: 0.4,
      queuedTime: 0.045,
      peakUserMemoryBytes: 131072,
      totalDrivers: 1,
    },
  })),
};

export const sampleDatabase: Database = {
  id: 'postgres',
  name: 'PostgreSQL',
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  status: 'ACTIVE',
  schemas: [
    {
      name: 'public',
      tables: [
        {
          name: 'customers',
          columns: [
            { name: 'id', type: 'integer', nullable: false, defaultValue: null, metadata: {} },
            { name: 'name', type: 'varchar', nullable: false, defaultValue: null, metadata: {} },
          ],
          rowCount: 5,
          sizeBytes: 2048,
          metadata: {},
          firstSeen: baseTimestamp,
          lastSeen: baseTimestamp,
          totalQueries: 10,
        },
      ],
      metadata: {},
      firstSeen: baseTimestamp,
      lastSeen: baseTimestamp,
      totalQueries: 15,
    },
  ],
  collections: [
    {
      name: 'products',
      documentCount: 12,
      sizeBytes: 4096,
      fields: [
        { name: 'name', type: 'string' },
        { name: 'price', type: 'double' },
      ],
      metadata: {},
      firstSeen: baseTimestamp,
      lastSeen: baseTimestamp,
      totalQueries: 4,
    },
  ],
  metadata: {},
  firstSeen: baseTimestamp,
  lastSeen: baseTimestamp,
  totalQueries: 42,
};

export const samplePlanText = sampleEvents[1].plan ?? 'Plan unavailable';

