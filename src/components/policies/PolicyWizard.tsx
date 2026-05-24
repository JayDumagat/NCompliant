import { useState, useEffect } from 'react';
import { db } from '@/db/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Check, FileText, Shield, Scale, AlertTriangle, Laptop, Umbrella } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  purpose: string; scope: string; content: string; requirements: string;
  reviewFrequency: string; nextReviewDate: string;
}
const emptyState: WizardState = { title: '', category: '', owner: '', department: '', tags: '', purpose: '', scope: '', content: '', requirements: '', reviewFrequency: 'none', nextReviewDate: '' };

function loadSession(): { step: number; form: WizardState } | null {
  try { const r = sessionStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export function PolicyWizard() {
  const saved = loadSession();
  const [open, setOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
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

  const reset = () => { setOpen(false); setStep(0); setShowTemplates(true); setF({ ...emptyState }); sessionStorage.removeItem(SESSION_KEY); };

  const handleOpen = (v: boolean) => {
    if (v) { const s = loadSession(); if (s) { setStep(s.step); setShowTemplates(false); setF(s.form); } setOpen(true); } else reset();
  };

  const pickTemplate = (tpl: typeof POLICY_TEMPLATES[0]) => {
    setF({ ...emptyState, title: tpl.title, category: tpl.category, purpose: tpl.purpose, scope: tpl.scope, requirements: tpl.requirements });
    setShowTemplates(false);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ title: f.title, category: f.category, owner: f.owner, department: f.department, purpose: f.purpose, scope: f.scope, content: f.content, requirements: f.requirements, reviewFrequency: f.reviewFrequency, tags: f.tags.split(',').map(s => s.trim()).filter(Boolean) }, null, 2)], { type: 'application/json' });
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
      <DialogContent className="sm:max-w-xl">
        {showTemplates ? (
          <>
            <DialogHeader><DialogTitle>Create Policy</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Choose a template or start from scratch.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {POLICY_TEMPLATES.map(tpl => (
                  <button key={tpl.title} onClick={() => pickTemplate(tpl)} className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/50 transition-colors">
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md mt-0.5', tpl.color)}>
                      <tpl.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0"><p className="text-sm font-medium leading-tight">{tpl.title}</p><p className="text-xs text-muted-foreground mt-0.5">{tpl.category}</p></div>
                  </button>
                ))}
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowTemplates(false)}><Plus className="h-4 w-4" />Start from Scratch</Button>
            </div>
          </>
        ) : (
          <>
        <DialogHeader><DialogTitle>Create Policy</DialogTitle></DialogHeader>

        {/* Step indicator */}
        <div className="space-y-3">
          <div className="flex justify-between">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i < step && setStep(i)}
                className={`text-sm transition-colors flex items-center gap-1.5 ${i <= step ? 'font-medium text-foreground' : 'text-muted-foreground'} ${i < step ? 'cursor-pointer hover:text-primary' : 'cursor-default'}`}>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'}`}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            ))}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        </div>

        <div className="min-h-[240px] py-2">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g., Data Privacy Policy" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category *</Label>
                  <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="Privacy">Privacy</SelectItem><SelectItem value="Security">Security</SelectItem><SelectItem value="Compliance">Compliance</SelectItem><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Risk Management">Risk Management</SelectItem></SelectContent>
                  </Select></div>
                <div className="space-y-2"><Label>Owner *</Label><Input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} placeholder="Legal Team" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Department</Label><Input value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} placeholder="Legal" /></div>
                <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="privacy, NPC" /></div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Purpose</Label><Textarea className="min-h-[100px]" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} placeholder="What is the objective of this policy?" /></div>
              <div className="space-y-2"><Label>Scope</Label><Textarea className="min-h-[80px]" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} placeholder="Who and what does this policy cover?" /></div>
              <div className="space-y-2"><Label>Full Content</Label><Textarea className="min-h-[100px]" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="Detailed policy content..." /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Requirements & Controls</Label>
                <p className="text-sm text-muted-foreground">List key requirements, one per line.</p>
                <Textarea className="min-h-[220px] font-mono" value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })}
                  placeholder={"Obtain explicit consent before processing\nImplement appropriate security measures\nReport breaches within 72 hours\nAppoint a Data Protection Officer"} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Review Frequency</Label>
                <Select value={f.reviewFrequency} onValueChange={(v) => setF({ ...f, reviewFrequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No schedule</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="semi_annual">Semi-Annual</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-2"><Label>Next Review Date</Label><Input type="date" value={f.nextReviewDate} onChange={(e) => setF({ ...f, nextReviewDate: e.target.value })} /></div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-5 space-y-3">
                {[
                  { label: 'Title', value: f.title },
                  { label: 'Category', value: f.category },
                  { label: 'Owner', value: f.owner },
                  { label: 'Department', value: f.department || '—' },
                  { label: 'Tags', value: f.tags || '—' },
                  { label: 'Review', value: f.reviewFrequency === 'none' ? 'No schedule' : f.reviewFrequency.replace('_', '-') },
                  { label: 'Content', value: `${(f.content || f.purpose || '').length} characters` },
                  { label: 'Requirements', value: f.requirements ? `${f.requirements.split('\n').filter(Boolean).length} items` : '—' },
                ].map((row, i) => (
                  <div key={row.label}>
                    {i > 0 && <Separator className="mb-3" />}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="text-sm font-medium text-right max-w-[250px] truncate">{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <div className="flex gap-2">
            {step === 0 ? <Button variant="ghost" onClick={() => setShowTemplates(true)}>← Templates</Button> : <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))}>Back</Button>}
            {step === 4 && <Button variant="outline" onClick={exportJSON}>Export JSON</Button>}
          </div>
          {step === 4
            ? <Button onClick={save} disabled={!canNext()}>Create Policy</Button>
            : <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>Continue</Button>
          }
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
