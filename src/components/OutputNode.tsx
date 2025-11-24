import * as React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Handle, Position } from "@xyflow/react";
import { Check, Output as OutputIcon, TableChart } from "@mui/icons-material";
import CopyPaste from "./CopyPaste";
import { useQueryResults } from "../contexts/QueryResultsContext";

interface OutputNodeProps {
  data: {
    queryId: string;
    query?: string;
    state?: string;
    totalRows?: number | null;
    executionTime?: number | null;
    outputLayout?: string | null;
    outputColumns?: string[];
  };
}

export function OutputNode({ data }: OutputNodeProps) {
  const { openResults } = useQueryResults();

  const handleViewResults = () => {
    if (data.query) {
      openResults(data.query);
    }
  };

  return (
    <Box 
      role="group" 
      aria-label="Query Output" 
      tabIndex={0}
      sx={{
        width: 280, 
        minHeight: 140,
        borderRadius: 2, 
        border: 3, 
        borderColor: '#2e7d32',
        bgcolor: '#c8e6c9',
        p: 2, 
        boxShadow: 4,
        '&:focus-visible': { boxShadow: 6, borderColor: '#1b5e20' },
        '&:hover': { boxShadow: 6, borderColor: '#1b5e20' },
      }}
    >
      <CopyPaste dataToCopy="Query Output" />
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <OutputIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#2e7d32' }}>
          Output
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Check sx={{ color: '#2e7d32' }} />
        </Box>
      </Box>

      {/* Description */}
      <Typography variant="body2" sx={{ color: '#1b5e20', mb: 1, fontWeight: 500 }}>
        Final query results
      </Typography>

      {/* View Results Button */}
      {data.query && (
        <Button
          variant="contained"
          size="small"
          startIcon={<TableChart />}
          onClick={handleViewResults}
          sx={{
            mb: 1.5,
            bgcolor: '#2e7d32',
            color: 'white',
            fontSize: '0.75rem',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#1b5e20' },
          }}
        >
          View Query Results
        </Button>
      )}

      {/* Metrics */}
      {(data.totalRows !== null || data.executionTime !== null) && (
        <Box component="dl" sx={{ 
          m: 0, 
          display: 'grid', 
          gridTemplateColumns: 'max-content 1fr', 
          columnGap: 2, 
          rowGap: 0.5,
          fontSize: '0.85rem',
          borderTop: '1px solid rgba(46, 125, 50, 0.3)',
          paddingTop: 1
        }}>
          {data.totalRows !== null && data.totalRows !== undefined && (
            <>
              <Box component="dt" sx={{ fontWeight: 700, color: '#1b5e20' }}>Output Rows:</Box>
              <Box component="dd" sx={{ m: 0, color: '#1b5e20', fontWeight: 600 }}>
                {data.totalRows.toLocaleString()}
              </Box>
            </>
          )}
          
          {data.executionTime !== null && data.executionTime !== undefined && (
            <>
              <Box component="dt" sx={{ fontWeight: 700, color: '#1b5e20' }}>Total Time:</Box>
              <Box component="dd" sx={{ m: 0, color: '#1b5e20', fontWeight: 600 }}>
                {data.executionTime} ms
              </Box>
            </>
          )}

          {data.state && (
            <>
              <Box component="dt" sx={{ fontWeight: 700, color: '#1b5e20' }}>Status:</Box>
              <Box component="dd" sx={{ m: 0, color: '#1b5e20', fontWeight: 600 }}>
                {data.state}
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Output Structure */}
      {(data.outputColumns && data.outputColumns.length > 0) ? (
        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid rgba(46, 125, 50, 0.3)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1b5e20', display: 'block', mb: 0.75 }}>
            Result Columns:
          </Typography>
          <Box sx={{
            maxHeight: 80,
            overflowY: 'auto',
            bgcolor: 'rgba(27, 94, 32, 0.08)',
            borderRadius: 1,
            p: 0.75,
          }}>
            {data.outputColumns.map((col, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'inline-block',
                  bgcolor: '#2e7d32',
                  color: 'white',
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  mr: 0.5,
                  mb: 0.5,
                }}
              >
                {col}
              </Box>
            ))}
          </Box>
        </Box>
      ) : data.query && (
        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid rgba(46, 125, 50, 0.3)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1b5e20', display: 'block', mb: 0.5 }}>
            Query:
          </Typography>
          <Box sx={{
            maxHeight: 60,
            overflowY: 'auto',
            bgcolor: 'rgba(27, 94, 32, 0.08)',
            borderRadius: 1,
            p: 0.75,
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: '#1b5e20',
          }}>
            {data.query.length > 150 ? data.query.substring(0, 150) + '...' : data.query}
          </Box>
        </Box>
      )}
      
      {/* Left handle only - this is the final destination */}
      <Handle id="in" type="target" position={Position.Left} style={{ background: '#2e7d32', width: 12, height: 12 }} />
    </Box>
  );
}

