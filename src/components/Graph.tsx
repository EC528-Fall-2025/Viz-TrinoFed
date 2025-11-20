import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { QueryTree, QueryEvent } from '../types/api.types';
import { Database, DatabaseCollection } from '../types/database.types';

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
    timeIntervalUnit: 'minute' | 'hour' | 'day' | 'second';
}

export function getTotalExecutionTime(query: QueryTree): number {
    return query.totalExecutionTime ?? 0;
}

export function getQueryTree(query: QueryTree): QueryTree {
    return query;
}

export default function Graph({ data, xLabel, yLabel, width, height, listener, title, timestamps, timeInterval, timeIntervalUnit }: GraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;
        // Declare the chart dimensions and margins.
        const graphWidth = width;
        const graphHeight = height;
        const marginTop = 20;
        const marginRight = 20;
        const marginBottom = 30;
        const marginLeft = 40;

        const dispatch = d3.dispatch('update');
      
        // Declare the x (horizontal position) scale.
        const x = d3.scaleUtc()
            .domain([new Date("2023-01-01"), new Date("2024-01-01")])
            .range([marginLeft, width - marginRight]);
      
        // Declare the y (vertical position) scale.
        const y = d3.scaleLinear()
            .domain([0, 100])
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
            .call(d3.axisBottom(x));
      
        // Add the y-axis.
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y));
    }, []);

    return <svg ref={svgRef} />;
}