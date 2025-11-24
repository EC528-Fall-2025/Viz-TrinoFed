import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { TableChart, Close } from "@mui/icons-material";

interface QueryResultsDialogProps {
  open: boolean;
  query: string | undefined;
  onClose: () => void;
}

interface QueryResult {
  columns: string[];
  data: any[][];
}

export function QueryResultsDialog({ open, query, onClose }: QueryResultsDialogProps) {
  const [queryResult, setQueryResult] = React.useState<QueryResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && query) {
      executeQuery();
    }
  }, [open, query]);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setQueryResult(null);

    if (!query) {
      setError("No query available to execute");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/queries/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setQueryResult({
        columns: result.columns || [],
        data: result.data || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch query results');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQueryResult(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '2px solid #2e7d32',
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: '#c8e6c9',
        color: '#1b5e20',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableChart sx={{ color: '#2e7d32' }} />
          Query Results
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: '#1b5e20', '&:hover': { bgcolor: 'rgba(27, 94, 32, 0.1)' } }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, p: 3, minHeight: 300 }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress sx={{ color: '#2e7d32', mb: 2 }} size={60} />
            <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 600 }}>
              Executing query...
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error">
            <Typography variant="h6" sx={{ mb: 1 }}>Error</Typography>
            {error}
          </Alert>
        )}

        {!loading && !error && queryResult && (
          <>
            <Typography variant="body2" sx={{ mb: 2, color: '#1b5e20', fontWeight: 600 }}>
              Showing {queryResult.data.length} row{queryResult.data.length !== 1 ? 's' : ''}
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400, border: '1px solid #e0e0e0' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {queryResult.columns.map((col, idx) => (
                      <TableCell
                        key={idx}
                        sx={{
                          bgcolor: '#2e7d32',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryResult.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={queryResult.columns.length} align="center" sx={{ py: 4, color: '#666' }}>
                        No results found
                      </TableCell>
                    </TableRow>
                  ) : (
                    queryResult.data.map((row, rowIdx) => (
                      <TableRow
                        key={rowIdx}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: 'rgba(46, 125, 50, 0.05)' },
                          '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.1)' },
                        }}
                      >
                        {row.map((cell, cellIdx) => (
                          <TableCell
                            key={cellIdx}
                            sx={{
                              fontSize: '0.8rem',
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {cell === null ? <em style={{ color: '#999' }}>null</em> : String(cell)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            bgcolor: '#2e7d32',
            color: 'white',
            '&:hover': { bgcolor: '#1b5e20' },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
