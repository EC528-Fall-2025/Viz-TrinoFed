import Graph from '../components/Graph';
import { GraphData } from '../components/Graph';
import UpdateIntervalMenu from '../components/UpdateIntervalMenu';
import { apiService } from '../services/api.service';
import { useEffect, useState } from 'react';
import Summary, { calculateSummary } from '../components/Summary';

interface SummaryData {
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

// 
/**
 * This page will display the overall stats of the query.
 * Should get and update timestamped metrics at the minute level.
 * Choose rerender interval based on user preference.
 * Bytes, Duration, CPU Time, Wall Time, Queued Time, Peak Memory, 
 * Total Rows, Total Bytes, Completed Splits, Tokens Used
 */
export default function OverallStats() {
    const [durationData, setDurationData] = useState<GraphData[]>([]);
    const [cpuTimeData, setCpuTimeData] = useState<GraphData[]>([]);
    const [peakMemoryData, setPeakMemoryData] = useState<GraphData[]>([]);
    const [totalRowsData, setTotalRowsData] = useState<GraphData[]>([]);
    const [timestamps, setTimestamps] = useState<Date[]>([]);
    const [completedSplitsData, setCompletedSplitsData] = useState<GraphData[]>([]);
    const [totalBytesData, setTotalBytesData] = useState<GraphData[]>([]);
    const [queuedTimeData, setQueuedTimeData] = useState<GraphData[]>([]);
    const [wallTimeData, setWallTimeData] = useState<GraphData[]>([]);
    // Individual update intervals for each graph
    const [updateIntervalDuration, setUpdateIntervalDuration] = useState<'1s' | '10s' | '1m' | '10m' | '1h' | '1d'>('1m');
    const [updateIntervalCpuTime, setUpdateIntervalCpuTime] = useState<'1s' | '10s' | '1m' | '10m' | '1h' | '1d'>('1m');
    const [updateIntervalPeakMemory, setUpdateIntervalPeakMemory] = useState<'1s' | '10s' | '1m' | '10m' | '1h' | '1d'>('1m');
    const [updateIntervalTotalRows, setUpdateIntervalTotalRows] = useState<'1s' | '10s' | '1m' | '10m' | '1h' | '1d'>('1m');
    const [updateIntervalCompletedSplits, setUpdateIntervalCompletedSplits] = useState<'1s' | '10s' | '1m' | '10m' | '1h' | '1d'>('1m');
    const [updateIntervalTotalBytes, setUpdateIntervalTotalBytes] = useState<'1s' | '10s' | '1m' | '10m' | '1h' | '1d'>('1m');
    const [updateIntervalQueuedTime, setUpdateIntervalQueuedTime] = useState<'1s' | '10s' | '1m' | '10m' | '1h' | '1d'>('1m');
    const [updateIntervalWallTime, setUpdateIntervalWallTime] = useState<'1s' | '10s' | '1m' | '10m' | '1h' | '1d'>('1m');
    const [summaryDataDuration, setSummaryDataDuration] = useState<SummaryData | null>(null);
    const [summaryDataCpuTime, setSummaryDataCpuTime] = useState<SummaryData | null>(null);
    const [summaryDataPeakMemory, setSummaryDataPeakMemory] = useState<SummaryData | null>(null);
    const [summaryDataTotalRows, setSummaryDataTotalRows] = useState<SummaryData | null>(null);
    const [summaryDataCompletedSplits, setSummaryDataCompletedSplits] = useState<SummaryData | null>(null);
    const [summaryDataTotalBytes, setSummaryDataTotalBytes] = useState<SummaryData | null>(null);
    const [summaryDataQueuedTime, setSummaryDataQueuedTime] = useState<SummaryData | null>(null);
    const [summaryDataWallTime, setSummaryDataWallTime] = useState<SummaryData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const queries = await apiService.getAllQueries();
            
            // Transform QueryTree[] into GraphData[] for each metric
            const duration: GraphData[] = [];
            const cpuTime: GraphData[] = [];
            const peakMemory: GraphData[] = [];
            const totalRows: GraphData[] = [];
            const completedSplits: GraphData[] = [];
            const totalBytes: GraphData[] = [];
            const queuedTime: GraphData[] = [];
            const wallTime: GraphData[] = [];
            const ts: Date[] = [];
            
            // Use a Map to ensure one data point per timestamp (latest query wins if duplicates)
            const durationMap = new Map<number, number>();
            const cpuTimeMap = new Map<number, number>();
            const peakMemoryMap = new Map<number, number>();
            const totalRowsMap = new Map<number, number>();
            const completedSplitsMap = new Map<number, number>();
            const totalBytesMap = new Map<number, number>();
            const timestampSet = new Set<number>();
            const queuedTimeMap = new Map<number, number>();
            const wallTimeMap = new Map<number, number>();

            queries.forEach((query) => {
                const timestamp = new Date(query.startTime);
                const timestampMs = timestamp.getTime();
                timestampSet.add(timestampMs);
                
                // Find the COMPLETED event (has full statistics) or use the last event
                const completedEvent = query.events.find(e => e.eventType === 'COMPLETED') || query.events[query.events.length - 1];
                const stats = completedEvent?.statistics;
                
                // Duration data - use wallTime from statistics or totalExecutionTime or calculate from times
                let durationValue = 0;
                if (stats?.wallTime) {
                    durationValue = stats.wallTime * 1000; // Convert seconds to milliseconds
                } else if (query.totalExecutionTime) {
                    durationValue = query.totalExecutionTime;
                } else if (query.startTime && query.endTime) {
                    durationValue = new Date(query.endTime).getTime() - new Date(query.startTime).getTime();
                } else if (completedEvent?.wallTimeMs) {
                    durationValue = completedEvent.wallTimeMs;
                }
                // Use latest value if timestamp already exists
                durationMap.set(timestampMs, durationValue);
                
                // CPU Time - from statistics.cpuTime (in seconds) or cpuTimeMs
                let cpuTimeValue = 0;
                if (stats?.cpuTime) {
                    cpuTimeValue = stats.cpuTime * 1000; // Convert seconds to milliseconds
                } else if (completedEvent?.cpuTimeMs) {
                    cpuTimeValue = completedEvent.cpuTimeMs;
                }
                cpuTimeMap.set(timestampMs, cpuTimeValue);
                
                // Peak Memory - from statistics.peakUserMemoryBytes or peakMemoryBytes
                let peakMemoryValue = 0;
                if (stats?.peakUserMemoryBytes) {
                    peakMemoryValue = stats.peakUserMemoryBytes;
                } else if (completedEvent?.peakMemoryBytes) {
                    peakMemoryValue = completedEvent.peakMemoryBytes;
                }
                peakMemoryMap.set(timestampMs, peakMemoryValue);
                
                // Total Rows - from statistics.outputRows or totalRows
                let totalRowsValue = 0;
                if (stats?.outputRows) {
                    totalRowsValue = stats.outputRows;
                } else if (completedEvent?.totalRows) {
                    totalRowsValue = completedEvent.totalRows;
                }
                totalRowsMap.set(timestampMs, totalRowsValue);

                // Completed Splits - from statistics.completedSplits or completedSplits
                let completedSplitsValue = 0;
                if (stats?.completedSplits) {
                    completedSplitsValue = stats.completedSplits;
                } else if (completedEvent?.completedSplits) {
                    completedSplitsValue = completedEvent.completedSplits;
                }
                completedSplitsMap.set(timestampMs, completedSplitsValue);

                // Total Bytes - from statistics.outputBytes or totalBytes
                let totalBytesValue = 0;
                if (stats?.outputBytes) {
                    totalBytesValue = stats.outputBytes;
                } else if (completedEvent?.totalBytes) {
                    totalBytesValue = completedEvent.totalBytes;
                }
                totalBytesMap.set(timestampMs, totalBytesValue);

                // Queued Time - from statistics.queuedTime or queuedTimeMs
                let queuedTimeValue = 0;
                if (stats?.queuedTime) {
                    queuedTimeValue = stats.queuedTime * 1000; // Convert seconds to milliseconds
                } else if (completedEvent?.queuedTimeMs) {
                    queuedTimeValue = completedEvent.queuedTimeMs;
                }
                queuedTimeMap.set(timestampMs, queuedTimeValue);

                // Wall Time - from statistics.wallTime or wallTimeMs
                let wallTimeValue = 0;
                if (stats?.wallTime) {
                    wallTimeValue = stats.wallTime * 1000; // Convert seconds to milliseconds
                } else if (completedEvent?.wallTimeMs) {
                    wallTimeValue = completedEvent.wallTimeMs;
                }
                wallTimeMap.set(timestampMs, wallTimeValue);
            });
            
            // Convert Maps to sorted arrays (by timestamp)
            const sortedTimestamps = Array.from(timestampSet).sort((a, b) => a - b);
            sortedTimestamps.forEach((timestampMs) => {
                duration.push({
                    x: timestampMs,
                    y: durationMap.get(timestampMs) ?? 0
                });
                cpuTime.push({
                    x: timestampMs,
                    y: cpuTimeMap.get(timestampMs) ?? 0
                });
                peakMemory.push({
                    x: timestampMs,
                    y: peakMemoryMap.get(timestampMs) ?? 0
                });
                totalRows.push({
                    x: timestampMs,
                    y: totalRowsMap.get(timestampMs) ?? 0
                });
                completedSplits.push({
                    x: timestampMs,
                    y: completedSplitsMap.get(timestampMs) ?? 0
                });
                totalBytes.push({
                    x: timestampMs,
                    y: totalBytesMap.get(timestampMs) ?? 0
                });
                queuedTime.push({
                    x: timestampMs,
                    y: queuedTimeMap.get(timestampMs) ?? 0
                });
                wallTime.push({
                    x: timestampMs,
                    y: wallTimeMap.get(timestampMs) ?? 0
                });
                ts.push(new Date(timestampMs));
            });
            
            // Calculate summaries from the populated data arrays
            const durationSummary = duration.length > 0 ? calculateSummary(duration.map(d => d.y), 'Duration') : null;
            const cpuTimeSummary = cpuTime.length > 0 ? calculateSummary(cpuTime.map(d => d.y), 'CPU Time') : null;
            const peakMemorySummary = peakMemory.length > 0 ? calculateSummary(peakMemory.map(d => d.y), 'Peak Memory') : null;
            const totalRowsSummary = totalRows.length > 0 ? calculateSummary(totalRows.map(d => d.y), 'Total Rows') : null;
            const completedSplitsSummary = completedSplits.length > 0 ? calculateSummary(completedSplits.map(d => d.y), 'Completed Splits') : null;
            const totalBytesSummary = totalBytes.length > 0 ? calculateSummary(totalBytes.map(d => d.y), 'Total Bytes') : null;
            const queuedTimeSummary = queuedTime.length > 0 ? calculateSummary(queuedTime.map(d => d.y), 'Queued Time') : null;
            const wallTimeSummary = wallTime.length > 0 ? calculateSummary(wallTime.map(d => d.y), 'Wall Time') : null;
            
            setDurationData(duration);
            setCpuTimeData(cpuTime);
            setPeakMemoryData(peakMemory);
            setTotalRowsData(totalRows);
            setCompletedSplitsData(completedSplits);
            setTotalBytesData(totalBytes);
            setQueuedTimeData(queuedTime);
            setWallTimeData(wallTime);
            setTimestamps(ts);
            setSummaryDataDuration(durationSummary);
            setSummaryDataCpuTime(cpuTimeSummary);
            setSummaryDataPeakMemory(peakMemorySummary);
            setSummaryDataTotalRows(totalRowsSummary);
            setSummaryDataCompletedSplits(completedSplitsSummary);
            setSummaryDataTotalBytes(totalBytesSummary);
            setSummaryDataQueuedTime(queuedTimeSummary);
            setSummaryDataWallTime(wallTimeSummary);
        };
        
