import type { ReactNode } from 'react';
import { Sparkles, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon: Icon = Sparkles, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/15 px-6 py-10 text-center', className)}>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 max-w-md space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}