const fs = require('fs');
const path = require('path');

const fixturesDir = path.join(process.cwd(), 'cypress', 'fixtures');
const ensureDir = () => {
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
};

const baseTime = new Date('2024-05-01T12:00:00.000Z');
const fmt = (value) => new Date(value).toISOString();

const makeNode = (queryId, id, state, overrides = {}) => ({
  id,
  queryId,
  nodeType: 'FRAGMENT',
  operatorType: overrides.operatorType || `Fragment ${id}`,
  sourceSystem: overrides.sourceSystem || 'Trino',
  state,
  executionTime: overrides.executionTime ?? 500,
  inputRows: overrides.inputRows ?? 1000,
  outputRows: overrides.outputRows ?? 1000,
  inputBytes: overrides.inputBytes ?? null,
  outputBytes: overrides.outputBytes ?? null,
  cpuTime: overrides.cpuTime ?? null,
  wallTime: overrides.wallTime ?? null,
  memoryBytes: overrides.memoryBytes ?? null,
  errorMessage: overrides.errorMessage ?? null,
  warnings: overrides.warnings ?? [],
  metadata: overrides.metadata ?? {},
  children: overrides.children ?? [],
  parentId: overrides.parentId ?? null,
});

const makeEvents = (queryId, overrides = {}) => ([{
  queryId,
  eventType: overrides.eventType || 'Execution',
  timestamp: fmt(baseTime),
  query: overrides.query || 'SELECT * FROM demo_table',
  state: overrides.state || 'FINISHED',
  user: overrides.user || 'ci-user',
  source: overrides.source ?? 'trino-cli',
  catalog: overrides.catalog ?? 'sales',
  schema: overrides.schema ?? 'analytics',
  executionTime: overrides.executionTime ?? 5,
  cpuTimeMs: overrides.cpuTimeMs ?? 1250,
  wallTimeMs: overrides.wallTimeMs ?? 5000,
  queuedTimeMs: overrides.queuedTimeMs ?? 200,
  peakMemoryBytes: overrides.peakMemoryBytes ?? 2684354560,
  totalBytes: overrides.totalBytes ?? 11274289152,
  totalRows: overrides.totalRows ?? 2400000,
  completedSplits: overrides.completedSplits ?? 48,
  plan: overrides.plan ?? 'plan text',
  errorCode: overrides.errorCode ?? null,
  errorMessage: overrides.errorMessage ?? null,
  statistics: overrides.statistics ?? {
    cpuTime: 1.25,
    wallTime: 5.0,
    queuedTime: 0.2,
    peakUserMemoryBytes: 2684354560,
    totalDrivers: 16,
  },
}]);

const makeBaseQuery = (queryId, overrides = {}) => ({
  queryId,
  query: overrides.query || 'SELECT * FROM demo_table',
  user: overrides.user || 'ci-user',
  state: overrides.state || 'FINISHED',
  startTime: fmt(baseTime),
  endTime: fmt(baseTime.getTime() + (overrides.durationMs ?? 5000)),
  totalExecutionTime: overrides.totalExecutionTime ?? 5000,
  errorMessage: overrides.errorMessage ?? null,
  root: overrides.root,
  events: overrides.events || makeEvents(queryId, overrides.eventOverrides),
});

