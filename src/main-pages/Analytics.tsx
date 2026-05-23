import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/db/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Progress } from '@/src/components/ui/progress';
import { cn } from '@/src/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';

/* ── Donut Chart ── */
function DonutChart({ value, size = 110, strokeWidth = 10, label }: { value: number; size?: number; strokeWidth?: number; label?: string }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color = value >= 80 ? 'var(--chart-3)' : value >= 50 ? 'var(--chart-4)' : 'var(--chart-5)';
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 700ms ease' }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center fill-foreground font-bold tabular-nums" style={{ fontSize: '1.3rem' }}>{value}%</text>
      </svg>
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
    </div>
  );
}

/* ── Bar Chart ── */
function BarChart({ data, height = 140 }: { data: { label: string; value: number; color: string }[]; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-xs tabular-nums font-semibold">{d.value}</span>
          <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${(d.value / max) * (height - 36)}px`, backgroundColor: d.color, minHeight: d.value > 0 ? 6 : 0 }} />
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── 5×5 Risk Heatmap (Likelihood × Impact) ── */
const LIKELIHOOD = ['Almost Certain', 'Likely', 'Possible', 'Unlikely', 'Rare'];
const IMPACT = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
// Risk level grid: [likelihood][impact] — 0=low, 1=medium, 2=high, 3=critical
const RISK_GRID = [
  [1,2,3,3,3], // Almost Certain
  [0,1,2,3,3], // Likely
  [0,0,1,2,3], // Possible
  [0,0,0,1,2], // Unlikely
  [0,0,0,0,1], // Rare
];
const RISK_COLORS = ['bg-emerald-500/70', 'bg-amber-400/70', 'bg-orange-500/70', 'bg-red-500/80'];
const RISK_LABELS = ['Low', 'Medium', 'High', 'Critical'];
const RISK_TEXT = ['text-emerald-950', 'text-amber-950', 'text-orange-950', 'text-white'];

function RiskHeatmap({ assessments }: { assessments: { title: string; riskLevel: string; score: number }[] }) {
  // Place assessments onto the grid based on their risk level and score
  const grid: { title: string; score: number }[][][] = LIKELIHOOD.map(() => IMPACT.map(() => []));

  assessments.forEach(a => {
    // Map risk level to likelihood row
    const likeRow = a.riskLevel === 'high' ? 1 : a.riskLevel === 'medium' ? 2 : a.riskLevel === 'low' ? 3 : 4;
    // Map score to impact column (inverse: low score = high impact)
    const impCol = a.score < 20 ? 4 : a.score < 40 ? 3 : a.score < 60 ? 2 : a.score < 80 ? 1 : 0;
    grid[likeRow][impCol].push({ title: a.title, score: a.score });
  });

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th className="p-2 text-[10px] font-semibold text-muted-foreground w-24"></th>
              {IMPACT.map(i => (
                <th key={i} className="p-2 text-[10px] font-semibold text-muted-foreground text-center">{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIKELIHOOD.map((lik, li) => (
              <tr key={lik}>
                <td className="p-2 text-[10px] font-semibold text-muted-foreground text-right pr-3 whitespace-nowrap">{lik}</td>
                {IMPACT.map((_, ii) => {
                  const level = RISK_GRID[li][ii];
                  const items = grid[li][ii];
                  return (
                    <td key={ii} className="p-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            'rounded-md border h-14 sm:h-16 flex items-center justify-center transition-all',
                            RISK_COLORS[level],
                            items.length > 0 ? 'ring-2 ring-foreground/20 scale-105' : 'opacity-60'
                          )}>
                            {items.length > 0 ? (
                              <span className={cn('text-xs font-bold', RISK_TEXT[level])}>{items.length}</span>
                            ) : (
                              <span className={cn('text-[9px]', RISK_TEXT[level], 'opacity-50')}>{RISK_LABELS[level]}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold text-xs">{RISK_LABELS[level]} Risk</p>
                          {items.length > 0 ? items.map(it => (
                            <p key={it.title} className="text-xs text-muted-foreground">{it.title} ({it.score}%)</p>
                          )) : <p className="text-xs text-muted-foreground">No assessments</p>}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-center gap-4 mt-3">
          {RISK_LABELS.map((l, i) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-sm', RISK_COLORS[i])} />
              <span className="text-[10px] text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function Analytics() {
  const policies = useLiveQuery(() => db.policies.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const assessments = useLiveQuery(() => db.assessments.toArray(), []);
  const incidents = useLiveQuery(() => db.incidents.toArray(), []);
  const training = useLiveQuery(() => db.trainingRecords.toArray(), []);

  const now = Date.now();
  const totalPolicies = policies?.length ?? 0;
  const activePolicies = policies?.filter(p => p.status === 'active').length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const doneTasks = tasks?.filter(t => t.status === 'done').length ?? 0;
  const overdueTasks = tasks?.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < now).length ?? 0;
  const totalAssessments = assessments?.length ?? 0;
  const completedAssessments = assessments?.filter(a => a.status === 'completed').length ?? 0;
  const highRisk = assessments?.filter(a => a.riskLevel === 'high').length ?? 0;
  const avgScore = assessments && assessments.length > 0 ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / assessments.length) : 0;
  const totalTraining = training?.length ?? 0;
  const completedTraining = training?.filter(t => t.status === 'completed' && (!t.expirationDate || t.expirationDate > now)).length ?? 0;
  const expiredTraining = training?.filter(t => t.status === 'expired' || (t.expirationDate && t.expirationDate < now)).length ?? 0;
  const trainingPct = totalTraining > 0 ? Math.round((completedTraining / totalTraining) * 100) : 0;
  const policyPct = totalPolicies > 0 ? Math.round((activePolicies / totalPolicies) * 100) : 0;
  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const assessPct = totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0;

  const incByType = ['data_breach', 'security', 'compliance_violation', 'operational', 'other'].map(t => ({
    label: t === 'data_breach' ? 'Breach' : t === 'compliance_violation' ? 'Compliance' : t.charAt(0).toUpperCase() + t.slice(1),
    value: incidents?.filter(i => i.type === t).length ?? 0,
    color: t === 'data_breach' ? '#dc2626' : t === 'security' ? '#ea580c' : t === 'compliance_violation' ? '#d97706' : t === 'operational' ? '#0891b2' : '#6b7280',
  }));
  const incBySev = ['critical', 'high', 'medium', 'low'].map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: incidents?.filter(i => i.severity === s).length ?? 0,
    color: s === 'critical' ? '#dc2626' : s === 'high' ? '#ea580c' : s === 'medium' ? '#d97706' : '#6b7280',
  }));
  const trainingByCat = ['privacy', 'security', 'compliance', 'aml', 'general'].map(c => ({
    label: c.charAt(0).toUpperCase() + c.slice(1),
    value: training?.filter(t => t.category === c).length ?? 0,
    color: c === 'privacy' ? '#1d4ed8' : c === 'security' ? '#059669' : c === 'compliance' ? '#7c3aed' : c === 'aml' ? '#0891b2' : '#6b7280',
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Compliance posture, risk distribution, and performance metrics.</p>
      </div>

      {/* Compliance Score Donuts */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex flex-col items-center justify-center py-6"><DonutChart value={policyPct} label="Policy Coverage" /></CardContent></Card>
        <Card><CardContent className="flex flex-col items-center justify-center py-6"><DonutChart value={taskPct} label="Task Completion" /></CardContent></Card>
        <Card><CardContent className="flex flex-col items-center justify-center py-6"><DonutChart value={assessPct} label="Assessments" /></CardContent></Card>
        <Card><CardContent className="flex flex-col items-center justify-center py-6"><DonutChart value={trainingPct} label="Training" /></CardContent></Card>
      </div>

      {/* Risk Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Heatmap — Likelihood × Impact</CardTitle>
          <p className="text-xs text-muted-foreground">Assessments mapped by risk level and compliance score. Highlighted cells contain assessments.</p>
        </CardHeader>
        <CardContent>
          {assessments && assessments.length > 0 ? (
            <RiskHeatmap assessments={assessments.map(a => ({ title: a.title, riskLevel: a.riskLevel, score: a.score }))} />
          ) : <p className="text-sm text-muted-foreground text-center py-8">No assessments to display.</p>}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Incidents by Type</CardTitle></CardHeader>
          <CardContent><BarChart data={incByType} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Incidents by Severity</CardTitle></CardHeader>
          <CardContent><BarChart data={incBySev} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Training by Category</CardTitle></CardHeader>
          <CardContent><BarChart data={trainingByCat} /></CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader><CardTitle className="text-base">Key Metrics</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'Average Assessment Score', value: `${avgScore}%`, pct: avgScore },
              { label: 'Task On-Time Rate', value: `${totalTasks > 0 ? Math.max(0, 100 - Math.round((overdueTasks / totalTasks) * 100)) : 100}%`, pct: totalTasks > 0 ? Math.max(0, 100 - Math.round((overdueTasks / totalTasks) * 100)) : 100 },
              { label: 'Training Compliance', value: `${trainingPct}%`, pct: trainingPct },
            ].map(m => (
              <div key={m.label} className="space-y-2">
                <div className="flex justify-between"><span className="text-sm">{m.label}</span><span className="text-sm font-semibold tabular-nums">{m.value}</span></div>
                <Progress value={m.pct} className="h-2" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { v: overdueTasks, l: 'Overdue Tasks', c: overdueTasks > 0 ? 'text-destructive' : '' },
                { v: highRisk, l: 'High Risk', c: highRisk > 0 ? 'text-orange-600' : '' },
                { v: expiredTraining, l: 'Expired Certs', c: expiredTraining > 0 ? 'text-destructive' : '' },
                { v: incidents?.filter(i => i.status === 'open').length ?? 0, l: 'Open Incidents', c: '' },
              ].map(m => (
                <div key={m.l} className="rounded-lg border p-3 text-center">
                  <p className={cn('text-2xl font-semibold tabular-nums', m.c)}>{m.v}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.l}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
