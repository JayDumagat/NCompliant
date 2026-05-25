import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Download, Cpu, Database, ArrowLeftRight, Trash2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PROCESS_ICONS: Record<string, typeof Cpu> = {
  collection: Download,
  processing: Cpu,
  storage: Database,
  transfer: ArrowLeftRight,
  deletion: Trash2,
};

const PROCESS_COLORS: Record<string, string> = {
  collection: '#3b82f6',
  processing: '#10b981',
  storage: '#f59e0b',
  transfer: '#8b5cf6',
  deletion: '#ef4444',
};

export const ProcessNode = memo(function ProcessNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const meta = (d.metadata as Record<string, unknown>) || {};
  const processType = (meta.processType as string) || 'processing';
  const color = PROCESS_COLORS[processType] || (d.color as string) || '#10b981';
  const Icon = PROCESS_ICONS[processType] || Cpu;
  const childCount = (d.childCount as number) || 0;

  return (
    <>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !border-2 !border-background" style={{ background: color }} />
      <div
        className={cn(
          'rounded-xl border-2 bg-card px-4 py-3 min-w-[170px] max-w-[230px] shadow-md transition-all cursor-pointer',
          'hover:shadow-lg hover:-translate-y-0.5',
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        style={{ borderColor: color }}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20`, color }}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{d.label as string}</p>
            <Badge variant="secondary" className="text-[9px] mt-1 px-1.5 py-0" style={{ color, backgroundColor: `${color}15` }}>
              {processType}
            </Badge>
            {(d.description as string) && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{d.description as string}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t text-[10px] text-muted-foreground">
          {meta.legalBasis && <span>{meta.legalBasis as string}</span>}
          {meta.automated && <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/30 text-emerald-600">Auto</Badge>}
          {childCount > 0 && (
            <div className="flex items-center gap-0.5 ml-auto">
              <ChevronRight className="h-3 w-3" />
              <span>{childCount} item{childCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !border-2 !border-background" style={{ background: color }} />
    </>
  );
});
