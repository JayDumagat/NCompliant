import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Clock, ArrowUpRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

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

  const incidentCritical = incidents?.filter((i) => i.severity === 'critical').length ?? 0;
  const incidentHigh = incidents?.filter((i) => i.severity === 'high').length ?? 0;
  const incidentMedium = incidents?.filter((i) => i.severity === 'medium').length ?? 0;
  const incidentLow = incidents?.filter((i) => i.severity === 'low').length ?? 0;

  return (
    <div className="space-y-12">
      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your compliance posture at a glance.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Compliance Score</CardTitle>
            <p className="text-xs text-muted-foreground">A compact view of the current posture across the main workstreams.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <span className={cn('text-5xl font-semibold tabular-nums tracking-tight', overallScore >= 80 ? 'text-emerald-600' : overallScore >= 50 ? 'text-amber-600' : 'text-red-600')}>{overallScore}</span>
              <span className="pb-1 text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Policy coverage', value: policyScore },
                { label: 'Task completion', value: taskScore },
                { label: 'Assessment completion', value: assessmentScore },
                { label: 'Deadline health', value: overdueScore },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="tabular-nums text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Snapshot</CardTitle>
            <p className="text-xs text-muted-foreground">The main counts users look for first.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: 'Policies', value: totalPolicies, sub: `${activePolicies} active`, to: '/policies' },
              { label: 'Open tasks', value: openTasks, sub: overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track', alert: overdueTasks > 0, to: '/tasks' },
              { label: 'Assessments', value: totalAssessments, sub: `${completedAssessments} completed`, to: '/assessments' },
              { label: 'Alerts', value: criticalUpdates + warningUpdates, sub: criticalUpdates > 0 ? `${criticalUpdates} critical` : 'None', alert: criticalUpdates > 0, to: '/updates' },
            ].map((item) => (
              <Link key={item.label} to={item.to} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p>
                <p className={cn('mt-1 text-xs', item.alert ? 'text-destructive' : 'text-muted-foreground')}>{item.sub}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Risk Mix</CardTitle>
            <p className="text-xs text-muted-foreground">A quick read on active incident severity.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Critical', value: incidentCritical, tone: 'text-destructive' },
              { label: 'High', value: incidentHigh, tone: 'text-orange-600' },
              { label: 'Medium', value: incidentMedium, tone: 'text-amber-600' },
              { label: 'Low', value: incidentLow, tone: 'text-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={cn('tabular-nums', item.tone)}>{item.value}</span>
                </div>
                <Progress value={Math.min(100, item.value * 25)} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attention Needed</CardTitle>
            <p className="text-xs text-muted-foreground">Only the items that require action right now.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Overdue tasks', value: overdueTasks, to: '/tasks' },
              { label: 'Open incidents', value: openIncidents, to: '/incidents' },
              { label: 'Expired training', value: expiredTraining, to: '/training' },
              { label: 'High-risk assessments', value: highRiskAssessments, to: '/assessments' },
            ].filter((item) => item.value > 0).length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No active issues right now.</p>
            ) : (
              [
                { label: 'Overdue tasks', value: overdueTasks, to: '/tasks' },
                { label: 'Open incidents', value: openIncidents, to: '/incidents' },
                { label: 'Expired training', value: expiredTraining, to: '/training' },
                { label: 'High-risk assessments', value: highRiskAssessments, to: '/assessments' },
              ].filter((item) => item.value > 0).map((item) => (
                <Link key={item.label} to={item.to} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent/30">
                  <span>{item.label}</span>
                  <span className="tabular-nums text-muted-foreground">{item.value}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
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
            {recentPolicies?.length === 0 && <EmptyState icon={FileText} title="No policies yet" description="Create a policy and it will appear here as your latest work." className="py-8" />}
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