        // Load immediately
        fetchData();
        
        // Auto-refresh based on the fastest update interval
        const intervals = [
            updateIntervalDuration === '1s' ? 1000 : updateIntervalDuration === '10s' ? 10000 : updateIntervalDuration === '1m' ? 60000 : updateIntervalDuration === '10m' ? 600000 : updateIntervalDuration === '1h' ? 3600000 : 86400000,
            updateIntervalCpuTime === '1s' ? 1000 : updateIntervalCpuTime === '10s' ? 10000 : updateIntervalCpuTime === '1m' ? 60000 : updateIntervalCpuTime === '10m' ? 600000 : updateIntervalCpuTime === '1h' ? 3600000 : 86400000,
            updateIntervalPeakMemory === '1s' ? 1000 : updateIntervalPeakMemory === '10s' ? 10000 : updateIntervalPeakMemory === '1m' ? 60000 : updateIntervalPeakMemory === '10m' ? 600000 : updateIntervalPeakMemory === '1h' ? 3600000 : 86400000,
            updateIntervalTotalRows === '1s' ? 1000 : updateIntervalTotalRows === '10s' ? 10000 : updateIntervalTotalRows === '1m' ? 60000 : updateIntervalTotalRows === '10m' ? 600000 : updateIntervalTotalRows === '1h' ? 3600000 : 86400000,
            updateIntervalCompletedSplits === '1s' ? 1000 : updateIntervalCompletedSplits === '10s' ? 10000 : updateIntervalCompletedSplits === '1m' ? 60000 : updateIntervalCompletedSplits === '10m' ? 600000 : updateIntervalCompletedSplits === '1h' ? 3600000 : 86400000,
            updateIntervalTotalBytes === '1s' ? 1000 : updateIntervalTotalBytes === '10s' ? 10000 : updateIntervalTotalBytes === '1m' ? 60000 : updateIntervalTotalBytes === '10m' ? 600000 : updateIntervalTotalBytes === '1h' ? 3600000 : 86400000,
            updateIntervalQueuedTime === '1s' ? 1000 : updateIntervalQueuedTime === '10s' ? 10000 : updateIntervalQueuedTime === '1m' ? 60000 : updateIntervalQueuedTime === '10m' ? 600000 : updateIntervalQueuedTime === '1h' ? 3600000 : 86400000,
            updateIntervalWallTime === '1s' ? 1000 : updateIntervalWallTime === '10s' ? 10000 : updateIntervalWallTime === '1m' ? 60000 : updateIntervalWallTime === '10m' ? 600000 : updateIntervalWallTime === '1h' ? 3600000 : 86400000,
        ];
        const minInterval = Math.min(...intervals);
        const interval = setInterval(fetchData, minInterval);
        
