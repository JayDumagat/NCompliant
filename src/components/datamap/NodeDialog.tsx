import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DataMapNodeType } from '@/db/db';

interface NodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: DataMapNodeType;
  initialData?: {
    label: string;
    description: string;
    color: string;
    metadata: Record<string, unknown>;
  };
  onSave: (data: { label: string; description: string; color: string; metadata: Record<string, unknown> }) => void;
}

const COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#6b7280', label: 'Gray' },
];

const PROCESS_TYPES = ['collection', 'processing', 'storage', 'transfer', 'deletion'];
const CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const IMPORTANCES = ['low', 'medium', 'high'];

const CLASSIFICATION_TO_SEVERITY: Record<string, string> = {
  public: 'low',
  internal: 'low',
  confidential: 'high',
  restricted: 'critical',
};

export function NodeDialog({ open, onOpenChange, nodeType, initialData, onSave }: NodeDialogProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const dataAssets = useLiveQuery(() => db.dataAssets.toArray(), []) ?? [];

  useEffect(() => {
    if (open) {
      if (initialData) {
        setLabel(initialData.label);
        setDescription(initialData.description);
        setColor(initialData.color);
        setMeta({ ...initialData.metadata });
      } else {
        setLabel('');
        setDescription('');
        setColor('#3b82f6');
        setMeta(nodeType === 'process' ? { processType: 'processing', automated: false } : nodeType === 'data_item' ? { classification: 'internal', severity: 'low', importance: 'medium' } : {});
      }
    }
  }, [open, initialData, nodeType]);

  const setM = (key: string, value: unknown) => setMeta(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({ label: label.trim(), description: description.trim(), color, metadata: meta });
  };

  const titles: Record<DataMapNodeType, string> = {
    organization: initialData ? 'Edit Organization' : 'Add Organization',
    department: initialData ? 'Edit Department' : 'Add Department',
    process: initialData ? 'Edit Process' : 'Add Process',
    data_item: initialData ? 'Edit Data Item' : 'Add Data Item',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{titles[nodeType]}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          {/* Common fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <Label htmlFor="nd-name" className="text-xs">Name</Label>
                <Input id="nd-name" value={label} onChange={e => setLabel(e.target.value)} placeholder="Enter name..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className="h-7 w-7 rounded-md border-2 transition-all"
                    style={{ backgroundColor: c.value, borderColor: color === c.value ? 'var(--foreground)' : 'transparent' }}
                    title={c.label}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nd-description" className="text-xs">Description</Label>
            <Textarea id="nd-description" className="min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." />
          </div>

          {/* Organization fields */}
          {nodeType === 'organization' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nd-industry" className="text-xs">Industry</Label>
                  <Input id="nd-industry" value={(meta.industry as string) || ''} onChange={e => setM('industry', e.target.value)} placeholder="Technology..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nd-location" className="text-xs">Location</Label>
                  <Input id="nd-location" value={(meta.location as string) || ''} onChange={e => setM('location', e.target.value)} placeholder="City, Country" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nd-contactName" className="text-xs">Contact Name</Label>
                  <Input id="nd-contactName" value={(meta.contactName as string) || ''} onChange={e => setM('contactName', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nd-contactEmail" className="text-xs">Contact Email</Label>
                  <Input id="nd-contactEmail" value={(meta.contactEmail as string) || ''} onChange={e => setM('contactEmail', e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="nd-external" checked={!!meta.external} onCheckedChange={v => setM('external', v === true)} />
                <label htmlFor="nd-external" className="text-xs text-muted-foreground cursor-pointer">External organization</label>
              </div>
            </div>
          )}

          {/* Department fields */}
          {nodeType === 'department' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nd-manager" className="text-xs">Manager</Label>
                <Input id="nd-manager" value={(meta.manager as string) || ''} onChange={e => setM('manager', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nd-function" className="text-xs">Function</Label>
                <Input id="nd-function" value={(meta.function as string) || ''} onChange={e => setM('function', e.target.value)} placeholder="Compliance, IT..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nd-headCount" className="text-xs">Headcount</Label>
                <Input id="nd-headCount" type="number" value={(meta.headCount as number) || ''} onChange={e => setM('headCount', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* Process fields */}
          {nodeType === 'process' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nd-processType" className="text-xs">Process Type</Label>
                  <Select value={(meta.processType as string) || 'processing'} onValueChange={v => setM('processType', v)}>
                    <SelectTrigger id="nd-processType"><SelectValue /></SelectTrigger>
                    <SelectContent>{PROCESS_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nd-legalBasis" className="text-xs">Legal Basis</Label>
                  <Input id="nd-legalBasis" value={(meta.legalBasis as string) || ''} onChange={e => setM('legalBasis', e.target.value)} placeholder="Consent, Contract..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nd-retentionPeriod" className="text-xs">Retention Period</Label>
                  <Input id="nd-retentionPeriod" value={(meta.retentionPeriod as string) || ''} onChange={e => setM('retentionPeriod', e.target.value)} placeholder="5 years" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Checkbox id="nd-auto" checked={!!meta.automated} onCheckedChange={v => setM('automated', v === true)} />
                  <label htmlFor="nd-auto" className="text-xs text-muted-foreground cursor-pointer">Automated process</label>
                </div>
              </div>
            </div>
          )}

          {/* Data Item fields */}
          {nodeType === 'data_item' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-3">
                  <Label htmlFor="nd-linkedDataAsset" className="text-xs">Linked Data Asset (optional)</Label>
                  <Select
                    value={(meta.dataAssetId as string) || 'none'}
                    onValueChange={(v) => {
                      if (v === 'none') {
                        setM('dataAssetId', undefined);
                        return;
                      }
                      const linked = dataAssets.find((asset) => asset.id === v);
                      if (!linked) return;
                      setMeta((prev) => ({
                        ...prev,
                        dataAssetId: linked.id,
                        classification: linked.classification,
                        severity: CLASSIFICATION_TO_SEVERITY[linked.classification] ?? 'low',
                        group: linked.group,
                        dataType: linked.dataType,
                      }));
                    }}
                  >
                    <SelectTrigger id="nd-linkedDataAsset"><SelectValue placeholder="Choose from Data Inventory" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {dataAssets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>{asset.name} · {asset.group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nd-classification" className="text-xs">Classification</Label>
                  <Select value={(meta.classification as string) || 'internal'} onValueChange={v => setM('classification', v)}>
                    <SelectTrigger id="nd-classification"><SelectValue /></SelectTrigger>
                    <SelectContent>{CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nd-severity" className="text-xs">Severity</Label>
                  <Select value={(meta.severity as string) || 'low'} onValueChange={v => setM('severity', v)}>
                    <SelectTrigger id="nd-severity"><SelectValue /></SelectTrigger>
                    <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nd-importance" className="text-xs">Importance</Label>
                  <Select value={(meta.importance as string) || 'medium'} onValueChange={v => setM('importance', v)}>
                    <SelectTrigger id="nd-importance"><SelectValue /></SelectTrigger>
                    <SelectContent>{IMPORTANCES.map(i => <SelectItem key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nd-group" className="text-xs">Group</Label>
                  <Input id="nd-group" value={(meta.group as string) || ''} onChange={e => setM('group', e.target.value)} placeholder="Customer Records..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nd-dataType" className="text-xs">Data Type</Label>
                  <Input id="nd-dataType" value={(meta.dataType as string) || ''} onChange={e => setM('dataType', e.target.value)} placeholder="Personal Data..." />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!label.trim()}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
