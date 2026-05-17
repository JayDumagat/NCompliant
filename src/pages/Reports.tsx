import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Report, type ReportSnapshot } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Plus, Download, FileText, Trash2, BarChart3 } from 'lucide-react';
import { exportReportPDF } from '@/lib/exportPdf';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const TPL_LABEL: Record<string, string> = { compliance_summary: 'Compliance Summary', risk_assessment: 'Risk Assessment', training_compliance: 'Training Compliance', incident_summary: 'Incident Summary', regulatory_submission: 'Regulatory Submission' };
const PERIOD_LABEL: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual', custom: 'Custom' };

async function generateSnapshot(): Promise<ReportSnapshot> {
  const policies = await db.policies.toArray();
  const tasks = await db.tasks.toArray();
  const assessments = await db.assessments.toArray();
  const incidents = await db.incidents.toArray();
  const training = await db.trainingRecords.toArray();
  const now = Date.now();
  const completedTraining = training.filter(t => t.status === 'completed' && (!t.expirationDate || t.expirationDate > now)).length;
  return {
    totalPolicies: policies.length,
    activePolicies: policies.filter(p => p.status === 'active').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    overdueTasks: tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < now).length,
    totalAssessments: assessments.length,
    completedAssessments: assessments.filter(a => a.status === 'completed').length,
    highRiskAssessments: assessments.filter(a => a.riskLevel === 'high').length,
    openIncidents: incidents.filter(i => i.status === 'open' || i.status === 'investigating').length,
    trainingCompliance: training.length > 0 ? Math.round((completedTraining / training.length) * 100) : 0,
  };
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-6 w-full rounded bg-muted/50 overflow-hidden">
      <div className={cn('h-full rounded transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function GenerateDialog() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ template: 'compliance_summary' as Report['template'], type: 'internal' as Report['type'], period: 'quarterly' as Report['period'], notes: '' });

  const generate = async () => {
    const data = await generateSnapshot();
    await db.reports.add({
      id: crypto.randomUUID(), workspaceId: 'ws-default', title: `${TPL_LABEL[f.template]} — ${PERIOD_LABEL[f.period]}`,
      type: f.type, template: f.template, period: f.period, data, notes: f.notes, status: 'draft', generatedAt: Date.now(),
    });
    toast.success('Report generated');
    setOpen(false); setF({ template: 'compliance_summary', type: 'internal', period: 'quarterly', notes: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Generate Report</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Generate Report</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Template</Label>
            <Select value={f.template} onValueChange={v => setF({ ...f, template: v as Report['template'] })}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(TPL_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Type</Label>
              <Select value={f.type} onValueChange={v => setF({ ...f, type: v as Report['type'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="internal">Internal</SelectItem><SelectItem value="regulatory">Regulatory</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Period</Label>
              <Select value={f.period} onValueChange={v => setF({ ...f, period: v as Report['period'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PERIOD_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea className="min-h-[60px]" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Optional notes..." /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={generate}>Generate</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportCard({ report }: { report: Report }) {
  const d = report.data;
  const policyPct = d.totalPolicies > 0 ? Math.round((d.activePolicies / d.totalPolicies) * 100) : 0;
  const taskPct = d.totalTasks > 0 ? Math.round((d.completedTasks / d.totalTasks) * 100) : 0;
  const assessPct = d.totalAssessments > 0 ? Math.round((d.completedAssessments / d.totalAssessments) * 100) : 0;

  const finalize = async () => { await db.reports.update(report.id, { status: 'final' }); toast.success('Report finalized'); };
  const del = async () => { await db.reports.delete(report.id); toast.success('Report deleted'); };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `report-${report.title.toLowerCase().replace(/\s+/g, '-')}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-base">{report.title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{new Date(report.generatedAt).toLocaleDateString()} · {report.type === 'regulatory' ? 'Regulatory' : 'Internal'}</p>
        </div>
        <Badge variant={report.status === 'final' ? 'default' : 'secondary'}>{report.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Policy Coverage', value: `${policyPct}%`, sub: `${d.activePolicies}/${d.totalPolicies}` },
            { label: 'Task Completion', value: `${taskPct}%`, sub: `${d.completedTasks}/${d.totalTasks}` },
            { label: 'Assessments', value: `${assessPct}%`, sub: `${d.completedAssessments}/${d.totalAssessments}` },
            { label: 'Training', value: `${d.trainingCompliance}%`, sub: `compliance rate` },
          ].map(m => (
            <div key={m.label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-lg font-semibold tabular-nums">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { label: 'Policies', val: d.activePolicies, max: d.totalPolicies, clr: 'bg-primary' },
            { label: 'Tasks', val: d.completedTasks, max: d.totalTasks, clr: 'bg-emerald-500' },
            { label: 'Assessments', val: d.completedAssessments, max: d.totalAssessments, clr: 'bg-amber-500' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20">{b.label}</span>
              <MiniBar value={b.val} max={b.max} color={b.clr} />
              <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{b.val}/{b.max}</span>
            </div>
          ))}
        </div>
        {(d.overdueTasks > 0 || d.openIncidents > 0 || d.highRiskAssessments > 0) && (
          <div className="flex flex-wrap gap-2">
            {d.overdueTasks > 0 && <Badge variant="destructive">{d.overdueTasks} overdue tasks</Badge>}
            {d.openIncidents > 0 && <Badge variant="destructive">{d.openIncidents} open incidents</Badge>}
            {d.highRiskAssessments > 0 && <Badge variant="outline">{d.highRiskAssessments} high risk</Badge>}
          </div>
        )}
        {report.notes && <p className="text-sm text-muted-foreground">{report.notes}</p>}
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportReportPDF(report)}><FileText className="h-3.5 w-3.5" />PDF</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportJSON}><Download className="h-3.5 w-3.5" />JSON</Button>
          {report.status === 'draft' && <Button size="sm" className="gap-1.5" onClick={finalize}><FileText className="h-3.5 w-3.5" />Finalize</Button>}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-1.5" onClick={del}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const reports = useLiveQuery(() => db.reports.toArray(), []);
  const sorted = reports?.sort((a, b) => b.generatedAt - a.generatedAt) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-generate compliance reports from live data.</p>
        </div>
        <GenerateDialog />
      </div>

      <div className="space-y-4">
        {sorted.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No reports yet. Generate one to get started.</p>
          </CardContent></Card>
        ) : sorted.map(r => <ReportCard key={r.id} report={r} />)}
      </div>
    </div>
  );
}
