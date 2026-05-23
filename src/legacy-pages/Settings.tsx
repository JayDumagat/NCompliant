import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Workspace } from '@/src/db/db';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Separator } from '@/src/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { useUIStore } from '@/src/store/uiStore';
import { Plus, Download, Upload, Trash2, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

function NewWorkspaceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { setActiveWorkspaceId } = useUIStore();
  const save = async () => {
    const id = crypto.randomUUID();
    await db.workspaces.add({ id, name, createdAt: Date.now() });
    setActiveWorkspaceId(id);
    toast.success('Workspace created');
    setOpen(false); setName('');
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />New Workspace</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Workspace</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2"><Label>Workspace Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="My Organization" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={!name}>Create</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteWSDialog({ ws }: { ws: Workspace }) {
  const [open, setOpen] = useState(false);
  const del = async () => { await db.workspaces.delete(ws.id); toast.success('Workspace deleted'); setOpen(false); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Delete Workspace</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground py-2">Delete "{ws.name}"? Data associated with this workspace will remain but become unlinked.</p>
        <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="destructive" onClick={del}>Delete</Button></div>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const workspaces = useLiveQuery(() => db.workspaces.toArray(), []);
  const { activeWorkspaceId, setActiveWorkspaceId, theme, setTheme } = useUIStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportWorkspace = async () => {
    const data = {
      workspaces: await db.workspaces.toArray(), policies: await db.policies.toArray(),
      tasks: await db.tasks.toArray(), updates: await db.updates.toArray(),
      assessments: await db.assessments.toArray(),
      taskTemplates: await db.taskTemplates.toArray(),
      checklists: await db.checklists.toArray(),
      trainingRecords: await db.trainingRecords.toArray(),
      incidents: await db.incidents.toArray(),
      reports: await db.reports.toArray(),
      exportedAt: new Date().toISOString(), version: '2.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ncompliant-export-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url); toast.success('Workspace exported');
  };

  const importWorkspace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text(); const data = JSON.parse(text);
      if (data.workspaces) await db.workspaces.bulkPut(data.workspaces);
      if (data.policies) await db.policies.bulkPut(data.policies);
      if (data.tasks) await db.tasks.bulkPut(data.tasks);
      if (data.updates) await db.updates.bulkPut(data.updates);
      if (data.assessments) await db.assessments.bulkPut(data.assessments);
      if (data.taskTemplates) await db.taskTemplates.bulkPut(data.taskTemplates);
      if (data.checklists) await db.checklists.bulkPut(data.checklists);
      if (data.trainingRecords) await db.trainingRecords.bulkPut(data.trainingRecords);
      if (data.incidents) await db.incidents.bulkPut(data.incidents);
      if (data.reports) await db.reports.bulkPut(data.reports);
      toast.success('Workspace imported successfully');
    } catch { toast.error('Invalid file format'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleTheme = (val: string) => {
    setTheme(val as 'light' | 'dark' | 'system');
    if (val === 'dark') document.documentElement.classList.add('dark');
    else if (val === 'light') document.documentElement.classList.remove('dark');
    else { document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches); }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage workspaces, preferences, and data.</p>
      </div>

      {/* Workspaces */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Workspaces</CardTitle>
          <NewWorkspaceDialog />
        </CardHeader>
        <CardContent className="space-y-3">
          {workspaces?.map(ws => (
            <div key={ws.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">{ws.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Created {new Date(ws.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {activeWorkspaceId === ws.id
                  ? <Badge className="gap-1.5"><Check className="h-3 w-3" />Active</Badge>
                  : <Button variant="outline" size="sm" onClick={() => { setActiveWorkspaceId(ws.id); toast.success('Workspace switched'); }}>Switch</Button>
                }
                <DeleteWSDialog ws={ws} />
              </div>
            </div>
          ))}
          {!workspaces?.length && <p className="text-sm text-muted-foreground py-8 text-center">No workspaces created yet.</p>}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader><CardTitle className="text-base">Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-sm text-muted-foreground mt-0.5">Choose your preferred appearance.</p>
            </div>
            <Select value={theme} onValueChange={handleTheme}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader><CardTitle className="text-base">Data Management</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export workspace</p>
              <p className="text-sm text-muted-foreground mt-0.5">Download all data as a JSON file.</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={exportWorkspace}><Download className="h-4 w-4" />Export</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Import workspace</p>
              <p className="text-sm text-muted-foreground mt-0.5">Restore data from a previously exported JSON file.</p>
            </div>
            <div>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importWorkspace} />
              <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />Import</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border">
              <Shield className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">NCompliant</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Privacy-first, offline-first compliance management system. All data is stored locally on your device.
            No information is transmitted externally unless you explicitly export or opt into network features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
