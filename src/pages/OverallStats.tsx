import Graph from '../components/Graph';
import { GraphData } from '../components/Graph';
import { apiService } from '../services/api.service';
import { useEffect, useState } from 'react';

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
    
    useEffect(() => {
        const fetchData = async () => {
            const queries = await apiService.getAllQueries();
            
            // Transform QueryTree[] into GraphData[] for each metric
            const duration: GraphData[] = [];
            const cpuTime: GraphData[] = [];
            const peakMemory: GraphData[] = [];
            const totalRows: GraphData[] = [];
            const ts: Date[] = [];
            
            // Use a Map to ensure one data point per timestamp (latest query wins if duplicates)
            const durationMap = new Map<number, number>();
            const cpuTimeMap = new Map<number, number>();
            const peakMemoryMap = new Map<number, number>();
            const totalRowsMap = new Map<number, number>();
            const timestampSet = new Set<number>();
            
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
                ts.push(new Date(timestampMs));
            });
            
            setDurationData(duration);
            setCpuTimeData(cpuTime);
            setPeakMemoryData(peakMemory);
            setTotalRowsData(totalRows);
            setTimestamps(ts);
        };
        
        // Load immediately
        fetchData();
        
        // Auto-refresh every 5 seconds to pick up new queries
        const interval = setInterval(fetchData, 5000);
        
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div>
            <Graph 
                data={durationData}
                xLabel="Time"
                yLabel="Duration (ms)"
                width={640}
                height={400}
                listener="duration"
                title="Query Duration Over Time"
                timestamps={timestamps}
                timeInterval={1}
                timeIntervalUnit="minute"
            />
            <Graph 
                data={cpuTimeData}
                xLabel="Time"
                yLabel="CPU Time (ms)"
                width={640}
                height={400}
                listener="cpuTime"
                title="CPU Time Over Time"
                timestamps={timestamps}
                timeInterval={1}
                timeIntervalUnit="minute"
            />
            <Graph 
                data={peakMemoryData}
                xLabel="Time"
                yLabel="Peak Memory (bytes)"
                width={640}
                height={400}
                listener="peakMemory"
                title="Peak Memory Over Time"
                timestamps={timestamps}
                timeInterval={1}
                timeIntervalUnit="minute"
            />
            <Graph 
                data={totalRowsData}
                xLabel="Time"
                yLabel="Total Rows"
                width={640}
                height={400}
                listener="totalRows"
                title="Total Rows Over Time"
                timestamps={timestamps}
                timeInterval={1}
                timeIntervalUnit="minute"
            />
        </div>
    );
}