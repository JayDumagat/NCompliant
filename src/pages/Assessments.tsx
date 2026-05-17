import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Assessment, type AssessmentType } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShieldAlert, ChevronRight, ClipboardCheck, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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

function NewDialog() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'template' | 'form'>('template');
  const [f, setF] = useState({ type: 'pia' as AssessmentType, title: '', description: '', dataTypes: '', processingPurpose: '', dataSubjects: '', assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '' });

  const pickTemplate = (tpl: typeof TEMPLATES[0]) => {
    setF({ type: tpl.type, title: tpl.title, description: tpl.description, dataTypes: (tpl as any).dataTypes || '', processingPurpose: (tpl as any).processingPurpose || '', dataSubjects: (tpl as any).dataSubjects || '', assetsCovered: (tpl as any).assetsCovered || '', threatSources: (tpl as any).threatSources || '', systemsInScope: (tpl as any).systemsInScope || '', frameworkRef: (tpl as any).frameworkRef || '' });
    setStep('form');
  };

  const save = async () => {
    const id = crypto.randomUUID();
    await db.assessments.add({ id, workspaceId: 'ws-default', type: f.type, title: f.title, description: f.description, status: 'not_started', riskLevel: 'unassessed', dataTypes: f.dataTypes.split(',').map(s => s.trim()).filter(Boolean), processingPurpose: f.processingPurpose, dataSubjects: f.dataSubjects, assetsCovered: f.assetsCovered, threatSources: f.threatSources, systemsInScope: f.systemsInScope, frameworkRef: f.frameworkRef, answers: [], findings: '', recommendations: '', score: 0, createdAt: Date.now(), versions: [] });
    toast.success('Assessment created'); setOpen(false); setStep('template'); nav(`/assessments/${id}`);
  };

  const reset = () => { setOpen(false); setStep('template'); setF({ type: 'pia', title: '', description: '', dataTypes: '', processingPurpose: '', dataSubjects: '', assetsCovered: '', threatSources: '', systemsInScope: '', frameworkRef: '' }); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else setOpen(true); }}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New Assessment</Button></DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{step === 'template' ? 'Start Assessment' : 'Assessment Details'}</DialogTitle></DialogHeader>

        {step === 'template' ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Choose a template or start from scratch.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TEMPLATES.map(tpl => {
                const Icon = TYPE_ICONS[tpl.type];
                return (
                  <button key={tpl.id} onClick={() => pickTemplate(tpl)} className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/50 transition-colors">
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md mt-0.5', tpl.type === 'pia' ? 'bg-blue-500/10 text-blue-600' : tpl.type === 'risk_assessment' ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0"><p className="text-sm font-medium leading-tight">{tpl.title}</p><p className="text-xs text-muted-foreground mt-0.5">{TYPE_SHORT[tpl.type]}</p></div>
                  </button>
                );
              })}
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={() => setStep('form')}><Plus className="h-4 w-4" />Start from Scratch</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Type</Label>
                <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as AssessmentType })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pia">Privacy Impact Assessment</SelectItem><SelectItem value="risk_assessment">Risk Assessment</SelectItem><SelectItem value="security_checklist">Security Checklist</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Title</Label><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Assessment title" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea className="min-h-[80px]" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
              {f.type === 'pia' && <>
                <div className="space-y-2"><Label>Data types (comma separated)</Label><Input value={f.dataTypes} onChange={e => setF({ ...f, dataTypes: e.target.value })} /></div>
                <div className="space-y-2"><Label>Processing purpose</Label><Input value={f.processingPurpose} onChange={e => setF({ ...f, processingPurpose: e.target.value })} /></div>
                <div className="space-y-2"><Label>Data subjects</Label><Input value={f.dataSubjects} onChange={e => setF({ ...f, dataSubjects: e.target.value })} /></div>
              </>}
              {f.type === 'risk_assessment' && <>
                <div className="space-y-2"><Label>Assets covered</Label><Input value={f.assetsCovered} onChange={e => setF({ ...f, assetsCovered: e.target.value })} /></div>
                <div className="space-y-2"><Label>Threat sources</Label><Input value={f.threatSources} onChange={e => setF({ ...f, threatSources: e.target.value })} /></div>
              </>}
              {f.type === 'security_checklist' && <>
                <div className="space-y-2"><Label>Systems in scope</Label><Input value={f.systemsInScope} onChange={e => setF({ ...f, systemsInScope: e.target.value })} /></div>
                <div className="space-y-2"><Label>Framework reference</Label><Input value={f.frameworkRef} onChange={e => setF({ ...f, frameworkRef: e.target.value })} /></div>
              </>}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep('template')}>← Templates</Button>
              <div className="flex gap-2"><Button variant="outline" onClick={reset}>Cancel</Button><Button onClick={save} disabled={!f.title}>Create</Button></div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ACard({ a, onClick }: { a: Assessment; onClick: () => void }) {
  const Icon = TYPE_ICONS[a.type];
  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onClick}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', RISK_CLR[a.riskLevel])}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{a.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {TYPE_SHORT[a.type]}{a.completedAt ? ` · Completed ${new Date(a.completedAt).toLocaleDateString()}` : ''}
          </p>
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
    if (list.length === 0) return <Card><CardContent className="py-12 text-center text-muted-foreground">No assessments yet.</CardContent></Card>;
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
