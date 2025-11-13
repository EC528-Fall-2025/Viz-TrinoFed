import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import {
  HourglassBottom,
  SentimentVeryDissatisfied,
  SentimentNeutral,
  SentimentSatisfiedAlt,
  Check,
  QuestionMark,
} from '@mui/icons-material';
import { Chip, Box } from '@mui/material';
import CopyPaste from './CopyPaste';
import { useRef } from 'react';

export type CardProps = {
  title: string;
  description: string;
  status: "ok" | "idle" | "failed" | "queued" | "finished" | "unknown" | "running";
  timestamp: string;
  onClick?: () => void;
};

// 🎨 Keep your preferred colors
export const setStatusColor = (state: CardProps['status']) => {
  switch (state) {
    case 'queued':
      return '#ffffff';
    case 'failed':
      return '#c73f3fff';
    case 'idle':
      return '#f0e806';
    case 'ok':
      return '#8acd7dff';
    case 'finished':
      return '#608dff';
    case 'unknown':
      return '#cdcdcd';
  }
};

export const setStatusIcon = (state: CardProps['status']) => {
  switch (state) {
    case 'queued':
      return <HourglassBottom />;
    case 'failed':
      return <SentimentVeryDissatisfied />;
    case 'idle':
      return <SentimentNeutral />;
    case 'ok':
      return <SentimentSatisfiedAlt />;
    case 'finished':
      return <Check />;
    case 'unknown':
      return <QuestionMark />;
  }
};

export function StatusChip({ status }: { status?: CardProps['status'] }) {
  if (!status) return null;
  const color =
    status === 'ok'
      ? 'success'
      : status === 'idle'
      ? 'warning'
      : status === 'failed'
      ? 'error'
      : 'default';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Chip
      size="small"
      color={color as any}
      label={label}
      sx={{
        fontWeight: 600,
        position: 'absolute',
        bottom: 10,
        right: 10,
        padding: 0,
        borderRadius: '8px',
      }}
    />
  );
}

// 🕒 Helper: Format timestamp to human-readable local format
const formatTimestamp = (ts: string) => {
  try {
    const date = new Date(ts);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts; // fallback
  }
};

export default function BasicCard({
  title,
  description,
  status,
  timestamp,
  onClick,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    console.log('Card onClick triggered for:', title);
    if (onClick) onClick();
  };

  return (
    <Card
      ref={cardRef}
      sx={{
        minWidth: 275,
        backgroundColor: setStatusColor(status),
        position: 'relative',
        borderRadius: '14px', // 🌿 smooth rounded edges
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 3px 6px rgba(0,0,0,0.1)', // subtle depth
        transition: 'all 0.25s ease',
        border: '1px solid rgba(0,0,0,0.08)',
        '&:hover': onClick
          ? {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
            }
          : {},
      }}
      onClick={handleClick}
    >
      <CopyPaste
        copyParentContent
        parentRef={cardRef}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
        }}
      />
      <CardContent
        onClick={handleClick}
        sx={{
          paddingTop: '36px',
          paddingBottom: '50px',
          paddingX: '24px',
        }}
      >
        <Box sx={{ ml: 'auto' }}>
          <StatusChip status={status} />
        </Box>
        <Typography
          gutterBottom
          sx={{
            color: 'text.secondary',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h5"
          component="div"
          sx={{ fontWeight: 600, color: '#1f2937' }}
        >
          {description}
        </Typography>

        {status && (
          <>
            <Box component="dt" sx={{ fontWeight: 600, mt: 1 }}>
              Status
            </Box>
            <Box component="dd" sx={{ m: 0 }}>
              {setStatusIcon(status)}
            </Box>
          </>
        )}
        {timestamp && (
          <>
            <Box component="dt" sx={{ fontWeight: 600, mt: 1 }}>
              Timestamp
            </Box>
            <Box component="dd" sx={{ m: 0 }}>
              {formatTimestamp(timestamp)}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
