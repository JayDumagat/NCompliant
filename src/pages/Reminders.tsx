import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '@/db/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type ReminderType = 'task_due' | 'training_expiry' | 'training_schedule' | 'policy_review' | 'vendor_review';
type ReminderPriority = Task['priority'] | 'info';

interface ReminderItem {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  priority: ReminderPriority;
  date: number;
  sourcePath: string;
}

const DAY = 24 * 60 * 60 * 1000;
const CALENDAR_CELLS = 42;

function toDateKey(timestamp: number) {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKeyToLocalDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function ReminderDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    template: 'regulatory_submission',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });

  const applyTemplate = (template: string) => {
    const templateMap: Record<string, { title: string; description: string }> = {
      regulatory_submission: {
        title: 'Submit regulatory documents',
        description: 'Prepare and submit required documentation to the appropriate regulatory body.',
      },
      credential_refresh: {
        title: 'Refresh team credentials',
        description: 'Review and renew expiring certifications, licenses, or credentials.',
      },
      intern_training: {
        title: 'Complete intern compliance training',
        description: 'Schedule and track intern onboarding and compliance training requirements.',
      },
      general: {
        title: '',
        description: '',
      },
    };
    const preset = templateMap[template] ?? templateMap.general;
    setForm((f) => ({ ...f, template, title: preset.title, description: preset.description }));
  };

  const save = async () => {
    if (!form.title || !form.dueDate) return;
    await db.tasks.add({
      id: crypto.randomUUID(),
      workspaceId: 'ws-default',
      createdAt: Date.now(),
      title: form.title,
      description: form.description,
      assignedTo: '',
      policyId: undefined,
      assessmentId: undefined,
      status: 'todo',
      priority: form.priority as Task['priority'],
      dueDate: new Date(form.dueDate).getTime(),
    });
    toast.success('Reminder added to tasks');
    setOpen(false);
    setForm({ template: 'regulatory_submission', title: '', description: '', dueDate: '', priority: 'medium' });
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Reminder</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Reminder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={form.template} onValueChange={applyTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regulatory_submission">Regulatory Submission</SelectItem>
                <SelectItem value="credential_refresh">Credential Refresh</SelectItem>
                <SelectItem value="intern_training">Intern Training</SelectItem>
                <SelectItem value="general">General Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              className="min-h-[90px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(value) => setForm((f) => ({ ...f, priority: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={!form.title || !form.dueDate}>Save Reminder</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Reminders() {
  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const training = useLiveQuery(() => db.trainingRecords.toArray(), []);
  const policies = useLiveQuery(() => db.policies.toArray(), []);
  const vendorAssessments = useLiveQuery(() => db.vendorAssessments.toArray(), []);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(Date.now()));
  const [todayKey] = useState(() => toDateKey(Date.now()));

  const reminders = useMemo<ReminderItem[]>(() => {
    const taskItems = (tasks ?? [])
      .filter((t) => t.status !== 'done' && t.dueDate)
      .map((t) => ({
        id: `task-${t.id}`,
        type: 'task_due' as const,
        title: t.title,
        description: t.description,
        priority: t.priority,
        date: t.dueDate as number,
        sourcePath: '/tasks',
      }));

    const trainingExpiryItems = (training ?? [])
      .filter((t) => t.expirationDate)
      .map((t) => ({
        id: `training-expiry-${t.id}`,
        type: 'training_expiry' as const,
        title: `${t.employeeName}: ${t.courseName} expires`,
        description: 'Credential/certification is nearing or past expiration.',
        priority: 'high' as const,
        date: t.expirationDate as number,
        sourcePath: '/training',
      }));

    const trainingScheduleItems = (training ?? [])
      .filter((t) => t.status !== 'completed' && t.scheduledDate)
      .map((t) => ({
        id: `training-scheduled-${t.id}`,
        type: 'training_schedule' as const,
        title: `${t.employeeName}: ${t.courseName} scheduled`,
        description: 'Scheduled training session.',
        priority: 'medium' as const,
        date: t.scheduledDate as number,
        sourcePath: '/training',
      }));

    const policyReviewItems = (policies ?? [])
      .filter((p) => p.nextReviewDate)
      .map((p) => ({
        id: `policy-${p.id}`,
        type: 'policy_review' as const,
        title: `${p.title} review due`,
        description: 'Policy review date.',
        priority: 'medium' as const,
        date: p.nextReviewDate as number,
        sourcePath: '/policies',
      }));

    const vendorReviewItems = (vendorAssessments ?? [])
      .filter((a) => a.nextReviewDate)
      .map((a) => ({
        id: `vendor-assessment-${a.id}`,
        type: 'vendor_review' as const,
        title: `${a.title} follow-up review`,
        description: 'Vendor assessment next review date.',
        priority: 'medium' as const,
        date: a.nextReviewDate as number,
        sourcePath: '/vendors',
      }));

    return [...taskItems, ...trainingExpiryItems, ...trainingScheduleItems, ...policyReviewItems, ...vendorReviewItems]
      .sort((a, b) => a.date - b.date);
  }, [policies, tasks, training, vendorAssessments]);

  const remindersByDate = useMemo(() => {
    const grouped = new Map<string, ReminderItem[]>();
    reminders.forEach((item) => {
      const key = toDateKey(item.date);
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    });
    return grouped;
  }, [reminders]);

  const monthDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = firstOfMonth.getDay();
    const start = new Date(year, month, 1 - firstWeekday);
    const cells = Array.from({ length: CALENDAR_CELLS }, (_, i) => {
      const date = new Date(start.getTime() + i * DAY);
      return {
        date,
        key: toDateKey(date.getTime()),
        inMonth: date.getMonth() === month,
      };
    });
    return cells;
  }, [monthCursor]);

  const selectedItems = remindersByDate.get(selectedDate) ?? [];
  const upcomingItems = reminders.filter((item) => {
    const dateOnly = new Date(new Date(item.date).toDateString()).getTime();
    const nowOnly = new Date(new Date().toDateString()).getTime();
    return dateOnly >= nowOnly && dateOnly <= nowOnly + 30 * DAY;
  }).slice(0, 8);

  const previousMonth = () => setMonthCursor((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setMonthCursor((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Reminders Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track submissions, credential renewals, intern training, and other compliance deadlines.
          </p>
        </div>
        <ReminderDialog onDone={() => {}} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>Prev</Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>Next</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((cell) => {
                const dayItems = remindersByDate.get(cell.key) ?? [];
                const isSelected = selectedDate === cell.key;
                const isToday = cell.key === todayKey;
                return (
                  <button
                    key={cell.key}
                    onClick={() => setSelectedDate(cell.key)}
                    className={cn(
                      'min-h-[84px] rounded-md border p-1.5 text-left transition-colors',
                      cell.inMonth ? 'bg-card' : 'bg-muted/40 text-muted-foreground',
                      isSelected && 'ring-2 ring-primary/60',
                      isToday && 'border-primary/50'
                    )}
                  >
                    <p className="text-[11px]">{cell.date.getDate()}</p>
                    <div className="mt-1 space-y-1">
                      {dayItems.slice(0, 2).map((item) => (
                        <p key={item.id} className="truncate rounded bg-accent px-1 py-0.5 text-[10px]">{item.title}</p>
                      ))}
                      {dayItems.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayItems.length - 2} more</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {parseDateKeyToLocalDate(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedItems.length === 0 && <p className="text-sm text-muted-foreground">No reminders for this date.</p>}
              {selectedItems.map((item) => (
                <Link key={item.id} to={item.sourcePath} className="block rounded-lg border p-3 hover:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px]">
                      {item.priority}
                    </Badge>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming (30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingItems.length === 0 && <p className="text-sm text-muted-foreground">No upcoming reminders.</p>}
              {upcomingItems.map((item) => (
                <div key={item.id} className="rounded-md border p-2">
                  <p className="text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.date).toLocaleDateString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
