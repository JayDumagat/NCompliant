import { useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TaskTemplate, type TemplateKind, type TemplateStep } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Copy,
  FileText,
  GraduationCap,
  GripVertical,
  Layers3,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
  Pencil,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const KIND_ORDER: TemplateKind[] = ['task', 'policy', 'assessment', 'checklist', 'incident', 'training', 'vendor', 'custom'];

const KIND_META: Record<TemplateKind, {
  label: string;
  short: string;
  description: string;
  icon: typeof Layers3;
  color: string;
  category: TaskTemplate['category'];
  route?: string;
  starter: string;
}> = {
  task: {
    label: 'Task',
    short: 'Task',
    description: 'Recurring work items and operational reminders.',
    icon: ListChecks,
    color: 'bg-sky-500/10 text-sky-600',
    category: 'custom',
    route: '/tasks',
    starter: '1. Confirm scope\n2. Gather inputs\n3. Review and approve\n4. Publish or close out',
  },
  policy: {
    label: 'Policy',
    short: 'Policy',
    description: 'Policy language, controls, and review-ready boilerplate.',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600',
    category: 'policy_review',
    route: '/policies',
    starter: 'Purpose:\n- Why this policy exists\n\nScope:\n- Who and what is covered\n\nControls:\n- Requirements and expectations\n- Review and approval steps',
  },
  assessment: {
    label: 'Assessment',
    short: 'Assessment',
    description: 'PIA, risk, and other evaluation starter packs.',
    icon: ClipboardCheck,
    color: 'bg-emerald-500/10 text-emerald-600',
    category: 'pia',
    route: '/assessments',
    starter: 'Objective:\n- What is being assessed\n\nQuestions:\n- Key evaluation prompts\n- Data, risk, and control checks\n\nFindings:\n- Summary of issues and recommendations',
  },
  checklist: {
    label: 'Checklist',
    short: 'Checklist',
    description: 'Structured repeatable lists for reviews and audits.',
    icon: ListChecks,
    color: 'bg-amber-500/10 text-amber-600',
    category: 'audit',
    route: '/checklists',
    starter: '1. Verify ownership\n2. Confirm evidence\n3. Validate control operation\n4. Capture notes\n5. Close with sign-off',
  },
  incident: {
    label: 'Incident',
    short: 'Incident',
    description: 'Response playbooks, triage steps, and recurring incident workflows.',
    icon: AlertTriangle,
    color: 'bg-orange-500/10 text-orange-600',
    category: 'incident',
    route: '/incidents',
    starter: '1. Triage and classify\n2. Contain impact\n3. Investigate root cause\n4. Document response\n5. Complete corrective actions',
  },
  training: {
    label: 'Training',
    short: 'Training',
    description: 'Reusable training outlines and onboarding refreshers.',
    icon: GraduationCap,
    color: 'bg-violet-500/10 text-violet-600',
    category: 'training',
    route: '/training',
    starter: 'Module outline:\n- Audience\n- Learning goals\n- Required materials\n- Completion criteria',
  },
  vendor: {
    label: 'Vendor',
    short: 'Vendor',
    description: 'Assessment starter packs for recurring third-party reviews.',
    icon: Building2,
    color: 'bg-cyan-500/10 text-cyan-600',
    category: 'report',
    route: '/vendors',
    starter: '1. Confirm service scope\n2. Review security/privacy posture\n3. Capture risk observations\n4. Decide next action',
  },
  custom: {
    label: 'Custom',
    short: 'Custom',
    description: 'Anything repeated often enough to templatize.',
    icon: Sparkles,
    color: 'bg-neutral-500/10 text-neutral-600',
    category: 'custom',
    starter: 'Start with a title, then add the steps or starter content you want to reuse.',
  },
};

const CATEGORY_LABEL: Record<TaskTemplate['category'], string> = {
  audit: 'Audit',
  policy_review: 'Policy Review',
  pia: 'PIA',
  incident: 'Incident',
  training: 'Training',
  report: 'Report',
  custom: 'Custom',
};

