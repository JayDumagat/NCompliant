import { useState, useEffect } from 'react';
import { db } from '@/db/db';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Check, FileText, Shield, Scale, AlertTriangle, Laptop, Umbrella, LayoutTemplate, SquarePen, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DataAssetPicker } from '@/components/DataAssetPicker';

const STEPS = ['Basic Info', 'Purpose & Scope', 'Requirements', 'Review Schedule', 'Review'];
const SESSION_KEY = 'ncompliant-policy-wizard';

const POLICY_TEMPLATES = [
  { icon: Shield, title: 'Data Privacy Policy', category: 'Data Privacy', color: 'bg-blue-500/10 text-blue-600',
    purpose: 'To establish guidelines for the collection, processing, storage, and disposal of personal data in compliance with Republic Act No. 10173 (Data Privacy Act of 2012) and its Implementing Rules and Regulations.',
    scope: 'This policy applies to all employees, contractors, and third-party personnel who collect, process, or have access to personal data within the organization.',
    requirements: 'Obtain valid consent before processing personal data\nImplement appropriate security measures for data protection\nMaintain records of processing activities\nConduct Privacy Impact Assessments for new processing activities\nEstablish and maintain breach notification procedures\nAppoint a Data Protection Officer\nEnsure data subject rights are operationally supported' },
  { icon: Laptop, title: 'Information Security Policy', category: 'Information Security', color: 'bg-emerald-500/10 text-emerald-600',
    purpose: 'To protect the confidentiality, integrity, and availability of the organization\'s information assets against all threats, whether internal, external, deliberate, or accidental.',
    scope: 'This policy applies to all information assets owned or managed by the organization, including hardware, software, networks, data, and personnel.',
    requirements: 'Implement access controls based on least privilege\nEncrypt sensitive data at rest and in transit\nConduct regular vulnerability assessments\nMaintain an incident response plan\nEnsure all systems are patched within defined SLAs\nConduct annual security awareness training\nImplement multi-factor authentication for privileged access' },
  { icon: Scale, title: 'Anti-Money Laundering Policy', category: 'AML/CFT', color: 'bg-purple-500/10 text-purple-600',
    purpose: 'To prevent the use of the organization\'s products and services for money laundering, terrorist financing, or other financial crimes, in compliance with the Anti-Money Laundering Act (RA 9160) as amended.',
    scope: 'This policy applies to all business units, employees, and agents involved in customer onboarding, transaction processing, and account management.',
    requirements: 'Implement Customer Due Diligence (CDD) procedures\nConduct Enhanced Due Diligence for high-risk customers\nMonitor transactions for suspicious activity\nFile Suspicious Transaction Reports (STRs) as required\nMaintain records for at least five years\nConduct regular AML training for relevant staff\nDesignate a Compliance Officer' },
  { icon: FileText, title: 'Acceptable Use Policy', category: 'IT Governance', color: 'bg-cyan-500/10 text-cyan-600',
    purpose: 'To define acceptable and unacceptable use of the organization\'s information technology resources, including computers, networks, email, and internet access.',
    scope: 'This policy applies to all employees, contractors, and authorized users of the organization\'s IT resources.',
    requirements: 'Use IT resources only for authorized business purposes\nDo not install unauthorized software on company devices\nProtect login credentials and do not share accounts\nReport suspected security incidents immediately\nComply with software licensing agreements\nDo not access inappropriate or illegal content\nSecure mobile devices used for work purposes' },
  { icon: AlertTriangle, title: 'Incident Response Policy', category: 'Information Security', color: 'bg-orange-500/10 text-orange-600',
    purpose: 'To establish a structured approach for detecting, responding to, and recovering from information security incidents to minimize impact on operations and data.',
    scope: 'This policy applies to all information security incidents affecting the organization\'s systems, data, or operations.',
    requirements: 'Define incident classification and severity levels\nEstablish an Incident Response Team with clear roles\nDocument incident response procedures for each severity level\nConduct post-incident reviews for all major incidents\nNotify affected parties and regulators within required timeframes\nMaintain an incident log with details and actions taken\nTest incident response procedures at least annually' },
  { icon: Umbrella, title: 'Business Continuity Policy', category: 'Business Continuity', color: 'bg-amber-500/10 text-amber-600',
    purpose: 'To ensure the organization can continue critical business operations during and after a disruption, minimizing impact on stakeholders and ensuring timely recovery.',
    scope: 'This policy applies to all critical business processes, supporting IT systems, and personnel essential for maintaining operations during a disruption.',
    requirements: 'Identify and prioritize critical business processes\nDefine Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)\nMaintain and test business continuity plans annually\nEstablish alternate work arrangements for key personnel\nEnsure data backup and recovery procedures are tested\nConduct business impact analysis for new processes\nCommunicate continuity plans to all relevant stakeholders' },
];

