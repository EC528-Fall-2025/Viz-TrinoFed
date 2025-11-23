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
    // For time and bytes metrics, filter out zeros that likely represent missing data
    // If there are non-zero values, zeros are probably missing data
    // If all values are zero, they might be legitimate (e.g., all queries had 0 queued time or 0 bytes)
    const isTimeMetric = metric.toLowerCase().includes('time') || metric.toLowerCase().includes('duration');
    const isBytesMetric = metric.toLowerCase().includes('bytes') || metric.toLowerCase().includes('memory');
    const shouldFilterZeros = isTimeMetric || isBytesMetric;
    let validData = data;
    
    if (shouldFilterZeros) {
        const nonZeroData = data.filter(d => d > 0);
        // Only filter zeros if we have non-zero values (zeros are likely missing data)
        // If all are zero, keep them (they might be legitimate)
        if (nonZeroData.length > 0 && nonZeroData.length < data.length) {
            validData = nonZeroData;
        }
    }
    
    if (validData.length === 0) {
        return { mean: 0, variance: 0, stdev: 0, median: 0, iqr: 0, min: 0, max: 0, p90: 0, p99: 0, metric };
    }
    
    const sortedData = [...validData].sort((a, b) => a - b);
    const mean = validData.reduce((sum, value) => sum + value, 0) / validData.length;
    const variance = validData.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / validData.length;
    const stdev = Math.sqrt(variance);
    
    // Calculate median correctly: for even-length arrays, average the two middle values
    let median: number;
    if (sortedData.length % 2 === 0) {
        // Even length: average the two middle values
        const mid1 = sortedData[sortedData.length / 2 - 1];
        const mid2 = sortedData[sortedData.length / 2];
        median = (mid1 + mid2) / 2;
    } else {
        // Odd length: take the middle value
        median = sortedData[Math.floor(sortedData.length / 2)];
    }
    
    // Calculate Q1 (25th percentile) and Q3 (75th percentile)
    const q1Index = Math.floor(sortedData.length / 4);
    const q3Index = Math.floor(3 * sortedData.length / 4);
    const q1 = sortedData[q1Index];
    const q3 = sortedData[q3Index];
    // IQR = Q3 - Q1 (should always be >= 0)
    const iqr = Math.max(0, q3 - q1);
    
    const min = Math.min(...validData);
    const max = Math.max(...validData);
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