import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Assessment, type AssessmentType } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, ShieldAlert, ChevronRight, ClipboardCheck, Shield, LayoutTemplate, SquarePen, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { DataAssetPicker } from '@/components/DataAssetPicker';
import { useDataAssets } from '@/hooks/useDataAssets';
import { Separator } from '@/components/ui/separator';

const TYPE_SHORT: Record<AssessmentType, string> = { pia: 'PIA', risk_assessment: 'Risk', security_checklist: 'Security' };
const TYPE_ICONS: Record<AssessmentType, typeof ShieldAlert> = { pia: ShieldAlert, risk_assessment: Shield, security_checklist: ClipboardCheck };
const RISK_CLR: Record<string, string> = { high: 'bg-destructive/10 text-destructive', medium: 'bg-amber-500/10 text-amber-600', low: 'bg-emerald-500/10 text-emerald-600', unassessed: 'bg-muted text-muted-foreground' };

const TEMPLATES = [
  { id: 'tpl-pia-employee', type: 'pia' as AssessmentType, title: 'Employee Records PIA', description: 'Privacy impact assessment for employee personal data processing', dataTypes: 'Full Name, Address, Contact Info, Government IDs, Employment History', processingPurpose: 'Human resource management and payroll processing', dataSubjects: 'Employees, Contractors, Job Applicants' },
  { id: 'tpl-pia-customer', type: 'pia' as AssessmentType, title: 'Customer Data PIA', description: 'Privacy impact assessment for customer data collection and processing', dataTypes: 'Name, Email, Phone, Transaction History, Preferences', processingPurpose: 'Service delivery and customer relationship management', dataSubjects: 'Customers, Prospects, Website Visitors' },
  { id: 'tpl-risk-it', type: 'risk_assessment' as AssessmentType, title: 'IT Infrastructure Risk Assessment', description: 'Risk assessment for IT systems and infrastructure', assetsCovered: 'Servers, Network Equipment, Cloud Services, Databases', threatSources: 'Cyberattacks, Insider Threats, Natural Disasters, Hardware Failure' },
  { id: 'tpl-risk-ops', type: 'risk_assessment' as AssessmentType, title: 'Operational Risk Assessment', description: 'Assessment of operational risks across business processes', assetsCovered: 'Business Processes, Supply Chain, Human Resources', threatSources: 'Process Failures, Regulatory Changes, Market Disruption' },
  { id: 'tpl-sec-isms', type: 'security_checklist' as AssessmentType, title: 'ISMS Security Audit', description: 'ISO 27001 aligned information security controls assessment', systemsInScope: 'All organizational IT systems and data processing facilities', frameworkRef: 'ISO/IEC 27001:2022' },
  { id: 'tpl-sec-network', type: 'security_checklist' as AssessmentType, title: 'Network Security Assessment', description: 'Security controls assessment for network infrastructure', systemsInScope: 'Firewalls, Routers, Switches, VPN, Wireless', frameworkRef: 'CIS Controls v8' },
];

const FORM_STEPS: Record<AssessmentType, string[]> = {
  pia: ['Basic Info', 'PIA Details', 'Review'],
  risk_assessment: ['Basic Info', 'Risk Details', 'Review'],
  security_checklist: ['Basic Info', 'Security Scope', 'Review'],
};

