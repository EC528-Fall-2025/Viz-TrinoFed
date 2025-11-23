import { Box, Typography } from '@mui/material';

interface SummaryProps {
    mean: number;
    variance: number;
    stdev: number;
    median: number;
    iqr: number;
    min: number;
    max: number;
    p90: number;
    p99: number;
    metric: string;
}

export function calculateSummary(data: number[], metric: string): SummaryProps {
    if (data.length === 0) {
        return { mean: 0, variance: 0, stdev: 0, median: 0, iqr: 0, min: 0, max: 0, p90: 0, p99: 0, metric };
    }
    
    const sortedData = [...data].sort((a, b) => a - b);
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    const stdev = Math.sqrt(variance);
    const median = sortedData[Math.floor(sortedData.length / 2)];
    
    // Calculate Q1 (25th percentile) and Q3 (75th percentile)
    const q1Index = Math.floor(sortedData.length / 4);
    const q3Index = Math.floor(3 * sortedData.length / 4);
    const q1 = sortedData[q1Index];
    const q3 = sortedData[q3Index];
    // IQR = Q3 - Q1 (should always be >= 0)
    const iqr = Math.max(0, q3 - q1);
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const p90 = sortedData[Math.floor(90 * sortedData.length / 100)];
    const p99 = sortedData[Math.floor(99 * sortedData.length / 100)];
    return { mean, variance, stdev, median, iqr, min, max, p90, p99, metric };
}

// Helper function to format numbers to at most 4 decimal places
const formatNumber = (num: number): string => {
    // Round to 4 decimal places
    const rounded = Math.round(num * 10000) / 10000;
    // Format to show up to 4 decimal places, removing trailing zeros
    return rounded.toFixed(4).replace(/\.?0+$/, '');
};

export default function Summary({mean, variance, stdev, median, iqr, min, max, p90, p99, metric }: SummaryProps) {
    return (        
        <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2, marginBottom: 1 }}>Summary Statistics for {metric}</Typography>
            <Typography sx={{ width: 'fit-content'}} variant="body1">Mean: {formatNumber(mean)}</Typography>
            <Typography sx={{ width: 'fit-content'}} variant="body1">Variance: {formatNumber(variance)}</Typography>
            <Typography sx={{ width: 'fit-content'}} variant="body1">Standard Deviation: {formatNumber(stdev)}</Typography>
            <Typography sx={{ width: 'fit-content'}} variant="body1">Median: {formatNumber(median)}</Typography>
            <Typography sx={{ width: 'fit-content'}} variant="body1">IQR: {formatNumber(iqr)}</Typography>
            <Typography sx={{ width: 'fit-content' }} variant="body1">Min: {formatNumber(min)}</Typography>
            <Typography sx={{ width: 'fit-content' }} variant="body1">Max: {formatNumber(max)}</Typography>
            <Typography sx={{ width: 'fit-content' }} variant="body1">P90: {formatNumber(p90)}</Typography>
            <Typography sx={{ width: 'fit-content' }} variant="body1">P99: {formatNumber(p99)}</Typography>
        </Box>
    );
}