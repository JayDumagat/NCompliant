import { ChevronRight, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  id: string | null;
  label: string;
  level: 'organization' | 'department' | 'process' | 'data_item';
}

interface MapBreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}

const LEVEL_LABELS: Record<string, string> = {
  organization: 'Organizations',
  department: 'Departments',
  process: 'Processes',
  data_item: 'Data Items',
};

export function MapBreadcrumb({ path, onNavigate }: MapBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto no-scrollbar">
      <button
        type="button"
        onClick={() => onNavigate(0)}
        aria-label={`Go to ${LEVEL_LABELS[path[0]?.level] || 'Data Map'}`}
        className={cn(
          'flex items-center gap-1.5 shrink-0 rounded-md px-2 py-1 transition-colors',
          path.length === 1
            ? 'text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Map className="h-3.5 w-3.5" />
        <span className="text-xs">{LEVEL_LABELS[path[0]?.level] || 'Data Map'}</span>
      </button>

      {path.slice(1).map((item, i) => (
        <div key={item.id ?? i} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <button
            type="button"
            onClick={() => onNavigate(i + 1)}
            aria-label={`Go to ${item.label}`}
            className={cn(
              'rounded-md px-2 py-1 transition-colors text-xs',
              i + 1 === path.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        </div>
      ))}
    </nav>
  );
}