function NewDialog() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'choose' | 'template' | 'form'>('choose');
  const [formStep, setFormStep] = useState(0);
  const [entryMode, setEntryMode] = useState<'templates' | 'manual'>('manual');
  const [f, setF] = useState({ type: 'pia' as AssessmentType, title: '', description: '', dataTypes: '', dataAssetIds: [] as string[], processingPurpose: '', dataSubjects: '', assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '' });
  const { resolveIds } = useDataAssets();

  const pickTemplate = (tpl: typeof TEMPLATES[0]) => {
    setF({ type: tpl.type, title: tpl.title, description: tpl.description, dataTypes: (tpl as any).dataTypes || '', dataAssetIds: [], processingPurpose: (tpl as any).processingPurpose || '', dataSubjects: (tpl as any).dataSubjects || '', assetsCovered: (tpl as any).assetsCovered || '', threatSources: (tpl as any).threatSources || '', systemsInScope: (tpl as any).systemsInScope || '', frameworkRef: (tpl as any).frameworkRef || '' });
    setStep('form');
    setFormStep(0);
  };

  const save = async () => {
    const id = crypto.randomUUID();
    const resolved = resolveIds(f.dataAssetIds);
    const legacyDataTypes = resolved.length ? resolved.map((a) => a.name) : f.dataTypes.split(',').map(s => s.trim()).filter(Boolean);
    await db.assessments.add({ id, workspaceId: 'ws-default', type: f.type, title: f.title, description: f.description, status: 'not_started', riskLevel: 'unassessed', dataTypes: legacyDataTypes, dataAssetIds: f.dataAssetIds, processingPurpose: f.processingPurpose, dataSubjects: f.dataSubjects, assetsCovered: f.assetsCovered, threatSources: f.threatSources, systemsInScope: f.systemsInScope, frameworkRef: f.frameworkRef, answers: [], findings: '', recommendations: '', score: 0, createdAt: Date.now(), versions: [] });
    toast.success('Assessment created'); setOpen(false); setStep('choose'); setFormStep(0); nav(`/assessments/${id}`);
  };

  const reset = () => { setOpen(false); setStep('choose'); setFormStep(0); setEntryMode('manual'); setF({ type: 'pia', title: '', description: '', dataTypes: '', dataAssetIds: [], processingPurpose: '', dataSubjects: '', assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '' }); };

  const startTemplates = () => {
    setF({ type: 'pia', title: '', description: '', dataTypes: '', dataAssetIds: [], processingPurpose: '', dataSubjects: '', assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '' });
    setEntryMode('templates');
    setStep('template');
    setFormStep(0);
  };

  const startManual = () => {
    setF({ type: 'pia', title: '', description: '', dataTypes: '', dataAssetIds: [], processingPurpose: '', dataSubjects: '', assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '' });
    setEntryMode('manual');
    setStep('form');
    setFormStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else { setOpen(true); setStep('choose'); } }}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New Assessment</Button></DialogTrigger>
      <DialogContent className="w-[min(100vw-1rem,1440px)] max-w-none h-[calc(100vh-1rem)] overflow-hidden p-0 sm:rounded-2xl">
        <div className="grid h-full min-h-0 lg:grid-cols-[300px_1fr]">
          <aside className="hidden min-h-0 flex-col border-r border-border/40 bg-background p-6 lg:flex">
            <div className="space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">Create Assessment</p>
                <p className="text-sm text-muted-foreground">Use a template or build a new assessment with a full-screen stepper.</p>
              </div>
            </div>

            {step === 'form' ? (
              <div className="mt-8 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Progress</p>
                <div className="space-y-2">
                  {FORM_STEPS[f.type].map((label, index) => {
                    const active = index === formStep;
                    const complete = index < formStep;
                    return (
                      <button key={label} onClick={() => complete && setFormStep(index)} className={cn('flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors', active ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent/20', !complete && 'opacity-75')}>
                        <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium', complete ? 'bg-emerald-500 text-white' : active ? 'border border-primary/30 bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                          {complete ? <Check className="h-4 w-4" /> : index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{index === 0 ? 'Basics' : index === 1 ? 'Type-specific details' : 'Review and create'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-8 border-l border-border/40 pl-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Full screen editor</p>
                <p className="mt-2 leading-relaxed">Choose a template or manual mode. The form stays on the right so the content has room to breathe.</p>
              </div>
            )}
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4 lg:px-8">
              <div>
                <p className="text-sm text-muted-foreground">Assessment Builder</p>
                <h2 className="text-lg font-semibold tracking-tight">
                  {step === 'choose' ? 'Choose creation mode' : step === 'template' ? 'Pick a starter' : `Step ${formStep + 1} of ${FORM_STEPS[f.type].length}`}
                </h2>
              </div>
              <div />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
              {step === 'choose' ? (
                <div className="grid w-full gap-4 py-8 sm:grid-cols-2">
                  <button onClick={startTemplates} className="group flex flex-col items-start gap-4 rounded-2xl border border-border/40 bg-background p-6 text-left transition-all hover:border-primary/40 hover:bg-accent/15">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105">
                      <LayoutTemplate className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-semibold">Use Templates</p>
                      <p className="text-sm text-muted-foreground">Start with a PIA, risk, or security starter pack.</p>
                    </div>
                  </button>
                  <button onClick={startManual} className="group flex flex-col items-start gap-4 rounded-2xl border border-border/40 bg-background p-6 text-left transition-all hover:border-primary/40 hover:bg-accent/15">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 transition-transform group-hover:scale-105">
                      <SquarePen className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-semibold">Input Manually</p>
                      <p className="text-sm text-muted-foreground">Jump straight into the form with the stepper on the left.</p>
                    </div>
                  </button>
                </div>
              ) : step === 'template' ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Choose a starter</p>
                      <p className="text-base font-medium">Pick a template or switch to manual input.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep('choose')}><ChevronLeft className="h-4 w-4" />Back</Button>
                      <Button onClick={startManual}>Manual Input</Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {TEMPLATES.map((tpl) => {
                      const Icon = TYPE_ICONS[tpl.type];
                      return (
                        <button key={tpl.id} onClick={() => pickTemplate(tpl)} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background p-4 text-left transition-colors hover:bg-accent/15">
                          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5', tpl.type === 'pia' ? 'bg-blue-500/10 text-blue-600' : tpl.type === 'risk_assessment' ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600')}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0"><p className="text-sm font-medium leading-tight">{tpl.title}</p><p className="text-xs text-muted-foreground mt-0.5">{TYPE_SHORT[tpl.type]}</p></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="space-y-6">
                    {formStep === 0 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="assessment-type">Type</Label>
                          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as AssessmentType })}>
                            <SelectTrigger id="assessment-type"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="pia">Privacy Impact Assessment</SelectItem><SelectItem value="risk_assessment">Risk Assessment</SelectItem><SelectItem value="security_checklist">Security Checklist</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="assessment-title">Title</Label><Input id="assessment-title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Assessment title" /></div>
                        <div className="space-y-2"><Label htmlFor="assessment-description">Description</Label><Textarea id="assessment-description" className="min-h-[110px]" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
                        <DataAssetPicker value={f.dataAssetIds} onChange={(dataAssetIds) => setF({ ...f, dataAssetIds })} />
                      </div>
                    )}

                    {formStep === 1 && f.type === 'pia' && (
                      <div className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="assessment-dataTypes">Manual Data Types (optional, comma separated)</Label><Input id="assessment-dataTypes" value={f.dataTypes} onChange={e => setF({ ...f, dataTypes: e.target.value })} placeholder="Used if no data assets are selected" /></div>
                        <div className="space-y-2"><Label htmlFor="assessment-processingPurpose">Processing purpose</Label><Input id="assessment-processingPurpose" value={f.processingPurpose} onChange={e => setF({ ...f, processingPurpose: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="assessment-dataSubjects">Data subjects</Label><Input id="assessment-dataSubjects" value={f.dataSubjects} onChange={e => setF({ ...f, dataSubjects: e.target.value })} /></div>
                      </div>
                    )}

                    {formStep === 1 && f.type === 'risk_assessment' && (
                      <div className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="assessment-assetsCovered">Assets covered</Label><Input id="assessment-assetsCovered" value={f.assetsCovered} onChange={e => setF({ ...f, assetsCovered: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="assessment-threatSources">Threat sources</Label><Input id="assessment-threatSources" value={f.threatSources} onChange={e => setF({ ...f, threatSources: e.target.value })} /></div>
                      </div>
                    )}

                    {formStep === 1 && f.type === 'security_checklist' && (
                      <div className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="assessment-systemsInScope">Systems in scope</Label><Input id="assessment-systemsInScope" value={f.systemsInScope} onChange={e => setF({ ...f, systemsInScope: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="assessment-frameworkRef">Framework reference</Label><Input id="assessment-frameworkRef" value={f.frameworkRef} onChange={e => setF({ ...f, frameworkRef: e.target.value })} /></div>
                      </div>
                    )}

                    {formStep === 2 && (
                      <div className="space-y-4">
                        <div className="border-l border-border/40 pl-4 space-y-3">
                          {[
                            { label: 'Type', value: TYPE_SHORT[f.type] },
                            { label: 'Title', value: f.title || '—' },
                            { label: 'Description', value: f.description || '—' },
                            { label: 'Linked Data Assets', value: f.dataAssetIds.length ? `${f.dataAssetIds.length} linked` : '—' },
                            { label: 'Details', value: f.type === 'pia' ? (f.processingPurpose || '—') : f.type === 'risk_assessment' ? (f.assetsCovered || '—') : (f.systemsInScope || '—') },
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
                    <div className="flex gap-2">
                      {formStep === 0
                        ? <Button variant="outline" onClick={() => setStep(entryMode === 'templates' ? 'template' : 'choose')}><ChevronLeft className="h-4 w-4" />{entryMode === 'templates' ? 'Templates' : 'Options'}</Button>
                        : <Button variant="outline" onClick={() => setFormStep((s) => Math.max(s - 1, 0))}>Back</Button>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={reset}>Cancel</Button>
                      {formStep === 2
                        ? <Button onClick={save} disabled={!f.title}>Create</Button>
                        : <Button onClick={() => setFormStep((s) => Math.min(s + 1, 2))} disabled={formStep === 0 ? !f.title : false}>Continue</Button>
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ACard({ a, onClick }: { a: Assessment; onClick: () => void }) {
  const { resolveIds } = useDataAssets();
  const linkedAssets = resolveIds(a.dataAssetIds ?? []);
  const Icon = TYPE_ICONS[a.type];
  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', RISK_CLR[a.riskLevel])}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{a.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {TYPE_SHORT[a.type]}{a.completedAt ? ` · Completed ${new Date(a.completedAt).toLocaleDateString()}` : ''}
          </p>
          {linkedAssets.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {linkedAssets.map((asset) => (
                <Link key={asset.id} to="/data-management" onClick={(e) => e.stopPropagation()}>
                  <Badge variant="secondary" className="text-[10px]">{asset.name}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {a.score > 0 && <span className={cn('text-sm tabular-nums font-semibold', a.score >= 80 ? 'text-emerald-600' : a.score >= 50 ? 'text-amber-600' : 'text-destructive')}>{a.score}%</span>}
          <Badge variant={a.status === 'completed' ? 'secondary' : a.status === 'in_progress' ? 'default' : 'outline'}>
            {a.status === 'in_progress' ? 'In Progress' : a.status === 'completed' ? 'Completed' : 'Not Started'}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Assessments() {
  const assessments = useLiveQuery(() => db.assessments.toArray(), []);
  const nav = useNavigate();
  const byType = (t: AssessmentType) => assessments?.filter(a => a.type === t) ?? [];

  const renderList = (list: Assessment[]) => {
    const act = list.filter(a => a.status !== 'completed');
    const comp = list.filter(a => a.status === 'completed');
    if (list.length === 0) return <EmptyState icon={ClipboardCheck} title="No assessments yet" description="Create a privacy, risk, or security assessment to begin tracking work." className="py-12" />;
    return (
      <div className="space-y-6">
        {act.length > 0 && <div className="space-y-3"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>{act.map(a => <ACard key={a.id} a={a} onClick={() => nav(`/assessments/${a.id}`)} />)}</div>}
        {comp.length > 0 && <div className="space-y-3"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</p>{comp.map(a => <ACard key={a.id} a={a} onClick={() => nav(`/assessments/${a.id}`)} />)}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Assessments</h1><p className="text-sm text-muted-foreground mt-1">Privacy impact, risk, and security assessments.</p></div>
        <NewDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(['pia', 'risk_assessment', 'security_checklist'] as AssessmentType[]).map(type => {
          const list = byType(type); const comp = list.filter(a => a.status === 'completed').length;
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{TYPE_SHORT[type]}</p>
                <p className="text-2xl font-semibold tabular-nums">{comp}<span className="text-sm text-muted-foreground font-normal">/{list.length}</span></p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({assessments?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="pia">PIA ({byType('pia').length})</TabsTrigger>
          <TabsTrigger value="risk">Risk ({byType('risk_assessment').length})</TabsTrigger>
          <TabsTrigger value="security">Security ({byType('security_checklist').length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">{renderList(assessments ?? [])}</TabsContent>
        <TabsContent value="pia" className="mt-6">{renderList(byType('pia'))}</TabsContent>
        <TabsContent value="risk" className="mt-6">{renderList(byType('risk_assessment'))}</TabsContent>
        <TabsContent value="security" className="mt-6">{renderList(byType('security_checklist'))}</TabsContent>
      </Tabs>
    </div>
  );
}
