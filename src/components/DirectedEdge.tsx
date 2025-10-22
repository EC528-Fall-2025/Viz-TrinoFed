// DirectedEdge.tsx
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

function pointsToPath(points: { x: number; y: number }[]): string {
  if (!points.length) return '';
  const [start, ...rest] = points;
  return `M ${start.x},${start.y} ` + points.slice(1).map((p) => `L ${p.x},${p.y}`).join(' ');
}

export default function DirectedEdge(props: EdgeProps) {
  const { id, label, markerEnd, style, data } = props;

  const bendPoints = (data as any)?.points as { x:number;y:number }[] | undefined;

  if (bendPoints && bendPoints.length > 1) {
    const path = pointsToPath(bendPoints);
    return (
      <>
        <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${bendPoints[Math.floor(bendPoints.length / 2)].x}px, ${bendPoints[Math.floor(bendPoints.length / 2)].y}px)`,
                background: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 12,
                pointerEvents: 'all',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }

  // fallback: simple bezier
  const [edgePath, labelX, labelY] = getBezierPath(props);
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'white',
              border: '1px solid #e5e5e5',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 12,
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
