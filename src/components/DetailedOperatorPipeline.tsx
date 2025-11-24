import * as React from 'react';
import { Box, Typography, Chip, Paper, Collapse, IconButton } from '@mui/material';
import {
  FilterAlt,
  Storage,
  CallMerge,
  Functions,
  CompareArrows,
  Output,
  DataObject,
  HelpOutline,
  ExpandMore,
  ChevronRight,
  Speed,
  TableRows
} from '@mui/icons-material';

// --- Types ---
interface ParsedOperator {
  type: string;
  rawLine: string;
  details: string[];
  children: ParsedOperator[];
  metrics: {
    cpu?: string;
    rows?: string;
    memory?: string;
  };
}

// --- Helpers ---
const getOperatorConfig = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('scan') || t.includes('source')) return { icon: <Storage fontSize="small" />, color: '#2e7d32', bg: '#e8f5e9' };
  if (t.includes('filter')) return { icon: <FilterAlt fontSize="small" />, color: '#ed6c02', bg: '#fff3e0' };
  if (t.includes('join')) return { icon: <CallMerge fontSize="small" />, color: '#1976d2', bg: '#e3f2fd' };
  if (t.includes('aggregate')) return { icon: <Functions fontSize="small" />, color: '#d32f2f', bg: '#ffebee' };
  if (t.includes('exchange') || t.includes('remote')) return { icon: <CompareArrows fontSize="small" />, color: '#0288d1', bg: '#e1f5fe' };
  if (t.includes('project')) return { icon: <DataObject fontSize="small" />, color: '#9c27b0', bg: '#f3e5f5' };
  if (t.includes('output')) return { icon: <Output fontSize="small" />, color: '#2e7d32', bg: '#e8f5e9' };
  return { icon: <HelpOutline fontSize="small" />, color: '#757575', bg: '#f5f5f5' };
};

const extractMetrics = (details: string[]) => {
  const metrics: ParsedOperator['metrics'] = {};
  details.forEach(line => {
    if (line.includes('CPU:')) {
      const match = line.match(/CPU: ([^,]+)/);
      if (match) metrics.cpu = match[1].trim();
    }
    if (line.includes('Output:')) {
      const match = line.match(/Output: ([0-9,]+) rows/);
      if (match) metrics.rows = match[1].trim();
    }
    // Fallback for "Input" if no output stats
    if (!metrics.rows && line.includes('Input:')) {
        const match = line.match(/Input: ([0-9,]+) rows/);
        if (match) metrics.rows = match[1].trim();
    }
  });
  return metrics;
};

const parseOperators = (lines: string[]): ParsedOperator[] => {
  const root: ParsedOperator[] = [];
  const stack: { node: ParsedOperator; indent: number }[] = [];

  lines.forEach((line) => {
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    if (!trimmed) return;

    const isNodeLine = /^[A-Z]/.test(trimmed) || trimmed.startsWith('└─') || trimmed.startsWith('├─');

    if (isNodeLine) {
      // Clean prefix like "└─ "
      const cleanName = trimmed.replace(/^[│├└─\s]+/, '');
      const typeMatch = cleanName.match(/^([A-Za-z]+)/);
      const type = typeMatch ? typeMatch[1] : cleanName.split('[')[0];

      const newNode: ParsedOperator = {
        type,
        rawLine: cleanName,
        details: [],
        children: [],
        metrics: {}
      };

      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      if (stack.length === 0) root.push(newNode);
      else stack[stack.length - 1].node.children.push(newNode);

      stack.push({ node: newNode, indent });
    } else {
      if (stack.length > 0) {
        stack[stack.length - 1].node.details.push(trimmed);
      }
    }
  });

  // Post-process to extract metrics
  const processMetrics = (nodes: ParsedOperator[]) => {
    nodes.forEach(node => {
      node.metrics = extractMetrics(node.details);
      processMetrics(node.children);
    });
  };
  processMetrics(root);

  return root;
};

// --- Sub-Component: Operator Card ---
const PipelineStep = ({ operator, isLast }: { operator: ParsedOperator; isLast: boolean }) => {
  const [expanded, setExpanded] = React.useState(false);
  const config = getOperatorConfig(operator.type);

  return (
    <Box sx={{ display: 'flex', position: 'relative' }}>
      {/* Timeline Line */}
      {!isLast && (
        <Box sx={{
          position: 'absolute',
          left: 14,
          top: 32,
          bottom: -16,
          width: 2,
          bgcolor: '#e0e0e0',
          zIndex: 0
        }} />
      )}

      {/* Icon Column */}
      <Box sx={{ mr: 2, pt: 0.5, zIndex: 1 }}>
        <Box sx={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          bgcolor: config.bg,
          color: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${config.color}40`
        }}>
          {config.icon}
        </Box>
      </Box>

      {/* Content Column */}
      <Box sx={{ flex: 1, pb: 2 }}>
        <Paper variant="outlined" sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          borderColor: expanded ? config.color : 'inherit',
          transition: 'all 0.2s'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212529' }}>
                {operator.rawLine.split('[')[0]} 
                <Typography component="span" variant="caption" sx={{ color: '#666', ml: 1 }}>
                   {operator.rawLine.match(/\[(.*?)\]/)?.[1]}
                </Typography>
              </Typography>
              
              {/* Quick Metrics Badges */}
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {operator.metrics.rows && (
                  <Chip 
                    icon={<TableRows style={{ fontSize: 12 }} />} 
                    label={operator.metrics.rows} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#f5f5f5' }} 
                  />
                )}
                {operator.metrics.cpu && (
                  <Chip 
                    icon={<Speed style={{ fontSize: 12 }} />} 
                    label={operator.metrics.cpu} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem', 
                      bgcolor: operator.metrics.cpu.includes('ms') ? '#e3f2fd' : '#ffebee',
                      color: operator.metrics.cpu.includes('ms') ? 'inherit' : '#d32f2f'
                    }} 
                  />
                )}
              </Box>
            </Box>

            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
          </Box>

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Box sx={{ 
              mt: 1.5, 
              pt: 1.5, 
              borderTop: '1px dashed #e0e0e0',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: '#455a64'
            }}>
              {operator.details.map((d, i) => (
                <div key={i} style={{ marginBottom: 2 }}>{d}</div>
              ))}
            </Box>
          </Collapse>
        </Paper>

        {/* Recursive Children */}
        {operator.children.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {operator.children.map((child, idx) => (
              <PipelineStep 
                key={idx} 
                operator={child} 
                isLast={idx === operator.children.length - 1} 
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

interface DetailedOperatorPipelineProps {
  operators: string[];
}

export default function DetailedOperatorPipeline({ operators }: DetailedOperatorPipelineProps) {
  const parsed = React.useMemo(() => parseOperators(operators), [operators]);

  return (
    <Box sx={{ p: 1 }}>
      {parsed.map((op, idx) => (
        <PipelineStep 
          key={idx} 
          operator={op} 
          isLast={idx === parsed.length - 1} 
        />
      ))}
    </Box>
  );
}