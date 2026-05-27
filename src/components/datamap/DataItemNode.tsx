import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText, ArrowUpRight, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CLASS_COLORS: Record<string, string> = {
  public: '#0ea5e9',
  internal: '#8b5cf6',
  confidential: '#f59e0b',
  restricted: '#ef4444',
};

const SEVERITY_VARIANTS: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  critical: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export const DataItemNode = memo(function DataItemNode({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const meta = (d.metadata as Record<string, unknown>) || {};
  const classification = (meta.classification as string) || 'internal';
  const severity = (meta.severity as string) || 'low';
  const importance = (meta.importance as string) || 'medium';
  const group = (meta.group as string) || '';
  const dataType = (meta.dataType as string) || '';
  const color = CLASS_COLORS[classification] || (d.color as string) || '#8b5cf6';
  const hasExternalSource = !!(meta.sourceDepartmentId || meta.sourceProcessId);
  const hasLinkedAsset = !!meta.dataAssetId;

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
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{d.label as string}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0" style={{ color, backgroundColor: `${color}15` }}>
                {classification}
              </Badge>
              <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0 border-0', SEVERITY_VARIANTS[severity])}>
                {severity}
              </Badge>
              {hasLinkedAsset && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 border-0 bg-blue-500/10 text-blue-700">
                  <Link2 className="h-2.5 w-2.5 mr-0.5" />
                  Inventory-linked
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            {group && <span>Group: {group}</span>}
            {dataType && <span>{dataType}</span>}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Importance: {importance}</span>
            {hasExternalSource && (
              <span className="flex items-center gap-0.5 text-primary">
                <ArrowUpRight className="h-3 w-3" />
                External source
              </span>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !border-2 !border-background" style={{ background: color }} />
    </>
  );
});
