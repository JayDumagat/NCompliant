import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskTemplate, type TemplateStep } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Play, Pencil, Trash2, Copy, RefreshCw, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const CAT_LABEL: Record<string, string> = { audit: 'Audit', policy_review: 'Policy Review', pia: 'PIA', incident: 'Incident', training: 'Training', report: 'Report', custom: 'Custom' };
const CAT_CLR: Record<string, string> = { audit: 'bg-blue-500/10 text-blue-600', policy_review: 'bg-primary/10 text-primary', pia: 'bg-amber-500/10 text-amber-600', incident: 'bg-destructive/10 text-destructive', training: 'bg-emerald-500/10 text-emerald-600', report: 'bg-violet-500/10 text-violet-600', custom: 'bg-muted text-muted-foreground' };

interface FormState {
  title: string; description: string; category: TaskTemplate['category']; priority: TaskTemplate['priority'];
  recurrence: string; steps: TemplateStep[];
}
const emptyForm: FormState = { title: '', description: '', category: 'custom', priority: 'medium', recurrence: '', steps: [] };

function TemplateDialog({ template, trigger, onDone }: { template?: TaskTemplate; trigger: React.ReactNode; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<FormState>({ ...emptyForm });
  const [newStep, setNewStep] = useState('');

  const handleOpen = (v: boolean) => {
    if (v && template) {
      setF({ title: template.title, description: template.description, category: template.category, priority: template.priority, recurrence: template.recurrence ?? '', steps: [...template.steps] });
    } else if (v) setF({ ...emptyForm });
    setOpen(v);
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setF({ ...f, steps: [...f.steps, { id: crypto.randomUUID(), text: newStep.trim(), completed: false }] });
    setNewStep('');
  };

  const removeStep = (id: string) => setF({ ...f, steps: f.steps.filter(s => s.id !== id) });

  const save = async () => {
    const data = { title: f.title, description: f.description, category: f.category, priority: f.priority, recurrence: f.recurrence || undefined, steps: f.steps } as Partial<TaskTemplate>;
    if (template) {
      await db.taskTemplates.update(template.id, data);
      toast.success('Template updated');
    } else {
      await db.taskTemplates.add({ id: crypto.randomUUID(), workspaceId: 'ws-default', createdAt: Date.now(), ...data } as TaskTemplate);
      toast.success('Template created');
    }
    setOpen(false); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{template ? 'Edit Template' : 'New Template'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Title</Label><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Template name" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea className="min-h-[60px]" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Category</Label>
              <Select value={f.category} onValueChange={v => setF({ ...f, category: v as TaskTemplate['category'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CAT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Priority</Label>
              <Select value={f.priority} onValueChange={v => setF({ ...f, priority: v as TaskTemplate['priority'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Recurrence</Label>
              <Select value={f.recurrence || 'none'} onValueChange={v => setF({ ...f, recurrence: v === 'none' ? '' : v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2">
            <Label>Steps ({f.steps.length})</Label>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {f.steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 rounded border px-3 py-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1">{i + 1}. {s.text}</span>
                  <button onClick={() => removeStep(s.id)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a step..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStep())} />
              <Button variant="outline" size="sm" onClick={addStep} disabled={!newStep.trim()}>Add</Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!f.title || f.steps.length === 0}>{template ? 'Save' : 'Create'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TaskTemplates() {
  const templates = useLiveQuery(() => db.taskTemplates.toArray(), []);
  const nav = useNavigate();

  const useTemplate = async (t: TaskTemplate) => {
    await db.tasks.add({
      id: crypto.randomUUID(), workspaceId: 'ws-default', title: t.title,
      description: t.steps.map((s, i) => `${i + 1}. ${s.text}`).join('\n'),
      assignedTo: '', status: 'todo', priority: t.priority,
      dueDate: Date.now() + 7 * 86400000, createdAt: Date.now(),
    });
    toast.success('Task created from template');
    nav('/tasks');
  };

  const duplicate = async (t: TaskTemplate) => {
    await db.taskTemplates.add({ ...t, id: crypto.randomUUID(), title: `${t.title} (Copy)`, createdAt: Date.now() });
    toast.success('Template duplicated');
  };

  const del = async (id: string) => {
    await db.taskTemplates.delete(id);
    toast.success('Template deleted');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Task Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Reusable templates for recurring compliance tasks.</p>
        </div>
        <TemplateDialog trigger={<Button className="gap-2"><Plus className="h-4 w-4" />New Template</Button>} onDone={() => {}} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map(t => (
          <Card key={t.id} className="flex flex-col">
            <CardContent className="flex-1 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-tight">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{CAT_LABEL[t.category]} · {t.steps.length} steps</p>
                </div>
                <Badge variant={t.priority === 'high' ? 'destructive' : t.priority === 'medium' ? 'default' : 'secondary'}>{t.priority}</Badge>
              </div>
              {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
              <div className="space-y-1">
                {t.steps.slice(0, 3).map((s, i) => (
                  <p key={s.id} className="text-sm text-muted-foreground truncate">
                    <span className="text-foreground/50 mr-1.5">{i + 1}.</span>{s.text}
                  </p>
                ))}
                {t.steps.length > 3 && <p className="text-xs text-muted-foreground">+{t.steps.length - 3} more steps</p>}
              </div>
              {t.recurrence && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />{t.recurrence}
                </div>
              )}
            </CardContent>
            <div className="flex items-center gap-1 border-t px-4 py-3">
              <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => useTemplate(t)}><Play className="h-3.5 w-3.5" />Use</Button>
              <TemplateDialog template={t} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>} onDone={() => {}} />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(t)}><Copy className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => del(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>
      {templates?.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No templates yet. Create one to get started.</CardContent></Card>}
    </div>
  );
}
