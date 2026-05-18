import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Assessment, type AssessmentAnswer, type AssessmentType } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportAssessmentPDF } from '@/lib/exportPdf';
import { diffTokens } from '@/lib/wordDiff';

const PIA_QS = [
  { id: 'q1', text: 'Is explicit consent obtained from data subjects?', cat: 'Consent' },
  { id: 'q2', text: 'Is personal data encrypted at rest and in transit?', cat: 'Security' },
  { id: 'q3', text: 'Is there a defined data retention and disposal schedule?', cat: 'Retention' },
  { id: 'q4', text: 'Are access controls implemented to limit exposure?', cat: 'Access' },
  { id: 'q5', text: 'Has a DPIA been conducted?', cat: 'Assessment' },
  { id: 'q6', text: 'Are data processing agreements in place with third parties?', cat: 'Third Party' },
  { id: 'q7', text: 'Is there a breach notification procedure?', cat: 'Incident' },
  { id: 'q8', text: 'Are data subject rights supported?', cat: 'Rights' },
  { id: 'q9', text: 'Is staff trained on data protection?', cat: 'Training' },
  { id: 'q10', text: 'Is processing lawful with a valid legal basis?', cat: 'Legal' },
];
const RISK_QS = [
  { id: 'rq1', text: 'Have all critical assets been identified and inventoried?', cat: 'Asset Inventory' },
  { id: 'rq2', text: 'Has a threat model been documented?', cat: 'Threat Modeling' },
  { id: 'rq3', text: 'Is there a formal risk register maintained?', cat: 'Risk Register' },
  { id: 'rq4', text: 'Are risk mitigation controls documented?', cat: 'Controls' },
  { id: 'rq5', text: 'Is there a risk acceptance process?', cat: 'Governance' },
  { id: 'rq6', text: 'Are residual risks monitored and reviewed?', cat: 'Monitoring' },
  { id: 'rq7', text: 'Is there business continuity planning?', cat: 'BCP' },
  { id: 'rq8', text: 'Are vulnerabilities regularly assessed?', cat: 'Vulnerability' },
];
const SEC_QS = [
  { id: 'sq1', text: 'Are firewalls and network segmentation in place?', cat: 'Network' },
  { id: 'sq2', text: 'Is multi-factor authentication enforced?', cat: 'Authentication' },
  { id: 'sq3', text: 'Are security patches applied within SLA?', cat: 'Patch Mgmt' },
  { id: 'sq4', text: 'Is endpoint protection deployed on all devices?', cat: 'Endpoint' },
  { id: 'sq5', text: 'Are logs centrally collected and monitored?', cat: 'Logging' },
  { id: 'sq6', text: 'Is there an incident response plan?', cat: 'IR' },
  { id: 'sq7', text: 'Are backups tested regularly?', cat: 'Backup' },
  { id: 'sq8', text: 'Is physical security adequate?', cat: 'Physical' },
  { id: 'sq9', text: 'Is security awareness training conducted?', cat: 'Training' },
];
const QS_MAP: Record<AssessmentType, { id: string; text: string; cat: string }[]> = { pia: PIA_QS, risk_assessment: RISK_QS, security_checklist: SEC_QS };

type AssessmentSnapshot = {
  version: number;
  score: number;
  riskLevel: Assessment['riskLevel'];
  completedAt: number;
  note: string;
  findings?: string;
  recommendations?: string;
  answers?: AssessmentAnswer[];
};