        return () => clearInterval(interval);
    }, [updateIntervalDuration, updateIntervalCpuTime, updateIntervalPeakMemory, updateIntervalTotalRows, updateIntervalCompletedSplits, updateIntervalTotalBytes, updateIntervalQueuedTime, updateIntervalWallTime]);
    
    // Define colors for each graph
    const graphColors = {
        duration: '#1f77b4',      // blue
        cpuTime: '#ff7f0e',        // orange
        peakMemory: '#2ca02c',     // green
        totalRows: '#d62728',      // red
        completedSplits: '#9467bd', // purple
        totalBytes: '#8c564b',      // brown
        queuedTime: '#e377c2',      // pink
        wallTime: '#7f7f7f'        // gray
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {/* Duration Graph */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Query Duration</h3>
                        <Graph 
                            data={durationData}
                            xLabel="Time"
                            yLabel="Duration (ms)"
                            width={640}
                            height={400}
                            listener="duration"
                            timestamps={timestamps}
                            timeInterval={1}
                            timeIntervalUnit="minute"
                            color={graphColors.duration}
                        />
                    </div>
                    {summaryDataDuration && (
                        <div style={{ minWidth: '300px' }}>
                            <Summary {...summaryDataDuration} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', marginTop: '0' }}>
                        <UpdateIntervalMenu updateInterval={updateIntervalDuration} onIntervalChange={setUpdateIntervalDuration} />
                    </div>
                </div>
                {/* CPU Time Graph */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>CPU Time</h3>
                        <Graph 
                            data={cpuTimeData}
                            xLabel="Time"
                            yLabel="CPU Time (ms)"
                            width={640}
                            height={400}
                            listener="cpuTime"
                            timestamps={timestamps}
                            timeInterval={1}
                            timeIntervalUnit="minute"
                            color={graphColors.cpuTime}
                        />
                    </div>
                    {summaryDataCpuTime && (
                        <div style={{ minWidth: '300px' }}>
                            <Summary {...summaryDataCpuTime} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', marginTop: '0' }}>
                        <UpdateIntervalMenu updateInterval={updateIntervalCpuTime} onIntervalChange={setUpdateIntervalCpuTime} />
                    </div>
                </div>
                {/* Peak Memory Graph */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Peak Memory</h3>
                        <Graph 
                            data={peakMemoryData}
                            xLabel="Time"
                            yLabel="Peak Memory (bytes)"
                            width={640}
                            height={400}
                            listener="peakMemory"
                            timestamps={timestamps}
                            timeInterval={1}
                            timeIntervalUnit="minute"
                            color={graphColors.peakMemory}
                        />
                    </div>
                    {summaryDataPeakMemory && (
                        <div style={{ minWidth: '300px' }}>
                            <Summary {...summaryDataPeakMemory} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', marginTop: '0' }}>
                        <UpdateIntervalMenu updateInterval={updateIntervalPeakMemory} onIntervalChange={setUpdateIntervalPeakMemory} />
                    </div>
                </div>
                {/* Total Rows Graph */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Total Rows</h3>
                        <Graph 
                            data={totalRowsData}
                            xLabel="Time"
                            yLabel="Total Rows"
                            width={640}
                            height={400}
                            listener="totalRows"
                            timestamps={timestamps}
                            timeInterval={1}
                            timeIntervalUnit="minute"
                            color={graphColors.totalRows}
                        />
                    </div>
                    {summaryDataTotalRows && (
                        <div style={{ minWidth: '300px' }}>
                            <Summary {...summaryDataTotalRows} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', marginTop: '0' }}>
                        <UpdateIntervalMenu updateInterval={updateIntervalTotalRows} onIntervalChange={setUpdateIntervalTotalRows} />
                    </div>
                </div>
                {/* Completed Splits Graph */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Completed Splits</h3>
                        <Graph 
                            data={completedSplitsData}
                            xLabel="Time"
                            yLabel="Completed Splits"
                            width={640}
                            height={400}
                            listener="completedSplits"
                            timestamps={timestamps}
                            timeInterval={1}
                            timeIntervalUnit="minute"
                            color={graphColors.completedSplits}
                        />
                    </div>
                    {summaryDataCompletedSplits && (
                        <div style={{ minWidth: '300px' }}>
                            <Summary {...summaryDataCompletedSplits} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', marginTop: '0' }}>
                        <UpdateIntervalMenu updateInterval={updateIntervalCompletedSplits} onIntervalChange={setUpdateIntervalCompletedSplits} />
                    </div>
                </div>
                {/* Total Bytes Graph */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Total Bytes</h3>
                        <Graph 
                            data={totalBytesData}
                            xLabel="Time"
                            yLabel="Total Bytes"
                            width={640}
                            height={400}
                            listener="totalBytes"
                            timestamps={timestamps}
                            timeInterval={1}
                            timeIntervalUnit="minute"
                            color={graphColors.totalBytes}
                        />
                    </div>
                    {summaryDataTotalBytes && (
                        <div style={{ minWidth: '300px' }}>
                            <Summary {...summaryDataTotalBytes} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', marginTop: '0' }}>
                        <UpdateIntervalMenu updateInterval={updateIntervalTotalBytes} onIntervalChange={setUpdateIntervalTotalBytes} />
                    </div>
                </div>
                {/* Queued Time Graph */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Queued Time</h3>
                        <Graph
                            data={queuedTimeData}
                            xLabel="Time"
                            yLabel="Queued Time (ms)"
                            width={640}
                            height={400}
                            listener="queuedTime"
                            timestamps={timestamps}
                            timeInterval={1}
                            timeIntervalUnit="minute"
                            color={graphColors.queuedTime}
                        />
                    </div>
                    {summaryDataQueuedTime && (
                        <div style={{ minWidth: '300px' }}>
                            <Summary {...summaryDataQueuedTime} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', marginTop: '0' }}>
                        <UpdateIntervalMenu updateInterval={updateIntervalQueuedTime} onIntervalChange={setUpdateIntervalQueuedTime} />
                    </div>
                </div>
                {/* Wall Time Graph */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Wall Time</h3>
                        <Graph
                            data={wallTimeData}
                            xLabel="Time"
                            yLabel="Wall Time (ms)"
                            width={640}
                            height={400}
                            listener="wallTime"
                            timestamps={timestamps}
                            timeInterval={1}
                            timeIntervalUnit="minute"
                            color={graphColors.wallTime}
                        />
                    </div>
                    {summaryDataWallTime && (
                        <div style={{ minWidth: '300px' }}>
                            <Summary {...summaryDataWallTime} />
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', height: 'fit-content', marginTop: '0' }}>
                        <UpdateIntervalMenu updateInterval={updateIntervalWallTime} onIntervalChange={setUpdateIntervalWallTime} />
                    </div>
                </div>
            </div>
        </div>
    );
}