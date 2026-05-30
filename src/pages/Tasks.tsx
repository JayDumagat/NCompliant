import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock, Plus, Pencil, Trash2, User, LayoutTemplate, List, Columns3, LayoutGrid, ChevronLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

const TASK_STEPS = ['Details', 'Assignment', 'Review'];

/* ── Task Dialog ── */
function TaskDialog({ task, trigger, onDone }: { task?: Task; trigger: React.ReactNode; onDone: () => void }) {
  const policies = useLiveQuery(() => db.policies.toArray(), []);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', policyId: '', dueDate: '' });

  const handleOpen = (v: boolean) => {
    if (v && task) setF({ title: task.title, description: task.description, priority: task.priority, status: task.status, assignedTo: task.assignedTo ?? '', policyId: task.policyId ?? '', dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '' });
    else if (v) setF({ title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', policyId: '', dueDate: '' });
    if (v) setStep(0);
    setOpen(v);
  };

  const save = async () => {
    const data = { title: f.title, description: f.description, priority: f.priority as Task['priority'], status: f.status as Task['status'], assignedTo: f.assignedTo, policyId: f.policyId || undefined, dueDate: f.dueDate ? new Date(f.dueDate).getTime() : undefined };
    if (task) { await db.tasks.update(task.id, data); toast.success('Task updated'); }
    else { await db.tasks.add({ id: crypto.randomUUID(), workspaceId: 'ws-default', createdAt: Date.now(), ...data }); toast.success('Task created'); }
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
                <p className="text-lg font-semibold tracking-tight">{task ? 'Edit Task' : 'New Task'}</p>
                <p className="text-sm text-muted-foreground">Complete the task in a compact but full-screen stepper.</p>
              </div>
            </div>
            <div className="mt-8 space-y-2">
              {TASK_STEPS.map((label, index) => {
                const active = index === step;
                const complete = index < step;
                return (
                  <button key={label} onClick={() => complete && setStep(index)} className={cn('flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors', active ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent/20', !complete && 'opacity-75')}>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium', complete ? 'bg-emerald-500 text-white' : active ? 'border border-primary/30 bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                      {complete ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{index === 0 ? 'Title and description' : index === 1 ? 'Priority and ownership' : 'Review before saving'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4 lg:px-8">
              <div>
                <p className="text-sm text-muted-foreground">Task Builder</p>
                <h2 className="text-lg font-semibold tracking-tight">Step {step + 1} of {TASK_STEPS.length}</h2>
              </div>
              <div />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
              <div className="w-full space-y-6">
                <div className="space-y-6">
                  {step === 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="task-title">Title</Label><Input id="task-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Task title" /></div>
                      <div className="space-y-2"><Label htmlFor="task-description">Description</Label><Textarea id="task-description" className="min-h-[120px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Brief description..." /></div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="task-priority">Priority</Label>
                          <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v })}><SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="task-status">Status</Label>
                          <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger id="task-status"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="task-assignedTo">Assigned To</Label><Input id="task-assignedTo" value={f.assignedTo} onChange={(e) => setF({ ...f, assignedTo: e.target.value })} placeholder="Name" /></div>
                        <div className="space-y-2"><Label htmlFor="task-dueDate">Due Date</Label><Input id="task-dueDate" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="task-linkedPolicy">Linked Policy</Label>
                        <Select value={f.policyId || '__none__'} onValueChange={(v) => setF({ ...f, policyId: v === '__none__' ? '' : v })}><SelectTrigger id="task-linkedPolicy"><SelectValue placeholder="None" /></SelectTrigger>
                          <SelectContent><SelectItem value="__none__">None</SelectItem>{policies?.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
                      <div className="border-l border-border/40 pl-4 space-y-3">
                        {[
                          { label: 'Title', value: f.title || '—' },
                          { label: 'Priority', value: f.priority },
                          { label: 'Status', value: f.status },
                          { label: 'Assigned To', value: f.assignedTo || '—' },
                          { label: 'Due Date', value: f.dueDate || '—' },
                          { label: 'Linked Policy', value: f.policyId ? (policies?.find((p) => p.id === f.policyId)?.title ?? '—') : 'None' },
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
                      ? <Button onClick={save} disabled={!f.title}>{task ? 'Save Changes' : 'Create Task'}</Button>
                      : <Button onClick={() => setStep((s) => Math.min(s + 1, TASK_STEPS.length - 1))} disabled={step === 0 ? !f.title : false}>Continue</Button>
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

function DeleteDialog({ task, onDone }: { task: Task; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const del = async () => { await db.tasks.delete(task.id); toast.success('Task deleted'); setOpen(false); onDone(); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Delete task ${task.title}`}><Trash2 className="h-3.5 w-3.5" /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Delete Task</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground py-2">Are you sure you want to delete "{task.title}"? This cannot be undone.</p>
        <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="destructive" onClick={del}>Delete</Button></div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Priority styling ── */
const PRI_DOT: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-gray-400' };

export default function Tasks() {
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'grid'>('list');

  const todo = tasks?.filter((t) => t.status === 'todo') ?? [];
  const prog = tasks?.filter((t) => t.status === 'in_progress') ?? [];
  const done = tasks?.filter((t) => t.status === 'done') ?? [];

  const sorter = (a: Task, b: Task) => {
    if (sortBy === 'priority') { const o = { high: 0, medium: 1, low: 2 }; return o[a.priority] - o[b.priority]; }
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity);
  };

  const toggle = async (t: Task) => {
    const s = t.status === 'done' ? 'todo' : 'done';
    await db.tasks.update(t.id, { status: s });
    toast.success(s === 'done' ? 'Completed' : 'Reopened');
  };

  const start = async (t: Task) => {
    await db.tasks.update(t.id, { status: 'in_progress' });
    toast.success('Task started');
  };

  const nav = useNavigate();

  /* ── List View Row ── */
  const listRow = (t: Task) => {
    const overdue = t.dueDate && t.dueDate < Date.now() && t.status !== 'done';
    const isDone = t.status === 'done';
    return (
      <div key={t.id} className={cn('rounded-lg border p-3 sm:p-4 transition-colors', isDone && 'opacity-50')}>
        <div className="flex items-start gap-3">
          <Checkbox checked={isDone} onCheckedChange={() => toggle(t)} className="mt-1" />
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>{t.title}</p>
            {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {t.dueDate && <span className={cn('text-xs inline-flex items-center gap-1', overdue ? 'text-destructive' : 'text-muted-foreground')}><Clock className="h-3 w-3" />{new Date(t.dueDate).toLocaleDateString()}</span>}
              {t.assignedTo && <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><User className="h-3 w-3" />{t.assignedTo}</span>}
              <Badge variant={t.priority === 'high' ? 'destructive' : t.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px]">{t.priority}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {t.status === 'todo' && <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => start(t)}>Start</Button>}
            <TaskDialog task={t} trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label={`Edit task ${t.title}`}><Pencil className="h-3.5 w-3.5" /></Button>} onDone={() => {}} />
            <DeleteDialog task={t} onDone={() => {}} />
          </div>
        </div>
      </div>
    );
  };

  /* ── Grid Card ── */
  const gridCard = (t: Task) => {
    const overdue = t.dueDate && t.dueDate < Date.now() && t.status !== 'done';
    const isDone = t.status === 'done';
    return (
      <Card key={t.id} className={cn('transition-all', isDone && 'opacity-50')}>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full shrink-0', PRI_DOT[t.priority])} />
              <p className={cn('text-sm font-medium line-clamp-2', isDone && 'line-through text-muted-foreground')}>{t.title}</p>
            </div>
            <Checkbox checked={isDone} onCheckedChange={() => toggle(t)} />
          </div>
          {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            {t.dueDate && <span className={cn('text-[10px] inline-flex items-center gap-1', overdue ? 'text-destructive' : 'text-muted-foreground')}><Clock className="h-3 w-3" />{new Date(t.dueDate).toLocaleDateString()}</span>}
            {t.assignedTo && <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><User className="h-3 w-3" />{t.assignedTo}</span>}
          </div>
          <div className="flex items-center gap-1 pt-1 border-t">
            {t.status === 'todo' && <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => start(t)}>Start</Button>}
            <div className="flex-1" />
            <TaskDialog task={t} trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Edit task ${t.title}`}><Pencil className="h-3 w-3" /></Button>} onDone={() => {}} />
            <DeleteDialog task={t} onDone={() => {}} />
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ── Kanban Column ── */
  const kanbanCol = (title: string, items: Task[], color: string) => (
    <div className="flex-1 min-w-[260px] sm:min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <Badge variant="outline" className="text-[10px] ml-auto">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.sort(sorter).map(t => {
          const overdue = t.dueDate && t.dueDate < Date.now() && t.status !== 'done';
          return (
            <div key={t.id} className={cn('rounded-lg border p-3 bg-card space-y-2', t.status === 'done' && 'opacity-50')}>
              <div className="flex items-start justify-between gap-2">
                <p className={cn('text-sm font-medium line-clamp-2', t.status === 'done' && 'line-through text-muted-foreground')}>{t.title}</p>
                <Checkbox checked={t.status === 'done'} onCheckedChange={() => toggle(t)} className="shrink-0" />
              </div>
              {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                {t.dueDate && <span className={cn('text-[10px] inline-flex items-center gap-1', overdue ? 'text-destructive' : 'text-muted-foreground')}><Clock className="h-3 w-3" />{new Date(t.dueDate).toLocaleDateString()}</span>}
                {t.assignedTo && <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><User className="h-3 w-3" />{t.assignedTo}</span>}
                <Badge variant={t.priority === 'high' ? 'destructive' : t.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px]">{t.priority}</Badge>
              </div>
              <div className="flex items-center gap-0.5 pt-1 border-t">
                {t.status === 'todo' && <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => start(t)}>Start</Button>}
                <div className="flex-1" />
                <TaskDialog task={t} trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Edit task ${t.title}`}><Pencil className="h-3 w-3" /></Button>} onDone={() => {}} />
                <DeleteDialog task={t} onDone={() => {}} />
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="rounded-lg border-2 border-dashed p-6 text-center text-xs text-muted-foreground">No tasks</div>}
      </div>
    </div>
  );

  const VIEW_ICONS = [
    { mode: 'list' as const, icon: List, label: 'List' },
    { mode: 'kanban' as const, icon: Columns3, label: 'Board' },
    { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track compliance tasks and deadlines.</p>
          </div>
          <TaskDialog trigger={<Button className="gap-2 shrink-0"><Plus className="h-4 w-4" /><span className="hidden sm:inline">New Task</span></Button>} onDone={() => {}} />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border p-0.5">
            {VIEW_ICONS.map(v => (
                <button
                key={v.mode}
                onClick={() => setViewMode(v.mode)}
                  aria-label={`Switch to ${v.label.toLowerCase()} view`}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === v.mode ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <v.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger id="tasks-sortBy" className="w-[110px] sm:w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="dueDate">Due Date</SelectItem><SelectItem value="priority">Priority</SelectItem><SelectItem value="title">Name</SelectItem></SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => nav('/templates')}><LayoutTemplate className="h-3.5 w-3.5" /><span className="hidden sm:inline">Template</span></Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {kanbanCol('To Do', todo, 'bg-gray-400')}
          {kanbanCol('In Progress', prog, 'bg-blue-500')}
          {kanbanCol('Done', done, 'bg-emerald-500')}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div>
          {(todo.length + prog.length) > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Active</p>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[...prog, ...todo].sort(sorter).map(gridCard)}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Completed</p>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[...done].sort(sorter).map(gridCard)}
              </div>
            </div>
          )}
          {!tasks?.length && <EmptyState icon={LayoutGrid} title="No tasks yet" description="Create a task to start tracking assignments and due dates." className="py-12" />}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({todo.length + prog.length})</TabsTrigger>
            <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4 space-y-4">
            {prog.length > 0 && <div className="space-y-2"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Progress</p>{[...prog].sort(sorter).map(listRow)}</div>}
            {todo.length > 0 && <div className="space-y-2"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To Do</p>{[...todo].sort(sorter).map(listRow)}</div>}
            {todo.length === 0 && prog.length === 0 && <EmptyState icon={Check} title="All tasks complete" description="Nothing is currently in progress. New tasks will appear here when you create them." className="py-12" />}
          </TabsContent>
          <TabsContent value="done" className="mt-4 space-y-2">
            {done.length === 0 ? <EmptyState icon={Check} title="No completed tasks yet" description="Finished tasks will show up here once work gets marked done." className="py-12" /> : [...done].sort(sorter).map(listRow)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