const PRIORITY_LABEL: Record<TaskTemplate['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

interface FormState {
  kind: TemplateKind;
  title: string;
  description: string;
  category: TaskTemplate['category'];
  priority: TaskTemplate['priority'];
  recurrence: string;
  tags: string;
  payload: string;
  steps: TemplateStep[];
}

function makeEmptyForm(kind: TemplateKind = 'task'): FormState {
  return {
    kind,
    title: '',
    description: '',
    category: KIND_META[kind].category,
    priority: 'medium',
    recurrence: '',
    tags: '',
    payload: KIND_META[kind].starter,
    steps: [],
  };
}

function parseTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function getKind(template: TaskTemplate) {
  return template.kind ?? 'task';
}

function getStarterText(template: TaskTemplate) {
  if (template.payload?.trim()) return template.payload.trim();
  if (template.steps.length > 0) return template.steps.map((step, index) => `${index + 1}. ${step.text}`).join('\n');
  return template.description || KIND_META[getKind(template)].starter;
}

function normalizeTemplate(template: TaskTemplate) {
  return {
    ...template,
    kind: getKind(template),
    tags: template.tags ?? [],
    payload: template.payload ?? '',
  };
}

function TemplateDialog({ template, trigger, onDone }: { template?: TaskTemplate; trigger: ReactNode; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(makeEmptyForm());
  const [newStep, setNewStep] = useState('');

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      if (template) {
        const normalized = normalizeTemplate(template);
        setForm({
          kind: normalized.kind,
          title: normalized.title,
          description: normalized.description,
          category: normalized.category,
          priority: normalized.priority,
          recurrence: normalized.recurrence ?? '',
          tags: (normalized.tags ?? []).join(', '),
          payload: normalized.payload || KIND_META[normalized.kind].starter,
          steps: [...normalized.steps],
        });
      } else {
        setForm(makeEmptyForm('task'));
      }
    }
    setOpen(nextOpen);
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setForm((current) => ({
      ...current,
      steps: [...current.steps, { id: crypto.randomUUID(), text: newStep.trim(), completed: false }],
    }));
    setNewStep('');
  };

  const removeStep = (id: string) => {
    setForm((current) => ({ ...current, steps: current.steps.filter((step) => step.id !== id) }));
  };

  const switchKind = (kind: TemplateKind) => {
    setForm((current) => ({
      ...current,
      kind,
      category: KIND_META[kind].category,
      payload: current.payload.trim() ? current.payload : KIND_META[kind].starter,
      steps: current.steps.length > 0 ? current.steps : makeEmptyForm(kind).steps,
    }));
  };

  const save = async () => {
    const data: Partial<TaskTemplate> = {
      title: form.title.trim(),
      description: form.description.trim(),
      kind: form.kind,
      category: form.category,
      priority: form.priority,
      recurrence: form.recurrence ? (form.recurrence as TaskTemplate['recurrence']) : undefined,
      tags: parseTags(form.tags),
      payload: form.payload.trim() || undefined,
      steps: form.steps,
    };

    if (template) {
      await db.taskTemplates.update(template.id, data);
      toast.success('Template updated');
    } else {
      await db.taskTemplates.add({
        id: crypto.randomUUID(),
        workspaceId: 'ws-default',
        createdAt: Date.now(),
        ...(data as Omit<TaskTemplate, 'id' | 'workspaceId' | 'createdAt'>),
      });
      toast.success('Template created');
    }

    setOpen(false);
    onDone();
  };

  const canSave = form.title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'New Template'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Template Kind</Label>
              <Select value={form.kind} onValueChange={(value) => switchKind(value as TemplateKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIND_ORDER.map((kind) => (
                    <SelectItem key={kind} value={kind}>{KIND_META[kind].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value as TaskTemplate['priority'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder={`${KIND_META[form.kind].label} template name`}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              className="min-h-[72px]"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder={KIND_META[form.kind].description}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Subtype</Label>
              <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value as TaskTemplate['category'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recurrence</Label>
              <Select value={form.recurrence || 'none'} onValueChange={(value) => setForm((current) => ({ ...current, recurrence: value === 'none' ? '' : value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="privacy, recurring, legal, onboarding"
            />
          </div>

          <div className="space-y-2">
            <Label>Starter Content</Label>
            <Textarea
              className="min-h-[120px] font-mono text-sm"
              value={form.payload}
              onChange={(event) => setForm((current) => ({ ...current, payload: event.target.value }))}
              placeholder={KIND_META[form.kind].starter}
            />
          </div>

          <div className="space-y-2">
            <Label>Steps / Checklist Items ({form.steps.length})</Label>
            <div className="max-h-[180px] space-y-1.5 overflow-y-auto rounded-md border p-2">
              {form.steps.length === 0 && (
                <p className="px-1 py-3 text-sm text-muted-foreground">No steps added yet.</p>
              )}
              {form.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2 rounded border bg-background px-3 py-2">
                  <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm">{index + 1}. {step.text}</span>
                  <button type="button" onClick={() => removeStep(step.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newStep}
                onChange={(event) => setNewStep(event.target.value)}
                placeholder="Add a step or checklist item..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addStep();
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={addStep} disabled={!newStep.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>{template ? 'Save' : 'Create'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TaskTemplates() {
  const templates = useLiveQuery(() => db.taskTemplates.toArray(), []);
  const [query, setQuery] = useState('');
  const nav = useNavigate();

  const normalizedTemplates = useMemo(() => (templates ?? []).map(normalizeTemplate), [templates]);

  const counts = useMemo(() => {
    return KIND_ORDER.reduce<Record<TemplateKind, number>>((acc, kind) => {
      acc[kind] = normalizedTemplates.filter((template) => template.kind === kind).length;
      return acc;
    }, {} as Record<TemplateKind, number>);
  }, [normalizedTemplates]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return normalizedTemplates.filter((template) => {
      if (!search) return true;
      const tags = (template.tags ?? []).join(' ');
      return [template.title, template.description, template.payload ?? '', tags, CATEGORY_LABEL[template.category], KIND_META[template.kind].label]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [normalizedTemplates, query]);

  const useTemplate = async (template: TaskTemplate) => {
    const kind = getKind(template);
    if (kind !== 'task') {
      const starter = getStarterText(template);
      try {
        await navigator.clipboard.writeText(starter);
        toast.success(`${KIND_META[kind].label} starter copied`);
      } catch {
        toast.success(`${KIND_META[kind].label} starter ready`);
      }
      if (KIND_META[kind].route) nav(KIND_META[kind].route!);
      return;
    }

    await db.tasks.add({
      id: crypto.randomUUID(),
      workspaceId: 'ws-default',
      title: template.title,
      description: template.steps.length > 0
        ? template.steps.map((step, index) => `${index + 1}. ${step.text}`).join('\n')
        : template.payload ?? template.description,
      assignedTo: '',
      status: 'todo',
      priority: template.priority,
      dueDate: Date.now() + 7 * 86400000,
      createdAt: Date.now(),
    });
    toast.success('Task created from template');
    nav('/tasks');
  };

  const copyStarter = async (template: TaskTemplate) => {
    const starter = getStarterText(template);
    try {
      await navigator.clipboard.writeText(starter);
      toast.success('Starter copied to clipboard');
    } catch {
      toast.error('Unable to copy starter content');
    }
  };

  const duplicate = async (template: TaskTemplate) => {
    await db.taskTemplates.add({
      ...template,
      id: crypto.randomUUID(),
      title: `${template.title} (Copy)`,
      createdAt: Date.now(),
    });
    toast.success('Template duplicated');
  };

  const del = async (id: string) => {
    await db.taskTemplates.delete(id);
    toast.success('Template deleted');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Template Library</h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Build reusable starters for policies, assessments, tasks, checklists, incidents, training, vendors, and any other repeatable workflow.
          </p>
        </div>
        <TemplateDialog trigger={<Button className="gap-2"><Plus className="h-4 w-4" />New Template</Button>} onDone={() => {}} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KIND_ORDER.map((kind) => {
          const meta = KIND_META[kind];
          const Icon = meta.icon;
          return (
            <Card key={kind}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">{counts[kind]}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          placeholder="Search templates by name, description, tags, or kind..."
        />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="all">All ({normalizedTemplates.length})</TabsTrigger>
          {KIND_ORDER.map((kind) => (
            <TabsTrigger key={kind} value={kind}>
              {KIND_META[kind].short} ({counts[kind]})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderTemplates(filtered, useTemplate, copyStarter, duplicate, del)}
        </TabsContent>
        {KIND_ORDER.map((kind) => (
          <TabsContent key={kind} value={kind} className="space-y-4">
            {renderTemplates(filtered.filter((template) => template.kind === kind), useTemplate, copyStarter, duplicate, del)}
          </TabsContent>
        ))}
      </Tabs>

      {normalizedTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No templates yet. Create a policy, assessment, task, checklist, or incident starter to get going.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function renderTemplates(
  templates: TaskTemplate[],
  useTemplate: (template: TaskTemplate) => Promise<void>,
  copyStarter: (template: TaskTemplate) => Promise<void>,
  duplicate: (template: TaskTemplate) => Promise<void>,
  del: (id: string) => Promise<void>
) {
  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No templates match this filter.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => {
        const kind = getKind(template);
        const meta = KIND_META[kind];
        const Icon = meta.icon;
        const starter = getStarterText(template);
        const preview = starter.split('\n').find((line) => line.trim()) ?? starter;
        const primaryLabel = kind === 'task' ? 'Use' : meta.route ? `Open ${meta.label}` : 'Copy Starter';

        return (
          <Card key={template.id} className="flex flex-col">
            <CardContent className="flex-1 space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', meta.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{template.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">{meta.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{CATEGORY_LABEL[template.category]}</Badge>
                      {template.recurrence && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <RefreshCw className="h-3 w-3" />{template.recurrence}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={template.priority === 'high' ? 'destructive' : template.priority === 'medium' ? 'default' : 'secondary'}>
                  {PRIORITY_LABEL[template.priority]}
                </Badge>
              </div>

              {template.description && <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>}

              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Starter preview</p>
                <p className="mt-1 text-sm text-foreground/90 line-clamp-3 whitespace-pre-line">{preview}</p>
              </div>

              <div className="space-y-1">
                {template.steps.slice(0, 3).map((step, index) => (
                  <p key={step.id} className="truncate text-sm text-muted-foreground">
                    <span className="mr-1.5 text-foreground/50">{index + 1}.</span>
                    {step.text}
                  </p>
                ))}
                {template.steps.length > 3 && <p className="text-xs text-muted-foreground">+{template.steps.length - 3} more steps</p>}
              </div>

              {(template.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(template.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>

            <div className="flex flex-wrap items-center gap-1 border-t px-4 py-3">
              <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => useTemplate(template)}>
                <Play className="h-3.5 w-3.5" />{primaryLabel}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyStarter(template)} title="Copy starter">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <TemplateDialog template={template} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>} onDone={() => {}} />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(template)} title="Duplicate">
                <Layers3 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => del(template.id)} title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
