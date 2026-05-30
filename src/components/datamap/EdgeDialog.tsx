import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface EdgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    label: string;
    dataTypes: string[];
    animated: boolean;
  };
  onSave: (data: { label: string; dataTypes: string[]; animated: boolean }) => void;
}

export function EdgeDialog({ open, onOpenChange, initialData, onSave }: EdgeDialogProps) {
  const [label, setLabel] = useState('');
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [typeInput, setTypeInput] = useState('');
  const [animated, setAnimated] = useState(true);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setLabel(initialData.label);
        setDataTypes([...initialData.dataTypes]);
        setAnimated(initialData.animated);
      } else {
        setLabel('');
        setDataTypes([]);
        setAnimated(true);
      }
      setTypeInput('');
    }
  }, [open, initialData]);

  const addType = () => {
    const trimmed = typeInput.trim();
    if (trimmed && !dataTypes.includes(trimmed)) {
      setDataTypes(prev => [...prev, trimmed]);
    }
    setTypeInput('');
  };

  const removeType = (t: string) => setDataTypes(prev => prev.filter(x => x !== t));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addType(); }
  };

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({ label: label.trim(), dataTypes, animated });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{initialData ? 'Edit Connection' : 'New Connection'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edge-label" className="text-xs">Label</Label>
            <Input id="edge-label" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Payment Processing" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edge-typeInput" className="text-xs">Data Types</Label>
            <div className="flex gap-2">
              <Input
                value={typeInput}
                id="edge-typeInput"
                onChange={e => setTypeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add data type and press Enter"
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addType} disabled={!typeInput.trim()}>Add</Button>
            </div>
            {dataTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {dataTypes.map(t => (
                  <Badge key={t} variant="secondary" className="gap-1 text-xs pr-1">
                    {t}
                    <button type="button" onClick={() => removeType(t)} aria-label={`Remove ${t}`} className="ml-0.5 hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="edge-animated" checked={animated} onCheckedChange={v => setAnimated(v === true)} />
            <label htmlFor="edge-animated" className="text-xs text-muted-foreground cursor-pointer">Animated flow</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!label.trim()}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
