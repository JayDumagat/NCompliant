import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DataAsset } from '@/src/db/db';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Textarea } from '@/src/components/ui/textarea';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

const CLASS_COLORS: Record<DataAsset['classification'], string> = {
  public: 'bg-sky-500/10 text-sky-700',
  internal: 'bg-violet-500/10 text-violet-700',
  confidential: 'bg-amber-500/10 text-amber-700',
  restricted: 'bg-destructive/10 text-destructive',
};

function DataAssetDialog({ trigger, asset }: { trigger: React.ReactNode; asset?: DataAsset }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    dataType: '',
    classification: 'internal' as DataAsset['classification'],
    group: '',
    tags: '',
    owner: '',
    retentionPolicy: '',
    status: 'active' as DataAsset['status'],
    lastReviewedAt: '',
  });

  const onOpenChange = (next: boolean) => {
    if (next && asset) {
      setForm({
        name: asset.name,
        description: asset.description,
        dataType: asset.dataType,
        classification: asset.classification,
        group: asset.group,
        tags: asset.tags.join(', '),
        owner: asset.owner,
        retentionPolicy: asset.retentionPolicy,
        status: asset.status,
        lastReviewedAt: asset.lastReviewedAt ? new Date(asset.lastReviewedAt).toISOString().split('T')[0] : '',
      });
    }
    if (next && !asset) {
      setForm({
        name: '',
        description: '',
        dataType: '',
        classification: 'internal',
        group: '',
        tags: '',
        owner: '',
        retentionPolicy: '',
        status: 'active',
        lastReviewedAt: '',
      });
    }
    setOpen(next);
  };

  const save = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      dataType: form.dataType,
      classification: form.classification,
      group: form.group,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      owner: form.owner,
      retentionPolicy: form.retentionPolicy,
      status: form.status,
      lastReviewedAt: form.lastReviewedAt ? new Date(form.lastReviewedAt).getTime() : undefined,
    };
    if (asset) {
      await db.dataAssets.update(asset.id, payload);
      toast.success('Data record updated');
    } else {
      await db.dataAssets.add({
        id: crypto.randomUUID(),
        workspaceId: 'ws-default',
        createdAt: Date.now(),
        ...payload,
      });
      toast.success('Data record added');
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{asset ? 'Edit Data Record' : 'Add Data Record'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Data asset name" /></div>
            <div className="space-y-2"><Label>Data Type</Label><Input value={form.dataType} onChange={e => setForm({ ...form, dataType: e.target.value })} placeholder="Personal Data, Financial Data..." /></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea className="min-h-[80px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Classification</Label><Select value={form.classification} onValueChange={v => setForm({ ...form, classification: v as DataAsset['classification'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="internal">Internal</SelectItem><SelectItem value="confidential">Confidential</SelectItem><SelectItem value="restricted">Restricted</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Group</Label><Input value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} placeholder="Customer Records" /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v as DataAsset['status'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Owner</Label><Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="Business owner/team" /></div>
            <div className="space-y-2"><Label>Last Reviewed</Label><Input type="date" value={form.lastReviewedAt} onChange={e => setForm({ ...form, lastReviewedAt: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Retention Policy</Label><Input value={form.retentionPolicy} onChange={e => setForm({ ...form, retentionPolicy: e.target.value })} placeholder="Retention and disposal rule" /></div>
          <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="pii, finance, customer" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!form.name || !form.dataType || !form.group}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DataManagement() {
  const assets = useLiveQuery(() => db.dataAssets.toArray(), []);
  const [q, setQ] = useState('');
  const [classification, setClassification] = useState<'all' | DataAsset['classification']>('all');
  const [groupFilter, setGroupFilter] = useState('all');

  const groups = useMemo(() => {
    const unique = new Set((assets ?? []).map(a => a.group).filter(Boolean));
    return ['all', ...Array.from(unique).sort()];
  }, [assets]);

  const filtered = useMemo(() => {
    return (assets ?? [])
      .filter(a => {
        const matchesQ = `${a.name} ${a.dataType} ${a.owner} ${a.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase());
        const matchesClass = classification === 'all' || a.classification === classification;
        const matchesGroup = groupFilter === 'all' || a.group === groupFilter;
        return matchesQ && matchesClass && matchesGroup;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [assets, q, classification, groupFilter]);

  const stats = useMemo(() => {
    const source = assets ?? [];
    return {
      total: source.length,
      restricted: source.filter(a => a.classification === 'restricted').length,
      confidential: source.filter(a => a.classification === 'confidential').length,
      groups: new Set(source.map(a => a.group)).size,
    };
  }, [assets]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Data Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Classify, tag, and group organizational data assets.</p>
        </div>
        <DataAssetDialog trigger={<Button className="gap-2 shrink-0"><Plus className="h-4 w-4" />Add Data</Button>} />
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: 'Data Assets', value: stats.total },
          { label: 'Restricted', value: stats.restricted },
          { label: 'Confidential', value: stats.confidential },
          { label: 'Groups', value: stats.groups },
        ].map(item => (
          <Card key={item.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">{item.label}</p><p className="text-2xl font-semibold tabular-nums">{item.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, type, owner, tag..." />
        <Select value={classification} onValueChange={v => setClassification(v as typeof classification)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classifications</SelectItem>
            <SelectItem value="restricted">Restricted</SelectItem>
            <SelectItem value="confidential">Confidential</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {groups.map(group => <SelectItem key={group} value={group}>{group === 'all' ? 'All groups' : group}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No data records found.</CardContent></Card>
        ) : (
          filtered
            .map(asset => (
              <Card key={asset.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{asset.dataType} · Group: {asset.group} · Owner: {asset.owner || 'Unassigned'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Badge className={cn('border-0', CLASS_COLORS[asset.classification])}>{asset.classification}</Badge>
                        <Badge variant={asset.status === 'active' ? 'secondary' : 'outline'}>{asset.status}</Badge>
                        {asset.tags.map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                      </div>
                    </div>
                    <DataAssetDialog asset={asset} trigger={<Button variant="outline" size="sm">Edit</Button>} />
                  </div>
                  {asset.description && <p className="text-sm text-muted-foreground">{asset.description}</p>}
                  <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                    <p>Retention: {asset.retentionPolicy || '—'}</p>
                    <p>Last review: {asset.lastReviewedAt ? new Date(asset.lastReviewedAt).toLocaleDateString() : '—'}</p>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