function calcScore(answers: AssessmentAnswer[]): number {
  if (!answers.length) return 0;
  const pts = answers.reduce((s, a) => s + (a.answer === 'yes' ? 10 : a.answer === 'partial' ? 5 : a.answer === 'na' ? 10 : 0), 0);
  return Math.round((pts / (answers.length * 10)) * 100);
}
function calcRisk(score: number): Assessment['riskLevel'] {
  if (score === 0) return 'unassessed'; return score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high';
}

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const assessment = useLiveQuery(() => (id ? db.assessments.get(id) : undefined), [id]);
  const [answers, setAnswers] = useState<AssessmentAnswer[] | null>(null);
  const [findings, setFindings] = useState('');
  const [recs, setRecs] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [leftVersion, setLeftVersion] = useState('1');
  const [rightVersion, setRightVersion] = useState('2');

  if (!assessment) return <div className="py-16 text-center text-muted-foreground">Assessment not found. <button onClick={() => nav('/assessments')} className="underline">Back</button></div>;

  const questions = QS_MAP[assessment.type];
  if (answers === null) {
    const init = questions.map(q => { const e = assessment.answers.find(a => a.questionId === q.id); return e ?? { questionId: q.id, answer: 'no' as const, notes: '' }; });
    setAnswers(init); setFindings(assessment.findings); setRecs(assessment.recommendations); return null;
  }

  const score = calcScore(answers);
  const risk = calcRisk(score);

  const setAnswer = (qId: string, answer: AssessmentAnswer['answer']) => setAnswers(prev => prev!.map(a => a.questionId === qId ? { ...a, answer } : a));
  const setNotes = (qId: string, notes: string) => setAnswers(prev => prev!.map(a => a.questionId === qId ? { ...a, notes } : a));

  const save = async () => { await db.assessments.update(assessment.id, { answers, score, riskLevel: risk, status: 'in_progress', findings, recommendations: recs }); toast.success('Progress saved'); };
  const complete = async () => {
    const now = new Date().valueOf();
    const ver = {
      version: (assessment.versions?.length ?? 0) + 1,
      score,
      riskLevel: risk,
      completedAt: now,
      note: 'Assessment completed',
      findings,
      recommendations: recs,
      answers: answers.map((a) => ({ ...a })),
    };
    await db.assessments.update(assessment.id, { answers, score, riskLevel: risk, status: 'completed', completedAt: now, findings, recommendations: recs, versions: [...(assessment.versions ?? []), ver] });
    toast.success('Assessment completed'); nav('/assessments');
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ ...assessment, answers, score, findings, recommendations: recs }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `assessment-${assessment.title.toLowerCase().replace(/\s+/g, '-')}.json`; a.click();
    URL.revokeObjectURL(url); toast.success('Exported');
  };
  const deleteAssessment = async () => {
    await db.assessments.delete(assessment.id);
    toast.success('Assessment deleted');
    nav('/assessments');
  };

  const snapshots: AssessmentSnapshot[] = [
    ...(assessment.versions ?? []),
    {
      version: (assessment.versions?.length ?? 0) + 1,
      score,
      riskLevel: risk,
      completedAt: assessment.completedAt ?? assessment.createdAt,
      note: 'Current',
      findings,
      recommendations: recs,
      answers,
    },
  ];
  const leftSnapshot = snapshots.find((v) => String(v.version) === leftVersion) ?? snapshots[0];
  const rightSnapshot = snapshots.find((v) => String(v.version) === rightVersion) ?? snapshots[snapshots.length - 1];

  const answerChanges = (() => {
    const leftMap = new Map((leftSnapshot.answers ?? []).map((a) => [a.questionId, a.answer]));
    const rightMap = new Map((rightSnapshot.answers ?? []).map((a) => [a.questionId, a.answer]));
    const ids = Array.from(new Set([...leftMap.keys(), ...rightMap.keys()]));
    return ids
      .map((id) => ({ id, before: leftMap.get(id) ?? '—', after: rightMap.get(id) ?? '—', q: questions.find((q) => q.id === id)?.text ?? id }))
      .filter((row) => row.before !== row.after);
  })();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <button onClick={() => nav('/assessments')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"><ArrowLeft className="h-4 w-4" />Back to Assessments</button>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{assessment.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{assessment.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-3xl font-bold tabular-nums', score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-destructive')}>{score}%</p>
          <Badge variant={risk === 'high' ? 'destructive' : risk === 'medium' ? 'default' : risk === 'low' ? 'secondary' : 'outline'} className="mt-1">{risk} risk</Badge>
        </div>
      </div>

      <Progress value={score} className="h-2" />

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="history">History ({assessment.versions?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {assessment.type === 'pia' && <>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Data Types</p><p className="text-sm font-medium">{assessment.dataTypes.join(', ') || '—'}</p></div>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Purpose</p><p className="text-sm font-medium">{assessment.processingPurpose || '—'}</p></div>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Data Subjects</p><p className="text-sm font-medium">{assessment.dataSubjects || '—'}</p></div>
            </>}
            {assessment.type === 'risk_assessment' && <>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Assets</p><p className="text-sm font-medium">{assessment.assetsCovered || '—'}</p></div>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Threat Sources</p><p className="text-sm font-medium">{assessment.threatSources || '—'}</p></div>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Created</p><p className="text-sm font-medium">{new Date(assessment.createdAt).toLocaleDateString()}</p></div>
            </>}
            {assessment.type === 'security_checklist' && <>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Systems</p><p className="text-sm font-medium">{assessment.systemsInScope || '—'}</p></div>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Framework</p><p className="text-sm font-medium">{assessment.frameworkRef || '—'}</p></div>
              <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground mb-1">Created</p><p className="text-sm font-medium">{new Date(assessment.createdAt).toLocaleDateString()}</p></div>
            </>}
          </div>

          <Separator />

          {/* Completion progress */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Progress:</span>
            <span className="font-medium tabular-nums">{answers.filter(a => a.answer !== 'no').length}/{answers.length} answered</span>
          </div>

          {questions.map((q, i) => {
            const a = answers.find(a => a.questionId === q.id)!;
            const opts: { value: AssessmentAnswer['answer']; label: string; color: string; active: string }[] = [
              { value: 'yes', label: 'Yes', color: 'border-emerald-300 text-emerald-700', active: 'bg-emerald-500 text-white border-emerald-500' },
              { value: 'partial', label: 'Partial', color: 'border-amber-300 text-amber-700', active: 'bg-amber-500 text-white border-amber-500' },
              { value: 'no', label: 'No', color: 'border-red-300 text-red-700', active: 'bg-red-500 text-white border-red-500' },
              { value: 'na', label: 'N/A', color: 'border-gray-300 text-gray-500', active: 'bg-gray-400 text-white border-gray-400' },
            ];
            return (
              <div key={q.id} className="rounded-lg border p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{q.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{q.cat}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-9">
                  {opts.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswer(q.id, opt.value)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
                        a.answer === opt.value ? opt.active : `${opt.color} bg-transparent hover:opacity-80`
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="pl-9">
                  <Input placeholder="Notes (optional)" value={a.notes} onChange={e => setNotes(q.id, e.target.value)} className="text-sm" />
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="findings" className="mt-6 space-y-4">
          <div className="space-y-2"><Label>Findings</Label><Textarea className="min-h-[160px]" value={findings} onChange={e => setFindings(e.target.value)} placeholder="Document key findings..." /></div>
          <div className="space-y-2"><Label>Recommendations</Label><Textarea className="min-h-[160px]" value={recs} onChange={e => setRecs(e.target.value)} placeholder="Recommendations and mitigation steps..." /></div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card><CardContent className="py-6">
            {!assessment.versions?.length ? <p className="text-sm text-muted-foreground py-8 text-center">No versions yet.</p> : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Dialog
                    open={compareOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        setLeftVersion(String(Math.max(1, snapshots.length - 1)));
                        setRightVersion(String(snapshots.length));
                      }
                      setCompareOpen(open);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs h-8">Compare Versions</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-6xl">
                      <DialogHeader><DialogTitle>Compare Assessment Versions</DialogTitle></DialogHeader>
                      <div className="grid gap-3 sm:grid-cols-2 py-2">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Base</p>
                          <Select value={leftVersion} onValueChange={setLeftVersion}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {snapshots.map((v) => <SelectItem key={`left-${v.version}`} value={String(v.version)}>v{v.version} · {v.note}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Compare</p>
                          <Select value={rightVersion} onValueChange={setRightVersion}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {snapshots.map((v) => <SelectItem key={`right-${v.version}`} value={String(v.version)}>v{v.version} · {v.note}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border p-4 space-y-3">
                          <p className="text-sm font-medium">v{leftSnapshot.version} · Score {leftSnapshot.score}% ({leftSnapshot.riskLevel})</p>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Findings</p>
                            <div className="max-h-[22vh] overflow-y-auto custom-scrollbar text-sm whitespace-pre-wrap leading-relaxed rounded border p-3">
                              {diffTokens(leftSnapshot.findings ?? '', rightSnapshot.findings ?? '', 'removed').map((part, i) => (
                                <span key={`left-findings-${i}`} className={part.type === 'removed' ? 'bg-red-200/60 dark:bg-red-900/40 rounded-sm' : ''}>{part.text}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Recommendations</p>
                            <div className="max-h-[22vh] overflow-y-auto custom-scrollbar text-sm whitespace-pre-wrap leading-relaxed rounded border p-3">
                              {diffTokens(leftSnapshot.recommendations ?? '', rightSnapshot.recommendations ?? '', 'removed').map((part, i) => (
                                <span key={`left-recs-${i}`} className={part.type === 'removed' ? 'bg-red-200/60 dark:bg-red-900/40 rounded-sm' : ''}>{part.text}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border p-4 space-y-3">
                          <p className="text-sm font-medium">v{rightSnapshot.version} · Score {rightSnapshot.score}% ({rightSnapshot.riskLevel})</p>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Findings</p>
                            <div className="max-h-[22vh] overflow-y-auto custom-scrollbar text-sm whitespace-pre-wrap leading-relaxed rounded border p-3">
                              {diffTokens(leftSnapshot.findings ?? '', rightSnapshot.findings ?? '', 'added').map((part, i) => (
                                <span key={`right-findings-${i}`} className={part.type === 'added' ? 'bg-emerald-200/60 dark:bg-emerald-900/40 rounded-sm' : ''}>{part.text}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Recommendations</p>
                            <div className="max-h-[22vh] overflow-y-auto custom-scrollbar text-sm whitespace-pre-wrap leading-relaxed rounded border p-3">
                              {diffTokens(leftSnapshot.recommendations ?? '', rightSnapshot.recommendations ?? '', 'added').map((part, i) => (
                                <span key={`right-recs-${i}`} className={part.type === 'added' ? 'bg-emerald-200/60 dark:bg-emerald-900/40 rounded-sm' : ''}>{part.text}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Changed Answers ({answerChanges.length})</p>
                        {!answerChanges.length ? <p className="text-sm text-muted-foreground">No answer changes.</p> : (
                          <div className="space-y-2 max-h-[24vh] overflow-y-auto custom-scrollbar">
                            {answerChanges.map((row) => (
                              <div key={row.id} className="rounded border p-2.5 text-xs">
                                <p className="font-medium mb-1">{row.q}</p>
                                <p><span className="text-muted-foreground">Before:</span> {row.before}</p>
                                <p><span className="text-muted-foreground">After:</span> {row.after}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-3">{assessment.versions.slice().reverse().map(v => (
                  <div key={v.version} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">v{v.version}</div>
                    <div><p className="text-sm font-medium">{v.note} — Score: {v.score}% ({v.riskLevel} risk)</p><p className="text-sm text-muted-foreground mt-0.5">{new Date(v.completedAt).toLocaleString()}</p></div>
                  </div>
                ))}</div>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => exportAssessmentPDF({...assessment, answers: answers!, score, findings, recommendations: recs})}><FileText className="h-4 w-4" />Export PDF</Button>
          <Button variant="outline" className="gap-2" onClick={exportJSON}><Download className="h-4 w-4" />Export JSON</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"><Trash2 className="h-4 w-4" />Delete</Button></DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>Delete Assessment</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground py-2">Are you sure you want to delete "{assessment.title}"? This action cannot be undone.</p>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={deleteAssessment}>Delete</Button></div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={save}>Save Progress</Button>
          <Button onClick={complete}>Mark Complete</Button>
        </div>
      </div>
    </div>
  );
}
