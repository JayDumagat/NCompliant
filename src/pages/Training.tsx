import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TrainingRecord } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const CAT_LABEL: Record<string, string> = { privacy: 'Privacy', security: 'Security', compliance: 'Compliance', aml: 'AML', general: 'General' };
const STATUS_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  completed: { variant: 'secondary', label: 'Completed' }, in_progress: { variant: 'default', label: 'In Progress' },
  scheduled: { variant: 'outline', label: 'Scheduled' }, expired: { variant: 'destructive', label: 'Expired' },
};

function RecordDialog({ record, trigger, onDone }: { record?: TrainingRecord; trigger: React.ReactNode; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ employeeName: '', courseName: '', category: 'general' as TrainingRecord['category'], status: 'scheduled' as TrainingRecord['status'], scheduledDate: '', completedDate: '', expirationDate: '', certificateRef: '', notes: '' });

  const handleOpen = (v: boolean) => {
    if (v && record) {
      setF({
        employeeName: record.employeeName, courseName: record.courseName, category: record.category,
        status: record.status, certificateRef: record.certificateRef, notes: record.notes,
        scheduledDate: record.scheduledDate ? new Date(record.scheduledDate).toISOString().split('T')[0] : '',
        completedDate: record.completedDate ? new Date(record.completedDate).toISOString().split('T')[0] : '',
        expirationDate: record.expirationDate ? new Date(record.expirationDate).toISOString().split('T')[0] : '',
      });
    } else if (v) setF({ employeeName: '', courseName: '', category: 'general', status: 'scheduled', scheduledDate: '', completedDate: '', expirationDate: '', certificateRef: '', notes: '' });
    setOpen(v);
  };

  const save = async () => {
    const data = {
      employeeName: f.employeeName, courseName: f.courseName, category: f.category, status: f.status,
      certificateRef: f.certificateRef, notes: f.notes,
      scheduledDate: f.scheduledDate ? new Date(f.scheduledDate).getTime() : undefined,
      completedDate: f.completedDate ? new Date(f.completedDate).getTime() : undefined,
      expirationDate: f.expirationDate ? new Date(f.expirationDate).getTime() : undefined,
    };
    if (record) { await db.trainingRecords.update(record.id, data); toast.success('Record updated'); }
    else { await db.trainingRecords.add({ id: crypto.randomUUID(), workspaceId: 'ws-default', createdAt: Date.now(), ...data } as TrainingRecord); toast.success('Record created'); }
    setOpen(false); onDone();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{record ? 'Edit Training Record' : 'New Training Record'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Employee</Label><Input value={f.employeeName} onChange={e => setF({ ...f, employeeName: e.target.value })} placeholder="Full name" /></div>
            <div className="space-y-2"><Label>Course</Label><Input value={f.courseName} onChange={e => setF({ ...f, courseName: e.target.value })} placeholder="Course name" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Category</Label>
              <Select value={f.category} onValueChange={v => setF({ ...f, category: v as TrainingRecord['category'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CAT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={f.status} onValueChange={v => setF({ ...f, status: v as TrainingRecord['status'] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Certificate</Label><Input value={f.certificateRef} onChange={e => setF({ ...f, certificateRef: e.target.value })} placeholder="Ref #" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Scheduled</Label><Input type="date" value={f.scheduledDate} onChange={e => setF({ ...f, scheduledDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Completed</Label><Input type="date" value={f.completedDate} onChange={e => setF({ ...f, completedDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Expires</Label><Input type="date" value={f.expirationDate} onChange={e => setF({ ...f, expirationDate: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea className="min-h-[60px]" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!f.employeeName || !f.courseName}>{record ? 'Save' : 'Create'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Training() {
  const records = useLiveQuery(() => db.trainingRecords.toArray(), []);
  const [q, setQ] = useState('');
  const now = Date.now();
  const d30 = 30 * 86400000;

  const expiringSoon = records?.filter(r => r.status === 'completed' && r.expirationDate && r.expirationDate < now + d30 && r.expirationDate > now) ?? [];
  const expired = records?.filter(r => r.status === 'expired' || (r.expirationDate && r.expirationDate < now && r.status === 'completed')) ?? [];
  const completed = records?.filter(r => r.status === 'completed' && (!r.expirationDate || r.expirationDate > now + d30)) ?? [];

  const filtered = records?.filter(r => r.employeeName.toLowerCase().includes(q.toLowerCase()) || r.courseName.toLowerCase().includes(q.toLowerCase()));
  const del = async (id: string) => { await db.trainingRecords.delete(id); toast.success('Record deleted'); };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Training & Certification</h1>
          <p className="text-sm text-muted-foreground mt-1">Track compliance training, certifications, and expirations.</p>
        </div>
        <RecordDialog trigger={<Button className="gap-2"><Plus className="h-4 w-4" />Add Record</Button>} onDone={() => {}} />
      </div>

      {/* Summary stats — flat design */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Completed', count: completed.length, dot: 'bg-emerald-500' },
          { label: 'Expiring Soon', count: expiringSoon.length, dot: 'bg-amber-500' },
          { label: 'Expired', count: expired.length, dot: 'bg-red-500' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('h-2 w-2 rounded-full', s.dot)} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums">{s.count}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by employee or course..." className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {/* Desktop table */}
      <div className="rounded-lg border hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead><TableHead>Course</TableHead><TableHead>Category</TableHead>
              <TableHead>Status</TableHead><TableHead>Expires</TableHead><TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow>
            : filtered?.map(r => {
              const exp = r.expirationDate && r.expirationDate < now;
              const soon = r.expirationDate && !exp && r.expirationDate < now + d30;
              const sb = STATUS_BADGE[r.status];
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground">{r.courseName}</TableCell>
                  <TableCell><Badge variant="outline">{CAT_LABEL[r.category]}</Badge></TableCell>
                  <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                  <TableCell className={cn('text-muted-foreground', exp && 'text-destructive', soon && 'text-amber-600')}>
                    {r.expirationDate ? new Date(r.expirationDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <RecordDialog record={r} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>} onDone={() => {}} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {filtered?.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No records found.</CardContent></Card>
        : filtered?.map(r => {
          const exp = r.expirationDate && r.expirationDate < now;
          const soon = r.expirationDate && !exp && r.expirationDate < now + d30;
          const sb = STATUS_BADGE[r.status];
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.employeeName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.courseName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={sb.variant} className="text-[10px]">{sb.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{CAT_LABEL[r.category]}</Badge>
                      {r.expirationDate && <span className={cn('text-[10px]', exp ? 'text-destructive' : soon ? 'text-amber-600' : 'text-muted-foreground')}>Exp: {new Date(r.expirationDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <RecordDialog record={r} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>} onDone={() => {}} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