interface WizardState {
  title: string; category: string; owner: string; department: string; tags: string;
  dataAssetIds: string[];
  purpose: string; scope: string; content: string; requirements: string;
  reviewFrequency: string; nextReviewDate: string;
}
const emptyState: WizardState = { title: '', category: '', owner: '', department: '', tags: '', dataAssetIds: [], purpose: '', scope: '', content: '', requirements: '', reviewFrequency: 'none', nextReviewDate: '' };

function loadSession(): { step: number; form: WizardState } | null {
  try { const r = sessionStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export function PolicyWizard() {
  const saved = loadSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'choose' | 'templates' | 'form'>(saved ? 'form' : 'choose');
  const [entryMode, setEntryMode] = useState<'templates' | 'manual'>('manual');
  const [step, setStep] = useState(saved?.step ?? 0);
  const [f, setF] = useState<WizardState>(saved?.form ?? { ...emptyState });
  const [hasSaved] = useState(!!saved);

  useEffect(() => { if (open) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step, form: f })); }, [open, step, f]);

  const canNext = (): boolean => {
    if (step === 0) return !!(f.title && f.category && f.owner);
    if (step === 1) return !!(f.purpose || f.scope || f.content);
    return true;
  };

  const save = async () => {
    const now = Date.now();
    await db.policies.add({
      id: crypto.randomUUID(), workspaceId: 'ws-default', title: f.title, status: 'draft',
      category: f.category, owner: f.owner, department: f.department,
      dataAssetIds: f.dataAssetIds,
      purpose: f.purpose, scope: f.scope,
      content: f.content || `${f.purpose}\n\n${f.scope}\n\n${f.requirements}`.trim(),
      requirements: f.requirements,
      reviewFrequency: (f.reviewFrequency as 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'none') || 'none',
      nextReviewDate: f.nextReviewDate ? new Date(f.nextReviewDate).getTime() : undefined,
      lastUpdated: now, createdAt: now,
      tags: f.tags.split(',').map((s) => s.trim()).filter(Boolean), versions: [],
    });
    toast.success('Policy created'); reset();
  };

  const reset = () => { setOpen(false); setStep(0); setMode('choose'); setEntryMode('manual'); setF({ ...emptyState }); sessionStorage.removeItem(SESSION_KEY); };

  const handleOpen = (v: boolean) => {
    if (v) {
      const s = loadSession();
      if (s) {
        setStep(s.step);
        setF(s.form);
        setMode('form');
      } else {
        setMode('choose');
        setEntryMode('manual');
        setStep(0);
        setF({ ...emptyState });
      }
      setOpen(true);
    } else reset();
  };

  const pickTemplate = (tpl: typeof POLICY_TEMPLATES[0]) => {
    setF({ ...emptyState, title: tpl.title, category: tpl.category, purpose: tpl.purpose, scope: tpl.scope, requirements: tpl.requirements });
    setEntryMode('templates');
    setStep(0);
    setMode('form');
  };

  const startManual = () => {
    setF({ ...emptyState });
    setStep(0);
    setEntryMode('manual');
    setMode('form');
  };

  const startTemplates = () => {
    setF({ ...emptyState });
    setStep(0);
    setEntryMode('templates');
    setMode('templates');
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ title: f.title, category: f.category, owner: f.owner, department: f.department, purpose: f.purpose, scope: f.scope, content: f.content, requirements: f.requirements, reviewFrequency: f.reviewFrequency, dataAssetIds: f.dataAssetIds, tags: f.tags.split(',').map(s => s.trim()).filter(Boolean) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `policy-${f.title.toLowerCase().replace(/\s+/g, '-') || 'draft'}.json`; a.click();
    URL.revokeObjectURL(url); toast.success('Exported as JSON');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />New Policy
          {hasSaved && <Badge variant="secondary" className="ml-1 text-xs">Draft</Badge>}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(100vw-1rem,1440px)] max-w-none h-[calc(100vh-1rem)] overflow-hidden p-0 sm:rounded-2xl">
        <div className="grid h-full min-h-0 lg:grid-cols-[260px_1fr]">
          <aside className="hidden min-h-0 flex-col border-r border-border/30 bg-background/80 p-5 lg:flex">
            <div className="space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">Create Policy</p>
                <p className="text-sm text-muted-foreground">Use a starter or build from scratch in a full-screen, step-by-step editor.</p>
              </div>
            </div>

            {mode === 'form' ? (
              <div className="mt-8 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Progress</p>
                <div className="space-y-1">
                  {STEPS.map((label, index) => {
                    const active = index === step;
                    const complete = index < step;
                    return (
                      <button key={label} onClick={() => complete && setStep(index)} className={cn('flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors', active ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-accent/20', !complete && 'opacity-75')}>
                        <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ring-1 ring-inset', complete ? 'bg-foreground text-background ring-foreground/10' : active ? 'bg-primary/10 text-primary ring-primary/20' : 'bg-muted text-muted-foreground ring-border/70')}>
                          {complete ? <Check className="h-4 w-4" /> : index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{index === 0 ? 'Basic details' : index === 1 ? 'Policy language' : index === 2 ? 'Controls' : index === 3 ? 'Schedule' : 'Final review'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-8 border-l border-border/30 pl-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Full screen editor</p>
                <p className="mt-2 leading-relaxed">Select a starter or manual mode, then complete the policy in a focused workflow with the form on the right.</p>
              </div>
            )}
          </aside>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 lg:px-8">
              <div>
                <p className="text-sm text-muted-foreground">Policy Builder</p>
                <h2 className="text-lg font-semibold tracking-tight">
                  {mode === 'choose' ? 'Choose creation mode' : mode === 'templates' ? 'Pick a starter' : `Step ${step + 1} of ${STEPS.length}`}
                </h2>
              </div>
              <div />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
              {mode === 'choose' ? (
                <div className="mx-auto grid w-full max-w-5xl gap-4 py-8 sm:grid-cols-2">
                  <button onClick={startTemplates} className="group flex min-h-[180px] flex-col items-start justify-between gap-6 rounded-2xl border border-border/30 bg-background/90 p-5 text-left transition-all hover:border-primary/40 hover:bg-accent/10">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                      <LayoutTemplate className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-lg font-semibold tracking-tight">Use Templates</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">Start from a policy starter and customize it step by step.</p>
                    </div>
                  </button>
                  <button onClick={startManual} className="group flex min-h-[180px] flex-col items-start justify-between gap-6 rounded-2xl border border-border/30 bg-background/90 p-5 text-left transition-all hover:border-primary/40 hover:bg-accent/10">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105">
                      <SquarePen className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-lg font-semibold tracking-tight">Input Manually</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">Jump straight into the policy form with the stepper on the left.</p>
                    </div>
                  </button>
                </div>
              ) : mode === 'templates' ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Choose a starter</p>
                      <p className="text-base font-medium">Pick a template or switch to manual input.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setMode('choose')}><ChevronLeft className="h-4 w-4" />Back</Button>
                      <Button onClick={startManual}>Manual Input</Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {POLICY_TEMPLATES.map((tpl) => (
                      <button key={tpl.title} onClick={() => pickTemplate(tpl)} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background p-4 text-left transition-colors hover:bg-accent/15">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5', tpl.color)}>
                          <tpl.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{tpl.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{tpl.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="space-y-6">
                    {step === 0 && (
                      <div className="space-y-6">
                        <div className="space-y-2"><Label htmlFor="policy-title">Title *</Label><Input id="policy-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g., Data Privacy Policy" /></div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2"><Label htmlFor="policy-category">Category *</Label>
                            <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                              <SelectTrigger id="policy-category"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent><SelectItem value="Privacy">Privacy</SelectItem><SelectItem value="Security">Security</SelectItem><SelectItem value="Compliance">Compliance</SelectItem><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Risk Management">Risk Management</SelectItem></SelectContent>
                            </Select></div>
                          <div className="space-y-2"><Label htmlFor="policy-owner">Owner *</Label><Input id="policy-owner" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} placeholder="Legal Team" /></div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2"><Label htmlFor="policy-department">Department</Label><Input id="policy-department" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} placeholder="Legal" /></div>
                          <div className="space-y-2"><Label htmlFor="policy-tags">Tags (comma separated)</Label><Input id="policy-tags" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="privacy, NPC" /></div>
                        </div>
                        <DataAssetPicker value={f.dataAssetIds} onChange={(dataAssetIds) => setF({ ...f, dataAssetIds })} />
                      </div>
                    )}

                    {step === 1 && (
                      <div className="space-y-6">
                        <div className="space-y-2"><Label htmlFor="policy-purpose">Purpose</Label><Textarea id="policy-purpose" className="min-h-[120px]" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} placeholder="What is the objective of this policy?" /></div>
                          <div className="space-y-2"><Label htmlFor="policy-scope">Scope</Label><Textarea id="policy-scope" className="min-h-[100px]" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} placeholder="Who and what does this policy cover?" /></div>
                          <div className="space-y-2"><Label htmlFor="policy-content">Full Content</Label><Textarea id="policy-content" className="min-h-[120px]" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="Detailed policy content..." /></div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="policy-requirements">Requirements & Controls</Label>
                          <p className="text-sm text-muted-foreground">List key requirements, one per line.</p>
                          <Textarea id="policy-requirements" className="min-h-[260px] font-mono" value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })}
                            placeholder={"Obtain explicit consent before processing\nImplement appropriate security measures\nReport breaches within 72 hours\nAppoint a Data Protection Officer"} />
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <div className="space-y-2"><Label htmlFor="policy-reviewFrequency">Review Frequency</Label>
                          <Select value={f.reviewFrequency} onValueChange={(v) => setF({ ...f, reviewFrequency: v })}>
                            <SelectTrigger id="policy-reviewFrequency"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="none">No schedule</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="semi_annual">Semi-Annual</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent>
                          </Select></div>
                        <div className="space-y-2"><Label htmlFor="policy-nextReviewDate">Next Review Date</Label><Input id="policy-nextReviewDate" type="date" value={f.nextReviewDate} onChange={(e) => setF({ ...f, nextReviewDate: e.target.value })} /></div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          {[
                            { label: 'Title', value: f.title },
                            { label: 'Category', value: f.category },
                            { label: 'Owner', value: f.owner },
                            { label: 'Department', value: f.department || '—' },
                            { label: 'Tags', value: f.tags || '—' },
                            { label: 'Linked Data Assets', value: f.dataAssetIds.length ? `${f.dataAssetIds.length} linked` : '—' },
                            { label: 'Review', value: f.reviewFrequency === 'none' ? 'No schedule' : f.reviewFrequency.replace('_', '-') },
                            { label: 'Content', value: `${(f.content || f.purpose || '').length} characters` },
                            { label: 'Requirements', value: f.requirements ? `${f.requirements.split('\n').filter(Boolean).length} items` : '—' },
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
                      {step === 0
                        ? <Button variant="outline" onClick={() => setMode(entryMode === 'templates' ? 'templates' : 'choose')}><ChevronLeft className="h-4 w-4" />{entryMode === 'templates' ? 'Templates' : 'Options'}</Button>
                        : <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))}>Back</Button>}
                      {step === 4 && <Button variant="outline" onClick={exportJSON}>Export JSON</Button>}
                    </div>
                    {step === 4
                      ? <Button onClick={save} disabled={!canNext()}>Create Policy</Button>
                      : <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>Continue</Button>
                    }
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
