import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Incident } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Download, AlertTriangle, RefreshCw, LayoutTemplate, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DataAssetPicker } from '@/components/DataAssetPicker';
import { useDataAssets } from '@/hooks/useDataAssets';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const INCIDENT_STEPS = ['Basics', 'Linked Records', 'Review'];

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
  const [step, setStep] = useState(0);
  const policies = useLiveQuery(() => db.policies.toArray(), []) ?? [];
  const assessments = useLiveQuery(() => db.assessments.toArray(), []) ?? [];
  const [f, setF] = useState({ title: '', description: '', type: 'other' as Incident['type'], severity: 'medium' as Incident['severity'], status: 'open' as Incident['status'], reportedBy: '', findings: '', mitigationSteps: '', isRecurring: false, linkedPolicies: [] as string[], linkedAssessments: [] as string[], affectedDataAssetIds: [] as string[] });

  const handleOpen = (v: boolean) => {
    if (v && incident) setF({ title: incident.title, description: incident.description, type: incident.type, severity: incident.severity, status: incident.status, reportedBy: incident.reportedBy, findings: incident.findings, mitigationSteps: incident.mitigationSteps, isRecurring: incident.isRecurring, linkedPolicies: incident.linkedPolicies ?? [], linkedAssessments: incident.linkedAssessments ?? [], affectedDataAssetIds: incident.affectedDataAssetIds ?? [] });
    else if (v) setF({ title: '', description: '', type: 'other', severity: 'medium', status: 'open', reportedBy: '', findings: '', mitigationSteps: '', isRecurring: false, linkedPolicies: [], linkedAssessments: [], affectedDataAssetIds: [] });
    if (v) setStep(0);
    setOpen(v);
  };

  const save = async () => {
    const data = { ...f, resolvedDate: (f.status === 'resolved' || f.status === 'closed') ? Date.now() : undefined, linkedTasks: incident?.linkedTasks ?? [] };
    if (incident) { await db.incidents.update(incident.id, data); toast.success('Incident updated'); }
    else { await db.incidents.add({ id: crypto.randomUUID(), workspaceId: 'ws-default', reportedDate: Date.now(), createdAt: Date.now(), ...data }); toast.success('Incident logged'); }
    setOpen(false); setStep(0); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[min(100vw-1rem,1440px)] max-w-none h-[calc(100vh-1rem)] overflow-hidden p-0 sm:rounded-2xl">
        <div className="grid h-full min-h-0 lg:grid-cols-[300px_1fr]">
          <aside className="hidden min-h-0 flex-col border-r border-border/40 bg-background p-6 lg:flex">
            <div className="space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">{incident ? 'Edit Incident' : 'Log Incident'}</p>
                <p className="text-sm text-muted-foreground">Use a step-by-step review flow to capture the incident clearly.</p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              {INCIDENT_STEPS.map((label, index) => {
                const active = index === step;
                const complete = index < step;
                return (
                  <button key={label} onClick={() => complete && setStep(index)} className={cn('flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors', active ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent/20', !complete && 'opacity-75')}>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium', complete ? 'bg-emerald-500 text-white' : active ? 'border border-primary/30 bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                      {complete ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{index === 0 ? 'Core incident details' : index === 1 ? 'Dependencies and links' : 'Final review'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4 lg:px-8">
              <div>
                <p className="text-sm text-muted-foreground">Incident Builder</p>
                <h2 className="text-lg font-semibold tracking-tight">Step {step + 1} of {INCIDENT_STEPS.length}</h2>
              </div>
              <div />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
              <div className="w-full space-y-6">
                <div className="space-y-6">
                  {step === 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="incident-title">Title</Label><Input id="incident-title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Incident title" /></div>
                      <div className="space-y-2"><Label htmlFor="incident-description">Description</Label><Textarea id="incident-description" className="min-h-[120px]" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2"><Label htmlFor="incident-type">Type</Label>
                          <Select value={f.type} onValueChange={v => setF({ ...f, type: v as Incident['type'] })}><SelectTrigger id="incident-type"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="incident-severity">Severity</Label>
                          <Select value={f.severity} onValueChange={v => setF({ ...f, severity: v as Incident['severity'] })}><SelectTrigger id="incident-severity"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="incident-status">Status</Label>
                          <Select value={f.status} onValueChange={v => setF({ ...f, status: v as Incident['status'] })}><SelectTrigger id="incident-status"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="investigating">Investigating</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="incident-reportedBy">Reported By</Label><Input id="incident-reportedBy" value={f.reportedBy} onChange={e => setF({ ...f, reportedBy: e.target.value })} placeholder="Name or team" /></div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <DataAssetPicker label="Affected Data" value={f.affectedDataAssetIds} onChange={(affectedDataAssetIds) => setF({ ...f, affectedDataAssetIds })} />
                      <div className="space-y-2">
                        <Label>Linked Policies</Label>
                        <div className="max-h-40 overflow-y-auto rounded-2xl border p-3 space-y-1.5">
                          {policies.map((policy) => (
                            <label key={policy.id} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={f.linkedPolicies.includes(policy.id)} onCheckedChange={(v) => setF((prev) => ({ ...prev, linkedPolicies: v === true ? [...prev.linkedPolicies, policy.id] : prev.linkedPolicies.filter((id) => id !== policy.id) }))} />
                              <span>{policy.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Linked Assessments</Label>
                        <div className="max-h-40 overflow-y-auto rounded-2xl border p-3 space-y-1.5">
                          {assessments.map((assessment) => (
                            <label key={assessment.id} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={f.linkedAssessments.includes(assessment.id)} onCheckedChange={(v) => setF((prev) => ({ ...prev, linkedAssessments: v === true ? [...prev.linkedAssessments, assessment.id] : prev.linkedAssessments.filter((id) => id !== assessment.id) }))} />
                              <span>{assessment.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="incident-findings">Findings</Label><Textarea id="incident-findings" className="min-h-[100px]" value={f.findings} onChange={e => setF({ ...f, findings: e.target.value })} placeholder="Investigation findings..." /></div>
                      <div className="space-y-2"><Label htmlFor="incident-mitigationSteps">Mitigation Steps</Label><Textarea id="incident-mitigationSteps" className="min-h-[100px]" value={f.mitigationSteps} onChange={e => setF({ ...f, mitigationSteps: e.target.value })} placeholder="Steps taken to mitigate..." /></div>
                      <div className="border-l border-border/40 pl-4 space-y-3">
                        {[
                          { label: 'Title', value: f.title || '—' },
                          { label: 'Type', value: TYPE_LABEL[f.type] },
                          { label: 'Severity', value: f.severity },
                          { label: 'Status', value: f.status },
                          { label: 'Linked Policies', value: `${f.linkedPolicies.length}` },
                          { label: 'Linked Assessments', value: `${f.linkedAssessments.length}` },
                        ].map((row, index) => (
                          <div key={row.label}>
                            {index > 0 && <Separator className="mb-3" />}
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-sm text-muted-foreground">{row.label}</span>
                              <span className="max-w-[320px] truncate text-right text-sm font-medium">{row.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}><ChevronLeft className="h-4 w-4" />Back</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    {step === 2
                      ? <Button onClick={save} disabled={!f.title}>{incident ? 'Save' : 'Log Incident'}</Button>
                      : <Button onClick={() => setStep((s) => Math.min(s + 1, INCIDENT_STEPS.length - 1))} disabled={step === 0 ? !f.title : false}>Continue</Button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IncidentCard({ inc }: { inc: Incident }) {
  const [expanded, setExpanded] = useState(false);
  const { resolveIds } = useDataAssets();
  const linkedAssets = resolveIds(inc.affectedDataAssetIds ?? []);
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(inc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `incident-${inc.title.toLowerCase().replace(/\s+/g, '-')}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success('Exported');
  };
  const del = async () => { await db.incidents.delete(inc.id); toast.success('Incident deleted'); };

  return (
    <Card className="cursor-pointer" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } }}>
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
              {linkedAssets.map((asset) => <Badge key={asset.id} variant="secondary" className="text-[10px]">{asset.name}</Badge>)}
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
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={exportJSON} aria-label={`Export incident ${inc.title}`}><Download className="h-3 w-3" />Export</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5 h-8 text-xs" onClick={del} aria-label={`Delete incident ${inc.title}`}><Trash2 className="h-3 w-3" />Delete</Button>
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
