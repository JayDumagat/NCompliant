import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';

export function DataFlowEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const d = (data || {}) as Record<string, unknown>;
  const label = (d.label as string) || '';
  const dataTypes = (d.dataTypes as string[]) || [];
  const animated = d.animated as boolean;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : 1.5,
          stroke: selected ? 'var(--primary)' : 'var(--muted-foreground)',
          opacity: selected ? 1 : 0.5,
          strokeDasharray: animated ? '6 3' : undefined,
        }}
        markerEnd={markerEnd}
        className={animated ? 'react-flow__edge-animated' : ''}
      />
      {(label || dataTypes.length > 0) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <div className="rounded-lg border bg-card/95 backdrop-blur-sm px-2.5 py-1.5 shadow-sm max-w-[200px] text-center">
              {label && <p className="text-[10px] font-medium truncate">{label}</p>}
              {dataTypes.length > 0 && (
                <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                  {dataTypes.slice(0, 3).map(t => (
                    <Badge key={t} variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-normal">{t}</Badge>
                  ))}
                  {dataTypes.length > 3 && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-normal">+{dataTypes.length - 3}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
