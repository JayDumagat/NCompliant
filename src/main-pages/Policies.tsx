import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db/db';
import { Badge } from '@/src/components/ui/badge';
import { PolicyWizard } from '@/src/components/policies/PolicyWizard';
import { Link } from '@/src/lib/router';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import { Search, ArrowUpRight } from 'lucide-react';

const SL: Record<string, string> = { draft: 'Draft', active: 'Active', under_review: 'Review', archived: 'Archived' };

export default function Policies() {
  const policies = useLiveQuery(() => db.policies.toArray(), []);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const rows = policies
    ?.filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => p.title.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()));

  const counts = {
    all: policies?.length ?? 0,
    active: policies?.filter(p => p.status === 'active').length ?? 0,
    draft: policies?.filter(p => p.status === 'draft').length ?? 0,
    under_review: policies?.filter(p => p.status === 'under_review').length ?? 0,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Policies</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage compliance policies and documents.</p>
        </div>
        <PolicyWizard />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden">
        {[
          { label: 'Active', value: counts.active },
          { label: 'Draft', value: counts.draft },
          { label: 'Review', value: counts.under_review },
        ].map(s => (
          <div key={s.label} className="bg-card p-3 sm:p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search policies..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({counts.all})</SelectItem>
            <SelectItem value="active">Active ({counts.active})</SelectItem>
            <SelectItem value="draft">Draft ({counts.draft})</SelectItem>
            <SelectItem value="under_review">Review ({counts.under_review})</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Policy list */}
      <div>
        {rows?.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">No policies found.</p>
        ) : (
          <div className="space-y-0">
            {rows?.map((p) => (
              <Link
                key={p.id}
                to={`/policies/${p.id}`}
                className="flex items-center justify-between py-3 px-1 border-b last:border-0 hover:bg-accent/30 transition-colors rounded-sm group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm group-hover:text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.category} · {p.owner} · {new Date(p.lastUpdated).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">{SL[p.status]}</Badge>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
