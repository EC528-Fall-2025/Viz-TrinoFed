import * as React from 'react';
import { Box, Typography } from '@mui/material';

interface ParsedOperator {
  type: string;
  details: string[];
  children: ParsedOperator[];
  indent: number;
}

interface OperatorTreeProps {
  operators: string[];
}

const parseOperators = (operators: string[]): ParsedOperator[] => {
  const root: ParsedOperator[] = [];
  const stack: { node: ParsedOperator; indent: number }[] = [];

  operators.forEach((line) => {
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    if (!trimmed) return;

    const isOperator = /^[A-Z]/.test(trimmed) || trimmed.startsWith('└─') || trimmed.startsWith('├─');

    if (isOperator) {
      const operatorMatch = trimmed.match(/^([A-Za-z]+)/);
      const type = operatorMatch ? operatorMatch[1] : trimmed.split('[')[0];

      const newNode: ParsedOperator = {
        type,
        details: [trimmed],
        children: [],
        indent,
      };

      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(newNode);
      } else {
        stack[stack.length - 1].node.children.push(newNode);
      }

      stack.push({ node: newNode, indent });
    } else {
      if (stack.length > 0) {
        stack[stack.length - 1].node.details.push(trimmed);
      }
    }
  });

  return root;
};

const parseDetailLine = (detail: string) => {
  const cleanedDetail = detail.replace(/^[│├└─\s]+/, '');
  
  if (cleanedDetail.includes(':') && !cleanedDetail.includes('http')) {
    const [key, ...valueParts] = cleanedDetail.split(':');
    const value = valueParts.join(':').trim();
    
    const isMetric = /CPU|Scheduled|Blocked|Output|Input|Layout|Estimates|Distribution|Memory|rows|ms|MB|GB/i.test(key);
    
    return { key: key.trim(), value, isMetric, isKeyValue: true };
  }
  
  return { key: cleanedDetail, value: null, isMetric: false, isKeyValue: false };
};

const OperatorNode: React.FC<{ operator: ParsedOperator; depth: number }> = ({ operator, depth }) => {
  const [expanded, setExpanded] = React.useState(depth < 2);

  const getOperatorColor = (type: string): string => {
    if (type.includes('Join')) return '#1976d2';
    if (type.includes('Scan') || type.includes('TableScan')) return '#2e7d32';
    if (type.includes('Filter')) return '#ed6c02';
    if (type.includes('Project')) return '#9c27b0';
    if (type.includes('Aggregate')) return '#d32f2f';
    if (type.includes('Exchange')) return '#0288d1';
    return '#616161';
  };

  const color = getOperatorColor(operator.type);

  return (
    <Box sx={{ mb: 1.5 }}>
      {/* Enhanced Operator Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          padding: '10px 14px',
          backgroundColor: 'white',
          borderLeft: `5px solid ${color}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          '&:hover': {
            backgroundColor: '#fafafa',
            boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
            transform: 'translateX(2px)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: `${color}15`,
            color: color,
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▶
        </Box>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: color,
            flex: 1,
            letterSpacing: '0.3px',
          }}
        >
          {operator.type}
        </Typography>
        <Box
          sx={{
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: `${color}15`,
            fontSize: '10px',
            fontWeight: 600,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {operator.details.length - 1} details
        </Box>
      </Box>

      {/* Enhanced Operator Details */}
      {expanded && (
        <Box sx={{ 
          pl: 4, 
          mt: 1.5, 
          backgroundColor: 'white',
          borderRadius: '8px', 
          p: 2.5,
          ml: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          borderLeft: `3px solid ${color}20`,
        }}>
          {/* Operator Definition */}
          <Box sx={{ 
            mb: 2.5, 
            pb: 2, 
            borderBottom: `2px solid ${color}20`,
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#2c3e50',
            fontWeight: 600,
            wordBreak: 'break-word',
            lineHeight: 1.6,
            backgroundColor: `${color}08`,
            padding: '12px',
            borderRadius: '6px',
          }}>
            {operator.details[0]}
          </Box>

          {/* Details Grid */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {operator.details.slice(1).map((detail, idx) => {
              const parsed = parseDetailLine(detail);
              
              if (!parsed.isKeyValue) {
                return (
                  <Typography
                    key={idx}
                    sx={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: '#7f8c8d',
                      fontStyle: 'italic',
                      mt: idx > 0 ? 1 : 0,
                      pl: 1,
                      borderLeft: '2px solid #ecf0f1',
                      py: 0.5,
                    }}
                  >
                    {parsed.key}
                  </Typography>
                );
              }

              return (
                <Box
                  key={idx}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: parsed.isMetric ? '140px 1fr' : '1fr',
                    gap: 2,
                    alignItems: 'start',
                    pl: detail.startsWith('│') ? 2 : 0,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: parsed.isMetric ? '#f8f9fa' : 'transparent',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: parsed.isMetric ? '#e9ecef' : '#f8f9fa',
                    },
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: parsed.isMetric ? '#2e7d32' : '#1976d2',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&::before': parsed.isMetric ? {
                        content: '"●"',
                        fontSize: '8px',
                        color: '#2e7d32',
                      } : {},
                    }}
                  >
                    {parsed.key}
                  </Typography>
                  {parsed.value && (
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: parsed.isMetric ? '#2c3e50' : '#34495e',
                        fontWeight: parsed.isMetric ? 600 : 400,
                        wordBreak: 'break-word',
                        lineHeight: 1.6,
                      }}
                    >
                      {parsed.value}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Child Operations Section */}
          {operator.children.length > 0 && (
            <Box sx={{ mt: 3, pt: 2.5, borderTop: '2px dashed #dee2e6' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2,
                padding: '8px 12px',
                backgroundColor: `${color}10`,
                borderRadius: '6px',
              }}>
                <Box sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: color,
                }} />
                <Typography sx={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: '#495057',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Child Operations ({operator.children.length})
                </Typography>
              </Box>
              <Box sx={{ pl: 1.5, borderLeft: `3px solid ${color}30` }}>
                {operator.children.map((child, idx) => (
                  <OperatorNode key={idx} operator={child} depth={depth + 1} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export const OperatorTree: React.FC<OperatorTreeProps> = ({ operators }) => {
  const parsedOperators = parseOperators(operators);

  return (
    <Box sx={{ 
      padding: 1,
      '& > *:last-child': {
        marginBottom: 0,
      }
    }}>
      {parsedOperators.map((operator, idx) => (
        <OperatorNode key={idx} operator={operator} depth={0} />
      ))}
    </Box>
  );
};
