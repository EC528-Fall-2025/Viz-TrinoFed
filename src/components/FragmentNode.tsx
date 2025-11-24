import * as React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { Handle, Position } from "@xyflow/react";
import { Fragment } from '../types/api.types';
import CopyPaste from './CopyPaste';
import { 
  Check,
  HourglassBottom,
  QuestionMark,
  SentimentSatisfiedAlt
} from "@mui/icons-material";

interface FragmentNodeProps {
  data: {
    fragment: Fragment;
  };
}

const getFragmentAccentColor = (fragment: Fragment) => {
  if (fragment.cpuTimeMs !== null && fragment.cpuTimeMs > 0) {
    return '#51cf66'; // Green for completed
  } else if (fragment.cpuTimeMs === 0) {
    return '#fcc419'; // Yellow for minimal/pending
  }
  return '#1976d2'; // Blue for default/running
};

const getFragmentStatusIcon = (fragment: Fragment) => {
  if (fragment.cpuTimeMs !== null && fragment.cpuTimeMs > 0) {
    return <Check sx={{ fontSize: 18 }} />;
  } else if (fragment.cpuTimeMs === 0) {
    return <HourglassBottom sx={{ fontSize: 18 }} />;
  }
  return fragment.cpuTimeMs === null ? <QuestionMark sx={{ fontSize: 18 }} /> : <SentimentSatisfiedAlt sx={{ fontSize: 18 }} />;
};

export function FragmentNode({ data }: FragmentNodeProps) {
  const fragment = data.fragment;
  const accentColor = getFragmentAccentColor(fragment);
  const statusIcon = getFragmentStatusIcon(fragment);

  return (
    <Box 
      role="group" 
      aria-label={`Fragment ${fragment.fragmentId}`} 
      tabIndex={0}
      sx={{
        width: 240,
        borderRadius: '12px',
        border: 3,
        borderColor: accentColor,
        bgcolor: '#ffffff',
        p: 2,
        boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
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
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: accentColor, fontSize: '16px' }}>
            Fragment {fragment.fragmentId}
          </Typography>
          {statusIcon}
        </Box>
        <Chip 
          size="small" 
          label={fragment.partitioningType} 
          sx={{ 
            fontWeight: 600,
            backgroundColor: accentColor,
            color: 'white',
            fontSize: '10px',
            height: '22px'
          }} 
        />
      </Box>

      {/* Critical Metrics Only */}
      <Box component="dl" sx={{ 
        m: 0, 
        display: 'grid', 
        gridTemplateColumns: 'max-content 1fr', 
        columnGap: 1.5, 
        rowGap: 0.5,
        fontSize: '0.75rem'
      }}>
        {fragment.cpuTime && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#495057' }}>CPU:</Box>
            <Box component="dd" sx={{ m: 0, color: '#212529', fontWeight: 600 }}>{fragment.cpuTime}</Box>
          </>
        )}
        
        {(fragment.inputRows !== null || fragment.outputRows !== null) && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#495057' }}>I/O:</Box>
            <Box component="dd" sx={{ m: 0, color: '#212529', fontWeight: 600 }}>
              {fragment.inputRows !== null ? fragment.inputRows.toLocaleString() : '0'} → {fragment.outputRows !== null ? fragment.outputRows.toLocaleString() : '0'}
            </Box>
          </>
        )}
        
        {fragment.peakMemory && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#495057' }}>Memory:</Box>
            <Box component="dd" sx={{ m: 0, color: '#212529', fontWeight: 600 }}>{fragment.peakMemory}</Box>
          </>
        )}

        {fragment.operators && fragment.operators.length > 0 && (
          <>
            <Box component="dt" sx={{ fontWeight: 700, color: '#495057' }}>Ops:</Box>
            <Box component="dd" sx={{ m: 0, color: '#212529', fontWeight: 600 }}>{fragment.operators.length}</Box>
          </>
        )}
      </Box>

      {/* Click hint */}
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block',
          textAlign: 'center',
          color: '#868e96',
          fontStyle: 'italic',
          mt: 1,
          fontSize: '0.65rem'
        }}
      >
        Click for details
      </Typography>
      
      {/* Handles */}
      <Handle id="inTop" type="target" position={Position.Top} style={{ background: accentColor, width: 12, height: 12 }} />
      <Handle id="outBottom" type="source" position={Position.Bottom} style={{ background: accentColor, width: 12, height: 12 }} />
      <Handle id="in" type="target" position={Position.Left} style={{ background: accentColor, width: 12, height: 12 }} />
      <Handle id="out" type="source" position={Position.Right} style={{ background: accentColor, width: 12, height: 12 }} />
    </Box>
  );
}