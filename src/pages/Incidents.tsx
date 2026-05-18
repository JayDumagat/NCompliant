import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Incident } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = { data_breach: 'Data Breach', security: 'Security', compliance_violation: 'Compliance', operational: 'Operational', other: 'Other' };
const STATUS_LABEL: Record<string, string> = { open: 'Open', investigating: 'Investigating', resolved: 'Resolved', closed: 'Closed' };

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

function IncidentDialog({ incident, trigger, onDone }: { incident?: Incident; trigger: React.ReactNode; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', description: '', type: 'other' as Incident['type'], severity: 'medium' as Incident['severity'], status: 'open' as Incident['status'], reportedBy: '', findings: '', mitigationSteps: '', isRecurring: false });

  const handleOpen = (v: boolean) => {
    if (v && incident) setF({ title: incident.title, description: incident.description, type: incident.type, severity: incident.severity, status: incident.status, reportedBy: incident.reportedBy, findings: incident.findings, mitigationSteps: incident.mitigationSteps, isRecurring: incident.isRecurring });
    else if (v) setF({ title: '', description: '', type: 'other', severity: 'medium', status: 'open', reportedBy: '', findings: '', mitigationSteps: '', isRecurring: false });
    setOpen(v);
  };

  const save = async () => {
    const data = { ...f, resolvedDate: (f.status === 'resolved' || f.status === 'closed') ? Date.now() : undefined, linkedPolicies: incident?.linkedPolicies ?? [], linkedAssessments: incident?.linkedAssessments ?? [], linkedTasks: incident?.linkedTasks ?? [] };
    if (incident) { await db.incidents.update(incident.id, data); toast.success('Incident updated'); }
    else { await db.incidents.add({ id: crypto.randomUUID(), workspaceId: 'ws-default', reportedDate: Date.now(), createdAt: Date.now(), ...data }); toast.success('Incident logged'); }
    setOpen(false); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{incident ? 'Edit Incident' : 'Log Incident'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Title</Label><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Incident title" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea className="min-h-[80px]" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Type</Label>
              <Select value={f.type} onValueChange={v => setF({ ...f, type: v as Incident['type'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Severity</Label>
              <Select value={f.severity} onValueChange={v => setF({ ...f, severity: v as Incident['severity'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={f.status} onValueChange={v => setF({ ...f, status: v as Incident['status'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="investigating">Investigating</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Reported By</Label><Input value={f.reportedBy} onChange={e => setF({ ...f, reportedBy: e.target.value })} placeholder="Name or team" /></div>
          <div className="space-y-2"><Label>Findings</Label><Textarea className="min-h-[60px]" value={f.findings} onChange={e => setF({ ...f, findings: e.target.value })} placeholder="Investigation findings..." /></div>
          <div className="space-y-2"><Label>Mitigation Steps</Label><Textarea className="min-h-[60px]" value={f.mitigationSteps} onChange={e => setF({ ...f, mitigationSteps: e.target.value })} placeholder="Steps taken to mitigate..." /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!f.title}>{incident ? 'Save' : 'Log Incident'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IncidentCard({ inc }: { inc: Incident }) {
  const [expanded, setExpanded] = useState(false);
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(inc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `incident-${inc.title.toLowerCase().replace(/\s+/g, '-')}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success('Exported');
  };
  const del = async () => { await db.incidents.delete(inc.id); toast.success('Incident deleted'); };

  return (
    <Card className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className={cn('h-4 w-4 mt-0.5 shrink-0', inc.severity === 'critical' ? 'text-red-500' : inc.severity === 'high' ? 'text-orange-500' : 'text-muted-foreground')} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-medium">{inc.title}</p>
              {inc.isRecurring && <RefreshCw className="h-3 w-3 text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{TYPE_LABEL[inc.type]} · {inc.reportedBy} · {new Date(inc.reportedDate).toLocaleDateString()}</p>
            {!expanded && <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">{inc.description}</p>}
            <div className="flex items-center gap-1.5 mt-2">
              <Badge variant={inc.severity === 'critical' || inc.severity === 'high' ? 'destructive' : 'default'} className="text-[10px]">{inc.severity}</Badge>
              <Badge variant={inc.status === 'open' ? 'destructive' : inc.status === 'investigating' ? 'default' : 'secondary'} className="text-[10px]">{STATUS_LABEL[inc.status]}</Badge>
            </div>
          </div>
        </div>
        {expanded && (
          <div className="space-y-3 pl-0 sm:pl-12" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-muted-foreground leading-relaxed">{inc.description}</p>
            {inc.findings && <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Findings</p><p className="text-sm leading-relaxed">{inc.findings}</p></div>}
            {inc.mitigationSteps && <div><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mitigation</p><p className="text-sm leading-relaxed">{inc.mitigationSteps}</p></div>}
            {inc.resolvedDate && <p className="text-xs text-muted-foreground">Resolved: {new Date(inc.resolvedDate).toLocaleDateString()}</p>}
            <div className="flex gap-1 pt-1 flex-wrap">
              <IncidentDialog incident={inc} trigger={<Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs"><Pencil className="h-3 w-3" />Edit</Button>} onDone={() => {}} />
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={exportJSON}><Download className="h-3 w-3" />Export</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5 h-8 text-xs" onClick={del}><Trash2 className="h-3 w-3" />Delete</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Incidents() {
  const incidents = useLiveQuery(() => db.incidents.toArray(), []);
  const [filter, setFilter] = useState('all');
  const byStatus = (s: string) => s === 'all' ? incidents ?? [] : incidents?.filter(i => i.status === s) ?? [];
  const filtered = byStatus(filter);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Risk & Incident Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Track incidents, investigations, and mitigation steps.</p>
        </div>
        <IncidentDialog trigger={<Button className="gap-2 shrink-0"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Log Incident</span></Button>} onDone={() => {}} />
      </div>

      {/* Status summary — flat design */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: 'Open', count: byStatus('open').length, dot: 'bg-red-500' },
          { label: 'Investigating', count: byStatus('investigating').length, dot: 'bg-amber-500' },
          { label: 'Resolved', count: byStatus('resolved').length, dot: 'bg-emerald-500' },
          { label: 'Closed', count: byStatus('closed').length, dot: 'bg-gray-400' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('h-2 w-2 rounded-full', s.dot)} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums">{s.count}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Scrollable filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {FILTER_TABS.map(tab => {
          const count = byStatus(tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0',
                filter === tab.value ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border hover:bg-accent'
              )}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length === 0
          ? <Card><CardContent className="py-12 text-center text-muted-foreground">No incidents found.</CardContent></Card>
          : filtered.sort((a, b) => b.reportedDate - a.reportedDate).map(inc => <IncidentCard key={inc.id} inc={inc} />)
        }
      </div>
    </div>
  );
}
