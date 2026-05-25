import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2, ExternalLink, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OrgNode = memo(function OrgNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const isExternal = !!(d.metadata as Record<string, unknown>)?.external;
  const color = (d.color as string) || '#3b82f6';
  const childCount = (d.childCount as number) || 0;
  const industry = ((d.metadata as Record<string, unknown>)?.industry as string) || '';

  return (
    <>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !border-2 !border-background" style={{ background: color }} />
      <div
        className={cn(
          'rounded-xl border-2 bg-card px-4 py-3 min-w-[180px] max-w-[240px] shadow-md transition-all cursor-pointer',
          'hover:shadow-lg hover:-translate-y-0.5',
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        style={{ borderColor: color }}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20`, color }}>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{d.label as string}</p>
              {isExternal && <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </div>
            {industry && <p className="text-[10px] text-muted-foreground mt-0.5">{industry}</p>}
            {(d.description as string) && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{d.description as string}</p>}
          </div>
        </div>
        {childCount > 0 && (
          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t text-[10px] text-muted-foreground">
            <ChevronRight className="h-3 w-3" />
            <span>{childCount} department{childCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !border-2 !border-background" style={{ background: color }} />
    </>
  );
});
