import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { DataMapNodeType } from '@/db/db';

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

export function NodeDialog({ open, onOpenChange, nodeType, initialData, onSave }: NodeDialogProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [meta, setMeta] = useState<Record<string, unknown>>({});

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
              <Label className="text-xs">Name</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Enter name..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className="h-7 w-7 rounded-md border-2 transition-all"
                    style={{ backgroundColor: c.value, borderColor: color === c.value ? 'var(--foreground)' : 'transparent' }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea className="min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." />
          </div>

          {/* Organization fields */}
          {nodeType === 'organization' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Industry</Label>
                  <Input value={(meta.industry as string) || ''} onChange={e => setM('industry', e.target.value)} placeholder="Technology..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Location</Label>
                  <Input value={(meta.location as string) || ''} onChange={e => setM('location', e.target.value)} placeholder="City, Country" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact Name</Label>
                  <Input value={(meta.contactName as string) || ''} onChange={e => setM('contactName', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact Email</Label>
                  <Input value={(meta.contactEmail as string) || ''} onChange={e => setM('contactEmail', e.target.value)} />
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
                <Label className="text-xs">Manager</Label>
                <Input value={(meta.manager as string) || ''} onChange={e => setM('manager', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Function</Label>
                <Input value={(meta.function as string) || ''} onChange={e => setM('function', e.target.value)} placeholder="Compliance, IT..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Headcount</Label>
                <Input type="number" value={(meta.headCount as number) || ''} onChange={e => setM('headCount', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          )}

          {/* Process fields */}
          {nodeType === 'process' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Process Type</Label>
                  <Select value={(meta.processType as string) || 'processing'} onValueChange={v => setM('processType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROCESS_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Legal Basis</Label>
                  <Input value={(meta.legalBasis as string) || ''} onChange={e => setM('legalBasis', e.target.value)} placeholder="Consent, Contract..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Retention Period</Label>
                  <Input value={(meta.retentionPeriod as string) || ''} onChange={e => setM('retentionPeriod', e.target.value)} placeholder="5 years" />
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Classification</Label>
                  <Select value={(meta.classification as string) || 'internal'} onValueChange={v => setM('classification', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Severity</Label>
                  <Select value={(meta.severity as string) || 'low'} onValueChange={v => setM('severity', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Importance</Label>
                  <Select value={(meta.importance as string) || 'medium'} onValueChange={v => setM('importance', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{IMPORTANCES.map(i => <SelectItem key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Group</Label>
                  <Input value={(meta.group as string) || ''} onChange={e => setM('group', e.target.value)} placeholder="Customer Records..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Type</Label>
                  <Input value={(meta.dataType as string) || ''} onChange={e => setM('dataType', e.target.value)} placeholder="Personal Data..." />
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
