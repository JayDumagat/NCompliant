import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Info, AlertCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const SEV = {
  critical: { icon: AlertTriangle, label: 'Critical', variant: 'destructive' as const },
  warning: { icon: AlertCircle, label: 'Warning', variant: 'default' as const },
  info: { icon: Info, label: 'Info', variant: 'secondary' as const },
};

export default function Updates() {
  const updates = useLiveQuery(() => db.updates.orderBy('date').reverse().toArray(), []);
  const policies = useLiveQuery(() => db.policies.toArray(), []);
  const name = (id: string) => policies?.find((p) => p.id === id)?.title ?? id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Regulatory Updates</h1>
        <p className="text-sm text-muted-foreground mt-1">Latest regulatory changes and their impact on your policies.</p>
      </div>

      <div className="space-y-4">
        {updates?.map((u) => {
          const { icon: Icon, label, variant } = SEV[u.severity];
          return (
            <Card key={u.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0',
                        u.severity === 'critical' ? 'text-red-500' : u.severity === 'warning' ? 'text-amber-500' : 'text-muted-foreground'
                      )} />
                      <div>
                        <p className="text-sm font-medium leading-snug">{u.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{u.agency} · {new Date(u.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={variant} className="shrink-0 text-[10px]">{label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{u.description}</p>

                  {u.affectedPolicies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {u.affectedPolicies.map((id) => (
                        <Link key={id} to={`/policies/${id}`}>
                          <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-accent text-[10px]">
                            {name(id)}<ExternalLink className="h-2.5 w-2.5" />
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}

                  {u.actions.length > 0 && (
                    <ul className="space-y-1.5">
                      {u.actions.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-foreground/30 shrink-0 mt-2" />{a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
