import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Clock, ArrowUpRight } from 'lucide-react';
import { Link } from '@/src/lib/router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const policies = useLiveQuery(() => db.policies.toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const updates = useLiveQuery(() => db.updates.toArray(), []);
  const assessments = useLiveQuery(() => db.assessments.toArray(), []);
  const incidents = useLiveQuery(() => db.incidents.toArray(), []);
  const training = useLiveQuery(() => db.trainingRecords.toArray(), []);

  const now = Date.now();
  const totalPolicies = policies?.length ?? 0;
  const activePolicies = policies?.filter((p) => p.status === 'active').length ?? 0;

  const totalTasks = tasks?.length ?? 0;
  const doneTasks = tasks?.filter((t) => t.status === 'done').length ?? 0;
  const overdueTasks = tasks?.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < now).length ?? 0;
  const openTasks = totalTasks - doneTasks;

  const criticalUpdates = updates?.filter((u) => u.severity === 'critical').length ?? 0;
  const warningUpdates = updates?.filter((u) => u.severity === 'warning').length ?? 0;

  const totalAssessments = assessments?.length ?? 0;
  const completedAssessments = assessments?.filter((a) => a.status === 'completed').length ?? 0;
  const highRiskAssessments = assessments?.filter((a) => a.riskLevel === 'high').length ?? 0;

  const openIncidents = incidents?.filter(i => i.status === 'open' || i.status === 'investigating').length ?? 0;
  const expiredTraining = training?.filter(t => t.status === 'expired' || (t.expirationDate && t.expirationDate < now)).length ?? 0;

  const policyScore = totalPolicies > 0 ? Math.round((activePolicies / totalPolicies) * 100) : 0;
  const taskScore = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const assessmentScore = totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0;
  const overdueScore = totalTasks > 0 ? Math.max(0, 100 - Math.round((overdueTasks / totalTasks) * 200)) : 100;
  const overallScore = Math.round((policyScore + taskScore + assessmentScore + overdueScore) / 4);

  const recentTasks = tasks?.filter((t) => t.status !== 'done').sort((a, b) => (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity)).slice(0, 5);
  const recentPolicies = policies?.sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 5);
  const criticalAlerts = updates?.filter((u) => u.severity === 'critical' || u.severity === 'warning').sort((a, b) => b.date - a.date).slice(0, 3);

  // Flags
  const hasIssues = overdueTasks > 0 || openIncidents > 0 || expiredTraining > 0 || highRiskAssessments > 0;

  return (
    <div className="space-y-12">
      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your compliance posture at a glance.</p>
      </div>

      {/* Overall score — simple number, no donut */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-12">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compliance Score</p>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              'text-5xl sm:text-6xl font-semibold tabular-nums tracking-tight',
              overallScore >= 80 ? 'text-emerald-600' : overallScore >= 50 ? 'text-amber-600' : 'text-red-600'
            )}>{overallScore}</span>
            <span className="text-lg text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 sm:gap-y-0 pb-1">
          {[
            { label: 'Policy', value: policyScore },
            { label: 'Tasks', value: taskScore },
            { label: 'Assessments', value: assessmentScore },
            { label: 'Deadlines', value: overdueScore },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{m.value}%</span>
              </div>
              <Progress value={m.value} className="h-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Stat row — flat numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
        {[
          { label: 'Policies', value: totalPolicies, sub: `${activePolicies} active`, to: '/policies' },
          { label: 'Open Tasks', value: openTasks, sub: overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track', alert: overdueTasks > 0, to: '/tasks' },
          { label: 'Assessments', value: `${completedAssessments}/${totalAssessments}`, sub: highRiskAssessments > 0 ? `${highRiskAssessments} high risk` : 'On track', alert: highRiskAssessments > 0, to: '/assessments' },
          { label: 'Alerts', value: criticalUpdates + warningUpdates, sub: criticalUpdates > 0 ? `${criticalUpdates} critical` : 'None', alert: criticalUpdates > 0, to: '/updates' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="bg-card p-4 sm:p-5 hover:bg-accent/40 transition-colors group">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className={cn('text-xs mt-1', s.alert ? 'text-red-500' : 'text-muted-foreground')}>{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Attention items — only show if there are issues */}
      {hasIssues && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Needs Attention</p>
          <div className="space-y-1">
            {overdueTasks > 0 && (
              <Link to="/tasks" className="flex items-center justify-between py-2.5 px-1 border-b hover:bg-accent/30 transition-colors rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-sm">{overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            )}
            {openIncidents > 0 && (
              <Link to="/incidents" className="flex items-center justify-between py-2.5 px-1 border-b hover:bg-accent/30 transition-colors rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-sm">{openIncidents} open incident{openIncidents > 1 ? 's' : ''}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            )}
            {expiredTraining > 0 && (
              <Link to="/training" className="flex items-center justify-between py-2.5 px-1 border-b hover:bg-accent/30 transition-colors rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="text-sm">{expiredTraining} expired certification{expiredTraining > 1 ? 's' : ''}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            )}
            {highRiskAssessments > 0 && (
              <Link to="/assessments" className="flex items-center justify-between py-2.5 px-1 border-b hover:bg-accent/30 transition-colors rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  <span className="text-sm">{highRiskAssessments} high-risk assessment{highRiskAssessments > 1 ? 's' : ''}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Regulatory alerts */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Regulatory Alerts</p>
            <Link to="/updates"><Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground">View all<ArrowUpRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((u) => (
              <div key={u.id} className="flex items-start justify-between gap-3 py-3 border-b last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{u.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.agency} · {new Date(u.date).toLocaleDateString()}</p>
                </div>
                <Badge variant={u.severity === 'critical' ? 'destructive' : 'secondary'} className="shrink-0 text-[10px]">{u.severity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks + Policies — side by side */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Upcoming Tasks</p>
            <Link to="/tasks"><Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground">View all<ArrowUpRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="space-y-1">
            {recentTasks?.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No pending tasks.</p>}
            {recentTasks?.map((t) => {
              const overdue = t.dueDate && t.dueDate < now;
              return (
                <Link key={t.id} to="/tasks" className="flex items-center justify-between py-2.5 px-1 border-b last:border-0 hover:bg-accent/30 transition-colors rounded-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{t.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {t.dueDate && <span className={cn('text-xs', overdue ? 'text-red-500' : 'text-muted-foreground')}><Clock className="inline h-3 w-3 mr-0.5" />{new Date(t.dueDate).toLocaleDateString()}</span>}
                      {t.assignedTo && <span className="text-xs text-muted-foreground">{t.assignedTo}</span>}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] ml-3 shrink-0">{t.priority}</Badge>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Recent Policies</p>
            <Link to="/policies"><Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground">View all<ArrowUpRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="space-y-1">
            {recentPolicies?.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No policies yet.</p>}
            {recentPolicies?.map((p) => (
              <Link key={p.id} to={`/policies/${p.id}`} className="flex items-center justify-between py-2.5 px-1 border-b last:border-0 hover:bg-accent/30 transition-colors rounded-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.category} · {new Date(p.lastUpdated).toLocaleDateString()}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] ml-3 shrink-0">{p.status.replace('_', ' ')}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
