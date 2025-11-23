import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

/* Props: xLabel, yLabel, data (x, y), width, height, listener, title,
timestamps, time interval
*/
export type GraphData = {
    x: number;
    y: number;
}

export interface GraphProps {
    data: GraphData[];
    xLabel: string;
    yLabel: string;
    width: number;
    height: number;
    listener: string;
    title: string;
    timestamps: Date[];
    timeInterval: number;
    timeIntervalUnit: 'minute' | 'hour' | 'day' | 'second' | 'millisecond';
}

export default function Graph({ data, xLabel, yLabel, width, height, title, timestamps, timeInterval, timeIntervalUnit }: GraphProps) {
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;
    const svgRef = useRef<SVGSVGElement>(null);
    if (!timeInterval || !timeIntervalUnit) {
        timeInterval = 1000;
        timeIntervalUnit = 'second';
    } else if (timeIntervalUnit === 'minute') {
        timeInterval = timeInterval * 60 * 1000;
    } else if (timeIntervalUnit === 'hour') {
        timeInterval = timeInterval * 60 * 60 * 1000;
    } else if (timeIntervalUnit === 'day') {
        timeInterval = timeInterval * 24 * 60 * 60 * 1000;
    } else if (timeIntervalUnit === 'millisecond') {
        // Already in milliseconds, no conversion needed
    } else {
        throw new Error(`Invalid time interval unit: ${timeIntervalUnit}`);
    }
    useEffect(() => {
        if (!svgRef.current) return;
        
        // Handle empty data case
        if (!data || data.length === 0 || !timestamps || timestamps.length === 0) {
            d3.select(svgRef.current).selectAll("*").remove();
            const svg = d3.select(svgRef.current)
                .attr("width", width)
                .attr("height", height);
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .style("text-anchor", "middle")
                .style("font-size", "14px")
                .style("fill", "#666")
                .text("No data available");
            return;
        }
        
        // Calculate scales based on current data
        const extent = d3.extent(timestamps);
        const xScale = d3.scaleUtc()
            .domain(extent[0] && extent[1] ? [extent[0], extent[1]] : [new Date(), new Date()])
            .range([marginLeft, width - marginRight]);
        const yMax = d3.max(data, (d) => d.y) ?? 100;
        // Add 10% padding to y-axis for better visualization
        const yScale = d3.scaleLinear()
            .domain([0, yMax > 0 ? yMax * 1.1 : 100])
            .range([height - marginBottom, marginTop]);
        
        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();
      
        // Create the SVG container.
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);
      
        // Add the x-axis.
        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(xScale));
      
        // Add the y-axis.
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(yScale));
        
        // Add axis labels
        svg.append("text")
            .attr("transform", `translate(${width / 2}, ${height - 5})`)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text(xLabel);
        
        svg.append("text")
            .attr("transform", `rotate(-90) translate(${-height / 2}, ${marginLeft - 25})`)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text(yLabel);
        
        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 15)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(title);
        // Convert GraphData x (number) to Date for the scale
        const line = d3.line<GraphData>()
            .x((d) => xScale(new Date(d.x)))
            .y((d) => yScale(d.y));
        
        // Only draw line if we have data
        if (data.length > 0) {
            svg.append("path")
                .attr("d", line(data))
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2);
        
        }
    }, [data, timestamps, width, height, xLabel, yLabel, title]);

    return <svg ref={svgRef} />;
}