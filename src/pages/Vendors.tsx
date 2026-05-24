import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db, type ThirdPartyVendor, type VendorAssessment } from '@/db/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const RISK_CLASS: Record<ThirdPartyVendor['riskTier'], string> = {
  low: 'bg-emerald-500/10 text-emerald-600',
  medium: 'bg-amber-500/10 text-amber-700',
  high: 'bg-orange-500/10 text-orange-700',
  critical: 'bg-destructive/10 text-destructive',
};

function VendorDialog({ trigger, vendor }: { trigger: React.ReactNode; vendor?: ThirdPartyVendor }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    serviceCategory: '',
    contactName: '',
    contactEmail: '',
    status: 'active' as ThirdPartyVendor['status'],
    riskTier: 'medium' as ThirdPartyVendor['riskTier'],
    dataAccess: 'limited' as ThirdPartyVendor['dataAccess'],
    tags: '',
    notes: '',
  });

  const onOpenChange = (next: boolean) => {
    if (next && vendor) {
      setForm({
        name: vendor.name,
        serviceCategory: vendor.serviceCategory,
        contactName: vendor.contactName,
        contactEmail: vendor.contactEmail,
        status: vendor.status,
        riskTier: vendor.riskTier,
        dataAccess: vendor.dataAccess,
        tags: vendor.tags.join(', '),
        notes: vendor.notes,
      });
    }
    if (next && !vendor) {
      setForm({
        name: '',
        serviceCategory: '',
        contactName: '',
        contactEmail: '',
        status: 'active',
        riskTier: 'medium',
        dataAccess: 'limited',
        tags: '',
        notes: '',
      });
    }
    setOpen(next);
  };

  const save = async () => {
    const payload = {
      name: form.name,
      serviceCategory: form.serviceCategory,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      status: form.status,
      riskTier: form.riskTier,
      dataAccess: form.dataAccess,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      notes: form.notes,
    };

    if (vendor) {
      await db.vendors.update(vendor.id, payload);
      toast.success('Vendor updated');
    } else {
      await db.vendors.add({
        id: crypto.randomUUID(),
        workspaceId: 'ws-default',
        createdAt: Date.now(),
        ...payload,
      });
      toast.success('Vendor added');
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{vendor ? 'Edit Vendor' : 'Add Third-Party Vendor'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Vendor Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Vendor name" /></div>
            <div className="space-y-2"><Label>Service Category</Label><Input value={form.serviceCategory} onChange={e => setForm({ ...form, serviceCategory: e.target.value })} placeholder="Cloud, Payroll, Legal..." /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} placeholder="Primary contact" /></div>
            <div className="space-y-2"><Label>Contact Email</Label><Input value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} placeholder="name@vendor.com" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v as ThirdPartyVendor['status'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="under_review">Under Review</SelectItem><SelectItem value="offboarded">Offboarded</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Risk Tier</Label><Select value={form.riskTier} onValueChange={v => setForm({ ...form, riskTier: v as ThirdPartyVendor['riskTier'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Data Access</Label><Select value={form.dataAccess} onValueChange={v => setForm({ ...form, dataAccess: v as ThirdPartyVendor['dataAccess'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="limited">Limited</SelectItem><SelectItem value="full">Full</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="critical-vendor, finance, pii" /></div>
          <div className="space-y-2"><Label>Notes</Label><Textarea className="min-h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!form.name || !form.serviceCategory}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssessmentDialog({ trigger, vendor }: { trigger: React.ReactNode; vendor: ThirdPartyVendor }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    assessmentType: 'security' as VendorAssessment['assessmentType'],
    status: 'not_started' as VendorAssessment['status'],
    riskLevel: 'unassessed' as VendorAssessment['riskLevel'],
    score: '',
    assessedAt: '',
    nextReviewDate: '',
    summary: '',
    recommendations: '',
  });

  const save = async () => {
    await db.vendorAssessments.add({
      id: crypto.randomUUID(),
      workspaceId: 'ws-default',
      vendorId: vendor.id,
      title: form.title,
      assessmentType: form.assessmentType,
      status: form.status,
      riskLevel: form.riskLevel,
      score: Number(form.score) || 0,
      assessedAt: form.assessedAt ? new Date(form.assessedAt).getTime() : undefined,
      nextReviewDate: form.nextReviewDate ? new Date(form.nextReviewDate).getTime() : undefined,
      summary: form.summary,
      recommendations: form.recommendations,
      createdAt: Date.now(),
    });
    await db.vendors.update(vendor.id, { lastAssessmentAt: Date.now() });
    toast.success('Vendor assessment recorded');
    setOpen(false);
    setForm({ title: '', assessmentType: 'security', status: 'not_started', riskLevel: 'unassessed', score: '', assessedAt: '', nextReviewDate: '', summary: '', recommendations: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Vendor Assessment · {vendor.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Assessment Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Quarterly security review" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Type</Label><Select value={form.assessmentType} onValueChange={v => setForm({ ...form, assessmentType: v as VendorAssessment['assessmentType'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="security">Security</SelectItem><SelectItem value="privacy">Privacy</SelectItem><SelectItem value="compliance">Compliance</SelectItem><SelectItem value="operational">Operational</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v as VendorAssessment['status'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not_started">Not Started</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Risk</Label><Select value={form.riskLevel} onValueChange={v => setForm({ ...form, riskLevel: v as VendorAssessment['riskLevel'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassessed">Unassessed</SelectItem><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Score</Label><Input type="number" min="0" max="100" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} placeholder="0 - 100" /></div>
            <div className="space-y-2"><Label>Assessed Date</Label><Input type="date" value={form.assessedAt} onChange={e => setForm({ ...form, assessedAt: e.target.value })} /></div>
            <div className="space-y-2"><Label>Next Review</Label><Input type="date" value={form.nextReviewDate} onChange={e => setForm({ ...form, nextReviewDate: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Summary</Label><Textarea className="min-h-[70px]" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
          <div className="space-y-2"><Label>Recommendations</Label><Textarea className="min-h-[70px]" value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!form.title}>Record Assessment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Vendors() {
  const vendors = useLiveQuery(() => db.vendors.toArray(), []);
  const assessments = useLiveQuery(() => db.vendorAssessments.toArray(), []);
  const [q, setQ] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | ThirdPartyVendor['riskTier']>('all');

  const filteredVendors = useMemo(() => {
    const source = vendors ?? [];
    return source
      .filter(v => {
        const matchesQuery = `${v.name} ${v.serviceCategory} ${v.contactName}`.toLowerCase().includes(q.toLowerCase());
        const matchesRisk = riskFilter === 'all' || v.riskTier === riskFilter;
        return matchesQuery && matchesRisk;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [vendors, q, riskFilter]);

  const summary = useMemo(() => {
    const source = vendors ?? [];
    return {
      total: source.length,
      critical: source.filter(v => v.riskTier === 'critical').length,
      high: source.filter(v => v.riskTier === 'high').length,
      active: source.filter(v => v.status === 'active').length,
    };
  }, [vendors]);

  const assessmentsByVendor = useMemo(() => {
    const map = new Map<string, VendorAssessment[]>();
    (assessments ?? []).forEach(a => {
      const list = map.get(a.vendorId) ?? [];
      list.push(a);
      map.set(a.vendorId, list);
    });
    return map;
  }, [assessments]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Third-Party Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Maintain vendor records and track vendor assessments.</p>
        </div>
        <VendorDialog trigger={<Button className="gap-2 shrink-0"><Plus className="h-4 w-4" />Add Vendor</Button>} />
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: 'Total Vendors', value: summary.total },
          { label: 'Critical Risk', value: summary.critical },
          { label: 'High Risk', value: summary.high },
          { label: 'Active', value: summary.active },
        ].map(item => (
          <Card key={item.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">{item.label}</p><p className="text-2xl font-semibold tabular-nums">{item.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search vendor, service, or contact..." className="sm:max-w-sm" />
        <Select value={riskFilter} onValueChange={v => setRiskFilter(v as typeof riskFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk tiers</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredVendors.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No vendors found.</CardContent></Card>
        ) : (
          filteredVendors
            .map(vendor => {
              const vendorAssessments = (assessmentsByVendor.get(vendor.id) ?? []).sort((a, b) => b.createdAt - a.createdAt);
              const latest = vendorAssessments[0];
              return (
                <Card key={vendor.id}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{vendor.serviceCategory} · {vendor.contactName || 'No contact'} · {vendor.contactEmail || 'No email'}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Badge variant="outline">{vendor.status.replace('_', ' ')}</Badge>
                          <Badge className={cn('border-0', RISK_CLASS[vendor.riskTier])}>{vendor.riskTier} risk</Badge>
                          <Badge variant="secondary">{vendor.dataAccess} data access</Badge>
                          {vendor.tags.map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <VendorDialog vendor={vendor} trigger={<Button variant="outline" size="sm">Edit</Button>} />
                        <AssessmentDialog vendor={vendor} trigger={<Button size="sm" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Assess</Button>} />
                      </div>
                    </div>
                    {vendor.notes && <p className="text-sm text-muted-foreground">{vendor.notes}</p>}
                    <div className="rounded-md border p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Latest Assessment</p>
                      {!latest ? <p className="text-sm text-muted-foreground">No assessments yet.</p> : (
                        <div className="space-y-1.5">
                          <p className="text-sm font-medium">{latest.title}</p>
                          <p className="text-xs text-muted-foreground">{latest.assessmentType} · {latest.status.replace('_', ' ')} · Risk: {latest.riskLevel}</p>
                          {latest.score > 0 && <p className="text-xs text-muted-foreground">Score: {latest.score}%</p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}
