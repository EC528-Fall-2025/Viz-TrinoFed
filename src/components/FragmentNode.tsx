import * as React from "react";
import { Box, Chip, Typography, Divider } from "@mui/material";
import { Handle, Position } from "@xyflow/react";
import { Fragment } from '../types/api.types';
import Modal from './Modal';
import CopyPaste from "./CopyPaste";
import { 
  HourglassBottom, 
  QuestionMark, 
  SentimentSatisfiedAlt, 
  Check
} from "@mui/icons-material";

interface FragmentNodeProps {
  data: {
    fragment: Fragment;
  };
}

// REMOVED: getFragmentStatusColor (now using white background)

/**
 * Gets the accent color based on fragment status (for border, handles, and header)
 */
const getFragmentAccentColor = (fragment: Fragment) => {
  // Use CPU time to determine status color
  if (fragment.cpuTimeMs !== null && fragment.cpuTimeMs > 0) {
    return '#51cf66'; // Green for completed (from DatabaseNode 'ACTIVE')
  } else if (fragment.cpuTimeMs === 0) {
    return '#fcc419'; // Yellow for minimal/pending
  }
  return '#1976d2'; // Blue for default/running
};

const getFragmentStatusIcon = (fragment: Fragment) => {
  if (fragment.cpuTimeMs !== null && fragment.cpuTimeMs > 0) {
    return <Check />;
  } else if (fragment.cpuTimeMs === 0) {
    return <HourglassBottom />;
  }
  // Use QuestionMark for null cpuTimeMs, SentimentSatisfiedAlt for other cases
  return fragment.cpuTimeMs === null ? <QuestionMark /> : <SentimentSatisfiedAlt />;
};

const formatBytes = (bytes: number | null): string => {
  if (bytes === null || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export function FragmentNode({ data }: FragmentNodeProps) {
  const fragment = data.fragment;
  // const bgColor = getFragmentStatusColor(fragment); // REMOVED
  const statusIcon = getFragmentStatusIcon(fragment);
  const accentColor = getFragmentAccentColor(fragment); // NEW

  return (
    <Box 
      role="group" 
      aria-label={`Fragment ${fragment.fragmentId}`} 
      tabIndex={0}
      sx={{
        width: 320, 
        maxHeight: 500, 
        overflowY: 'auto',
        borderRadius: '12px', // UPDATED
        border: 3, 
        borderColor: accentColor, // UPDATED
        bgcolor: '#ffffff', // UPDATED
        p: 2, 
        boxShadow: '0 6px 16px rgba(0,0,0,0.2)', // UPDATED
        transition: 'transform 0.2s, box-shadow 0.2s', // NEW
        // REMOVED: '&:focus-visible' and '&:hover' pseudo-classes
      }}
      // NEW: Added hover effects to match DatabaseNode
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
      }}
    >
      <CopyPaste dataToCopy={`Fragment ${fragment.fragmentId} [${fragment.partitioningType}]`} />
      <Modal top={0} right={40} />
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: accentColor }}>
          Fragment {fragment.fragmentId} {/* UPDATED */}
        </Typography>
        {statusIcon}
        <Box sx={{ ml: 'auto' }}>
          <Chip 
            size="small" 
            label={fragment.partitioningType} 
            sx={{ 
              fontWeight: 600,
              backgroundColor: accentColor, // UPDATED
              color: 'white',
            }} 
          />
        </Box>
      </Box>

      {/* Metrics Section */}
      <Divider sx={{ my: 1.5, borderColor: '#ccc' }} />
      <Box component="dl" sx={{ 
        m: 0, 
        display: 'grid', 
        gridTemplateColumns: 'max-content 1fr', 
        columnGap: 2, 
        rowGap: 0.75,
        fontSize: '0.85rem'
      }}>
        {fragment.cpuTime && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>CPU Time:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{fragment.cpuTime}</Box>
          </>
        )}
        
        {fragment.scheduledTime && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Scheduled:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{fragment.scheduledTime}</Box>
          </>
        )}
        
        {fragment.blockedTime && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Blocked:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{fragment.blockedTime}</Box>
          </>
        )}
        
        {fragment.inputRows !== null && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Input Rows:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>
              {fragment.inputRows.toLocaleString()}
            </Box>
          </>
        )}
        
        {fragment.inputBytes && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Input Size:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{fragment.inputBytes}</Box>
          </>
        )}
        
        {fragment.outputRows !== null && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Output Rows:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>
              {fragment.outputRows.toLocaleString()}
            </Box>
          </>
        )}
        
        {fragment.outputBytes && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Output Size:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{fragment.outputBytes}</Box>
          </>
        )}
        
        {fragment.peakMemory && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Peak Memory:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{fragment.peakMemory}</Box>
          </>
        )}
        
        {fragment.taskCount !== null && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#333' }}>Task Count:</Box>
            <Box component="dd" sx={{ m: 0, color: '#1a1a1a', fontWeight: 600 }}>{fragment.taskCount}</Box>
          </>
        )}
      </Box>

      {/* Output Layout */}
      {fragment.outputLayout && (
        <>
          <Divider sx={{ my: 1.5, borderColor: '#ccc' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
              Output Layout:
            </Typography>
            <Box component="code" sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: 'rgba(0,0,0,0.05)',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              display: 'block',
              wordBreak: 'break-all',
            }}>
              {fragment.outputLayout}
            </Box>
          </Box>
        </>
      )}

      {/* Output Partitioning */}
      {fragment.outputPartitioning && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
            Output Partitioning:
          </Typography>
          <Box component="code" sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: 'rgba(0,0,0,0.05)',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            display: 'block',
            wordBreak: 'break-all',
          }}>
            {fragment.outputPartitioning}
          </Box>
        </Box>
      )}

      {/* Operators Preview */}
      {fragment.operators && fragment.operators.length > 0 && (
        <>
          <Divider sx={{ my: 1.5, borderColor: '#ccc' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
              Operators ({fragment.operators.length}):
            </Typography>
            <Box sx={{
              maxHeight: 100,
              overflowY: 'auto',
              bgcolor: 'rgba(0,0,0,0.03)',
              borderRadius: 1,
              p: 1,
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {fragment.operators.slice(0, 5).join('\n')}
              {fragment.operators.length > 5 && '\n... (see more in plan panel)'}
            </Box>
          </Box>
        </>
      )}
      
      {/* Handles for connections */}
      {/* UPDATED: All handles now use accentColor */}
      <Handle id="inTop" type="target" position={Position.Top} style={{ background: accentColor, width: 12, height: 12 }} />
      <Handle id="outBottom" type="source" position={Position.Bottom} style={{ background: accentColor, width: 12, height: 12 }} />
      <Handle id="in" type="target" position={Position.Left} style={{ background: accentColor, width: 12, height: 12 }} />
      <Handle id="out" type="source" position={Position.Right} style={{ background: accentColor, width: 12, height: 12 }} />
    </Box>
  );
}