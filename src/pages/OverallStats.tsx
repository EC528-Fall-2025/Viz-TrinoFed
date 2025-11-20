import Graph from '../components/Graph';
// 
/**
 * This page will display the overall stats of the query.
 * Should get and update timestamped metrics at the minute level.
 * Choose rerender interval based on user preference.
 * Bytes, Duration, CPU Time, Wall Time, Queued Time, Peak Memory, 
 * Total Rows, Total Bytes, Completed Splits, Tokens Used
 */
export default function OverallStats() {
    return (
        <div>
            <Graph />
            <Graph />
            <Graph />
            <Graph />
        </div>
    );
}