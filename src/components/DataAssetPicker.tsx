import { useMemo, useState } from 'react';
import { db, type DataAsset } from '@/db/db';
import { useDataAssets } from '@/hooks/useDataAssets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CLASS_COLORS: Record<DataAsset['classification'], string> = {
  public: 'bg-sky-500/10 text-sky-700',
  internal: 'bg-violet-500/10 text-violet-700',
  confidential: 'bg-amber-500/10 text-amber-700',
  restricted: 'bg-destructive/10 text-destructive',
};

interface DataAssetPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
}

export function DataAssetPicker({ value, onChange, label = 'Data Assets' }: DataAssetPickerProps) {
  const { assets, resolveIds } = useDataAssets();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    dataType: '',
    group: '',
    classification: 'internal' as DataAsset['classification'],
  });

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return assets.filter((asset) => `${asset.name} ${asset.dataType} ${asset.group}`.toLowerCase().includes(query));
  }, [assets, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, DataAsset[]>();
    filtered.forEach((asset) => {
      const key = asset.group || 'Ungrouped';
      const list = map.get(key) ?? [];
      list.push(asset);
      map.set(key, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const selected = resolveIds(value);

  const toggle = (id: string, checked: boolean) => {
    if (checked) onChange(Array.from(new Set([...value, id])));
    else onChange(value.filter((v) => v !== id));
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  const createAsset = async () => {
    if (!newAsset.name || !newAsset.dataType || !newAsset.group) return;
    const id = crypto.randomUUID();
    await db.dataAssets.add({
      id,
      workspaceId: 'ws-default',
      name: newAsset.name,
      description: '',
      dataType: newAsset.dataType,
      classification: newAsset.classification,
      group: newAsset.group,
      tags: [],
      owner: '',
      retentionPolicy: '',
      status: 'active',
      createdAt: Date.now(),
    });
    onChange(Array.from(new Set([...value, id])));
    setCreateOpen(false);
    setNewAsset({ name: '', dataType: '', group: '', classification: 'internal' });
    toast.success('Data asset created');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCreateOpen(true)}>+ Create New</Button>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search data assets..." />
      <div className="max-h-44 overflow-y-auto rounded-md border p-2 space-y-3">
        {grouped.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1 py-2">No data assets found.</p>
        ) : (
          grouped.map(([group, list]) => (
            <div key={group} className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">{group}</p>
              {list.map((asset) => {
                const checked = value.includes(asset.id);
                return (
                  <label key={asset.id} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/60 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={(v) => toggle(asset.id, v === true)} />
                    <span className="text-sm flex-1">{asset.name}</span>
                    <Badge className={cn('border-0 text-[10px]', CLASS_COLORS[asset.classification])}>{asset.classification}</Badge>
                  </label>
                );
              })}
            </div>
          ))
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((asset) => (
            <Badge key={asset.id} variant="secondary" className="gap-1">
              {asset.name}
              <button type="button" onClick={() => remove(asset.id)}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Data Asset</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>Name</Label><Input value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Data Type</Label><Input value={newAsset.dataType} onChange={(e) => setNewAsset({ ...newAsset, dataType: e.target.value })} /></div>
            <div className="space-y-2"><Label>Group</Label><Input value={newAsset.group} onChange={(e) => setNewAsset({ ...newAsset, group: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Classification</Label>
              <Select value={newAsset.classification} onValueChange={(v) => setNewAsset({ ...newAsset, classification: v as DataAsset['classification'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createAsset} disabled={!newAsset.name || !newAsset.dataType || !newAsset.group}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
