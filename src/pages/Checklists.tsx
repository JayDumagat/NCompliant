import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Checklist } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, X, Download, ChevronDown, ChevronUp, LayoutTemplate, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const CHECKLIST_STEPS = ['Basics', 'Items', 'Review'];

const TYPE_LABEL: Record<string, string> = { audit: 'Audit', incident: 'Incident', training: 'Training', policy_adherence: 'Policy', custom: 'Custom' };
const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'audit', label: 'Audit' },
  { value: 'training', label: 'Training' },
  { value: 'incident', label: 'Incident' },
  { value: 'policy_adherence', label: 'Policy' },
];

function NewChecklistDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const policies = useLiveQuery(() => db.policies.toArray(), []);
  const [f, setF] = useState({ title: '', type: 'custom' as Checklist['type'], linkedPolicyId: '', items: [] as string[] });
  const [newItem, setNewItem] = useState('');

  const addItem = () => { if (newItem.trim()) { setF({ ...f, items: [...f.items, newItem.trim()] }); setNewItem(''); } };
  const removeItem = (i: number) => setF({ ...f, items: f.items.filter((_, idx) => idx !== i) });

  const save = async () => {
    await db.checklists.add({
      id: crypto.randomUUID(), workspaceId: 'ws-default', title: f.title, type: f.type,
      linkedPolicyId: f.linkedPolicyId || undefined, status: 'not_started', createdAt: Date.now(),
      items: f.items.map(text => ({ id: crypto.randomUUID(), text, completed: false })),
    });
    toast.success('Checklist created');
    setOpen(false); setStep(0); setF({ title: '', type: 'custom', linkedPolicyId: '', items: [] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2 shrink-0"><Plus className="h-4 w-4" /><span className="hidden sm:inline">New Checklist</span></Button></DialogTrigger>
      <DialogContent className="w-[min(100vw-1rem,1440px)] max-w-none h-[calc(100vh-1rem)] overflow-hidden p-0 sm:rounded-2xl">
        <div className="grid h-full min-h-0 lg:grid-cols-[300px_1fr]">
          <aside className="hidden min-h-0 flex-col border-r border-border/40 bg-background p-6 lg:flex">
            <div className="space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">New Checklist</p>
                <p className="text-sm text-muted-foreground">Build a reusable checklist with a clear step-by-step flow.</p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              {CHECKLIST_STEPS.map((label, index) => {
                const active = index === step;
                const complete = index < step;
                return (
                  <button key={label} onClick={() => complete && setStep(index)} className={cn('flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors', active ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent/20', !complete && 'opacity-75')}>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium', complete ? 'bg-emerald-500 text-white' : active ? 'border border-primary/30 bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                      {complete ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{index === 0 ? 'Checklist setup' : index === 1 ? 'Checklist items' : 'Summary and create'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4 lg:px-8">
              <div>
                <p className="text-sm text-muted-foreground">Checklist Builder</p>
                <h2 className="text-lg font-semibold tracking-tight">Step {step + 1} of {CHECKLIST_STEPS.length}</h2>
              </div>
              <div />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
              <div className="w-full space-y-6">
                <div className="space-y-6">
                  {step === 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="checklist-title">Title</Label><Input id="checklist-title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Checklist name" /></div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="checklist-type">Type</Label>
                          <Select value={f.type} onValueChange={v => setF({ ...f, type: v as Checklist['type'] })}><SelectTrigger id="checklist-type"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="checklist-linkedPolicy">Linked Policy</Label>
                          <Select value={f.linkedPolicyId || '__none__'} onValueChange={v => setF({ ...f, linkedPolicyId: v === '__none__' ? '' : v })}><SelectTrigger id="checklist-linkedPolicy"><SelectValue placeholder="None" /></SelectTrigger>
                            <SelectContent><SelectItem value="__none__">None</SelectItem>{policies?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Items ({f.items.length})</Label>
                        <div className="space-y-1.5 max-h-[240px] overflow-y-auto rounded-2xl border p-3">
                          {f.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 rounded border px-3 py-2">
                              <span className="text-sm flex-1">{i + 1}. {item}</span>
                              <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add item..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())} />
                        <Button variant="outline" size="sm" onClick={addItem} disabled={!newItem.trim()}>Add</Button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="border-l border-border/40 pl-4 space-y-3">
                        {[
                          { label: 'Title', value: f.title || '—' },
                          { label: 'Type', value: TYPE_LABEL[f.type] },
                          { label: 'Linked Policy', value: f.linkedPolicyId ? (policies?.find((p) => p.id === f.linkedPolicyId)?.title ?? '—') : 'None' },
                          { label: 'Items', value: `${f.items.length} items` },
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
                      ? <Button onClick={save} disabled={!f.title || f.items.length === 0}>Create</Button>
                      : <Button onClick={() => setStep((s) => Math.min(s + 1, CHECKLIST_STEPS.length - 1))} disabled={step === 0 ? !f.title : false}>Continue</Button>
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

function ChecklistCard({ cl }: { cl: Checklist }) {
  const [expanded, setExpanded] = useState(false);
  const done = cl.items.filter(i => i.completed).length;
  const pct = cl.items.length > 0 ? Math.round((done / cl.items.length) * 100) : 0;
  const policies = useLiveQuery(() => db.policies.toArray(), []);
  const policyName = cl.linkedPolicyId ? policies?.find(p => p.id === cl.linkedPolicyId)?.title : undefined;

  const toggleItem = async (itemId: string) => {
    const updated = cl.items.map(i => {
      if (i.id !== itemId) return i;
      return i.completed
        ? { ...i, completed: false, completedBy: undefined, completedAt: undefined }
        : { ...i, completed: true, completedBy: 'Current User', completedAt: Date.now() };
    });
    const allDone = updated.every(i => i.completed);
    await db.checklists.update(cl.id, {
      items: updated,
      status: allDone ? 'completed' : updated.some(i => i.completed) ? 'in_progress' : 'not_started',
      completedAt: allDone ? Date.now() : undefined,
    });
  };

  const del = async () => { await db.checklists.delete(cl.id); toast.success('Checklist deleted'); };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(cl, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `checklist-${cl.title.toLowerCase().replace(/\s+/g, '-')}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <Card>
      <CardContent className="p-3 sm:p-5 space-y-3">
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{cl.title}</p>
              <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[cl.type]}</Badge>
            </div>
            {policyName && <p className="text-xs text-muted-foreground mt-1">Linked: {policyName}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-sm tabular-nums font-semibold', pct >= 100 ? 'text-emerald-600' : pct > 0 ? 'text-amber-600' : 'text-muted-foreground')}>{done}/{cl.items.length}</span>
            <Badge variant={cl.status === 'completed' ? 'secondary' : cl.status === 'in_progress' ? 'default' : 'outline'} className="text-[10px]">
              {cl.status === 'in_progress' ? 'In Progress' : cl.status === 'completed' ? 'Done' : 'Not Started'}
            </Badge>
          </div>
        </div>
        <Progress value={pct} className="h-1.5" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setExpanded(!expanded)}>
            {expanded ? <><ChevronUp className="h-3.5 w-3.5" />Collapse</> : <><ChevronDown className="h-3.5 w-3.5" />Expand</>}
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exportJSON} aria-label={`Export checklist ${cl.title}`}><Download className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={del} aria-label={`Delete checklist ${cl.title}`}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
        {expanded && (
          <div className="space-y-1.5 pt-1">
            {cl.items.map(item => (
              <div key={item.id} className={cn('flex items-start gap-3 rounded-lg border p-2.5 sm:p-3 transition-colors', item.completed && 'opacity-50')}>
                <Checkbox checked={item.completed} onCheckedChange={() => toggleItem(item.id)} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', item.completed && 'line-through text-muted-foreground')}>{item.text}</p>
                  {item.completedBy && <p className="text-xs text-muted-foreground mt-0.5">{item.completedBy} · {new Date(item.completedAt!).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Checklists() {
  const checklists = useLiveQuery(() => db.checklists.toArray(), []);
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? checklists ?? [] : checklists?.filter(c => c.type === filter) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Checklists</h1>
          <p className="text-sm text-muted-foreground mt-1">Standardized checklists for audits, training, and compliance.</p>
        </div>
        <NewChecklistDialog />
      </div>

      {/* Scrollable filter chips instead of tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {FILTER_TABS.map(tab => {
          const count = tab.value === 'all' ? (checklists?.length ?? 0) : (checklists?.filter(c => c.type === tab.value).length ?? 0);
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

      <div className="space-y-4">
        {filtered.length === 0
          ? <Card><CardContent className="py-12 text-center text-muted-foreground">No checklists found.</CardContent></Card>
          : filtered.map(cl => <ChecklistCard key={cl.id} cl={cl} />)
        }
      </div>
    </div>
  );
}