const writeFixture = (name, data) => {
  const filePath = path.join(fixturesDir, name);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

ensureDir();

// Standard query with several fragments
const standardRoot = makeNode('123', 'fragment-1', 'FINISHED', {
  operatorType: 'Coordinator',
});

standardRoot.children = [
  makeNode('123', 'fragment-2', 'RUNNING', {
    parentId: 'fragment-1',
    executionTime: 750,
    metadata: { metrics: { cpuTimeMs: 500, wallTimeMs: 1500, inputRows: 100000 } },
  }),
  makeNode('123', 'fragment-3', 'FINISHED', {
    parentId: 'fragment-1',
    executionTime: 1250,
    metadata: { metrics: { peakMemoryBytes: 2684354560, cpuTimeMs: 1250 } },
    children: [
      makeNode('123', 'fragment-3-1', 'FINISHED', {
        parentId: 'fragment-3',
        executionTime: 250,
        metadata: { metrics: { outputBytes: 2147483648 } },
      }),
    ],
  }),
  makeNode('123', 'fragment-4', 'FAILED', {
    parentId: 'fragment-1',
    executionTime: 200,
    errorMessage: 'Worker lost during execution',
  }),
  makeNode('123', 'fragment-5', 'QUEUED', {
    parentId: 'fragment-1',
    executionTime: 100,
  }),
];

const standardQuery = makeBaseQuery('123', {
  root: standardRoot,
});

// Single node query fixture
const singleNodeQuery = makeBaseQuery('1', {
  root: makeNode('1', 'fragment-1', 'FINISHED', {
    operatorType: 'Single Fragment',
  }),
});

// Running query fixture
const runningQuery = makeBaseQuery('running', {
  state: 'RUNNING',
  eventOverrides: {
    state: 'RUNNING',
    cpuTimeMs: 500,
    wallTimeMs: 1000,
    queuedTimeMs: 100,
    peakMemoryBytes: 134217728,
    totalBytes: 104857600,
    totalRows: 500000,
    statistics: {
      cpuTime: 0.5,
      wallTime: 1,
      queuedTime: 0.1,
      peakUserMemoryBytes: 134217728,
      totalDrivers: 4,
    },
  },
  root: makeNode('running', 'fragment-running', 'RUNNING', {
    operatorType: 'Coordinator',
    children: [],
  }),
});

// Failed query fixture
const failedQuery = makeBaseQuery('failed', {
  state: 'FAILED',
  errorMessage: 'Query Failed',
  eventOverrides: {
    state: 'FAILED',
    cpuTimeMs: 300,
    wallTimeMs: 300,
    queuedTimeMs: 0,
    peakMemoryBytes: 67108864,
    totalBytes: 0,
    totalRows: 0,
    errorMessage: 'Query Failed',
    errorCode: 'GENERAL',
    statistics: {
      cpuTime: 0.3,
      wallTime: 0.3,
      queuedTime: 0,
      peakUserMemoryBytes: 67108864,
      totalDrivers: 0,
    },
  },
  root: makeNode('failed', 'fragment-error', 'FAILED', {
    operatorType: 'Coordinator',
    errorMessage: 'Node failure detected',
  }),
});

// Null metrics fixture
const nullMetricsQuery = makeBaseQuery('null-metrics', {
  root: makeNode('null-metrics', 'fragment-1', 'FINISHED', {
    operatorType: 'Coordinator',
    inputRows: null,
    outputRows: null,
    executionTime: null,
    metadata: { metrics: { inputRows: null, outputRows: null, cpuTimeMs: null } },
    children: [
      makeNode('null-metrics', 'fragment-2', 'FINISHED', {
        parentId: 'fragment-1',
        inputRows: null,
        outputRows: null,
        executionTime: null,
        metadata: { metrics: { cpuTimeMs: null } },
      }),
    ],
  }),
  eventOverrides: {
    cpuTimeMs: null,
    wallTimeMs: null,
    queuedTimeMs: null,
    peakMemoryBytes: null,
    totalBytes: null,
    totalRows: null,
    statistics: {},
  },
});

// Large graph fixture (500 nodes)
const makeLargeGraph = () => {
  const root = makeNode('large', 'fragment-root', 'FINISHED', {
    operatorType: 'Coordinator',
  });

  root.children = Array.from({ length: 499 }, (_, index) => makeNode('large', `fragment-${index + 1}`, 'FINISHED', {
    parentId: 'fragment-root',
    executionTime: 400 + index,
    inputRows: 1000 + index,
    outputRows: 1000 + index,
  }));

  return makeBaseQuery('large', {
    root,
    totalExecutionTime: 10000,
    durationMs: 10000,
  });
};

ensureDir();
writeFixture('standard-query.json', standardQuery);
writeFixture('single-node.json', singleNodeQuery);
writeFixture('running-query.json', runningQuery);
writeFixture('failed-query.json', failedQuery);
writeFixture('null-metrics.json', nullMetricsQuery);
writeFixture('large-graph.json', makeLargeGraph());
