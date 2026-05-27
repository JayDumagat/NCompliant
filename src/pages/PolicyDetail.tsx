import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Download, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { exportPolicyPDF } from '@/lib/exportPdf';
import { diffTokens } from '@/lib/wordDiff';
import { useDataAssets } from '@/hooks/useDataAssets';

const SL: Record<string, string> = { draft: 'Draft', active: 'Active', under_review: 'Review', archived: 'Archived' };
const RF: Record<string, string> = { none: 'No schedule', monthly: 'Monthly', quarterly: 'Quarterly', semi_annual: 'Semi-Annual', annual: 'Annual' };

export default function PolicyDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const policy = useLiveQuery(() => (id ? db.policies.get(id) : undefined), [id]);
  const linked = useLiveQuery(() => (id ? db.tasks.where('policyId').equals(id).toArray() : []), [id]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [compareOpen, setCompareOpen] = useState(false);
  const [leftVersion, setLeftVersion] = useState('1');
  const [rightVersion, setRightVersion] = useState('2');
  const { resolveIds } = useDataAssets();

  const snapshots = policy
    ? [
        ...(policy.versions ?? []),
        {
          version: (policy.versions?.length ?? 0) + 1,
          content: policy.content,
          updatedAt: policy.lastUpdated,
          note: 'Current content',
        },
      ]
    : [];
  const leftSnapshot = snapshots.find((v) => String(v.version) === leftVersion) ?? snapshots[0];
  const rightSnapshot = snapshots.find((v) => String(v.version) === rightVersion) ?? snapshots[snapshots.length - 1];

  if (!policy) return <div className="py-16 text-center text-muted-foreground">Policy not found. <Link to="/policies" className="underline">Back</Link></div>;
  const linkedAssets = resolveIds(policy.dataAssetIds ?? []);

  const edit = () => { setDraft(policy.content); setEditing(true); };
  const save = async () => {
    const v = { version: (policy.versions?.length ?? 0) + 1, content: policy.content, updatedAt: Date.now(), note: 'Content updated' };
    await db.policies.update(policy.id, { content: draft, lastUpdated: Date.now(), versions: [...(policy.versions ?? []), v] });
    setEditing(false);
    toast.success('Policy saved');
  };
  const setStatus = async (s: 'draft' | 'active' | 'under_review' | 'archived') => {
    await db.policies.update(policy.id, { status: s, lastUpdated: Date.now() });
    toast.success(`Status → ${SL[s]}`);
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `policy-${policy.title.toLowerCase().replace(/\s+/g, '-')}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };
  const deletePolicy = async () => {
    await db.policies.delete(policy.id);
    toast.success('Policy deleted');
    nav('/policies');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/policies" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Policies
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{policy.title}</h1>
              <Badge variant="secondary" className="text-[10px]">{SL[policy.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{policy.owner} · {policy.category} · {new Date(policy.lastUpdated).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={() => exportPolicyPDF(policy)}><FileText className="h-3.5 w-3.5" />PDF</Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={exportJSON}><Download className="h-3.5 w-3.5" />JSON</Button>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Delete Policy</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground py-2">Delete "{policy.title}"? This cannot be undone.</p>
                <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={deletePolicy}>Delete</Button></div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History ({policy.versions?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({linked?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Policy Content</p>
            {!editing ? (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={edit}>Edit</Button>
            ) : (
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" className="text-xs h-7" onClick={save}>Save</Button>
              </div>
            )}
          </div>
          {editing
            ? <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[300px] font-mono text-sm" />
            : <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{policy.content}</div>
          }
        </TabsContent>

        <TabsContent value="details" className="mt-6 space-y-0">
          {[
            { label: 'Category', value: policy.category },
            { label: 'Department', value: policy.department || '—' },
            { label: 'Created', value: new Date(policy.createdAt).toLocaleDateString() },
            { label: 'Review Frequency', value: RF[policy.reviewFrequency] || '—' },
            ...(policy.nextReviewDate ? [{ label: 'Next Review', value: new Date(policy.nextReviewDate).toLocaleDateString() }] : []),
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm">{row.value}</span>
            </div>
          ))}
          {policy.tags.length > 0 && (
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-muted-foreground">Tags</span>
              <div className="flex gap-1 flex-wrap">{policy.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
            </div>
          )}
          <div className="py-3 border-b">
            <span className="text-sm text-muted-foreground">Data Assets</span>
            {linkedAssets.length === 0 ? (
              <p className="text-sm mt-1">—</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {linkedAssets.map((asset) => (
                  <Link key={asset.id} to="/data-management">
                    <Badge variant="secondary" className="text-[10px]">{asset.name} · {asset.classification}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {policy.purpose && (
            <div className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Purpose</p>
              <p className="text-sm leading-relaxed">{policy.purpose}</p>
            </div>
          )}
          {policy.scope && (
            <div className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Scope</p>
              <p className="text-sm leading-relaxed">{policy.scope}</p>
            </div>
          )}
          {policy.requirements && (
            <div className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Requirements</p>
              <ul className="space-y-1.5">{policy.requirements.split('\n').filter(Boolean).map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-foreground/30 shrink-0 mt-2" />{r}</li>
              ))}</ul>
            </div>
          )}

          <div className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Status Actions</p>
            <div className="flex gap-2 flex-wrap">
              {policy.status !== 'active' && <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setStatus('active')}>Activate</Button>}
              {policy.status !== 'under_review' && <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setStatus('under_review')}>Review</Button>}
              {policy.status !== 'archived' && <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setStatus('archived')}>Archive</Button>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {!policy.versions?.length ? <p className="text-sm text-muted-foreground py-8 text-center">No version history yet.</p> : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog
                  open={compareOpen}
                  onOpenChange={(open) => {
                    if (open && snapshots.length) {
                      const lastSnapshot = snapshots[snapshots.length - 1];
                      const previousSnapshot = snapshots[Math.max(0, snapshots.length - 2)] ?? lastSnapshot;
                      setLeftVersion(String(previousSnapshot.version));
                      setRightVersion(String(lastSnapshot.version));
                    }
                    setCompareOpen(open);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">Compare Versions</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-5xl">
                    <DialogHeader><DialogTitle>Compare Policy Versions</DialogTitle></DialogHeader>
                    <div className="grid gap-3 sm:grid-cols-2 py-2">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Base</p>
                        <Select value={leftVersion} onValueChange={setLeftVersion}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {snapshots.map((v) => <SelectItem key={`left-${v.version}`} value={String(v.version)}>v{v.version} · {v.note}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Compare</p>
                        <Select value={rightVersion} onValueChange={setRightVersion}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {snapshots.map((v) => <SelectItem key={`right-${v.version}`} value={String(v.version)}>v{v.version} · {v.note}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border">
                        <div className="border-b p-3">
                          <p className="text-xs text-muted-foreground">v{leftSnapshot.version}</p>
                          <p className="text-sm font-medium">{leftSnapshot.note}</p>
                        </div>
                        <div className="max-h-[55vh] overflow-y-auto custom-scrollbar p-3 text-sm whitespace-pre-wrap leading-relaxed">
                          {diffTokens(leftSnapshot.content, rightSnapshot.content, 'removed').map((part, i) => (
                            <span key={`left-part-${i}`} className={part.type === 'removed' ? 'bg-red-200/60 dark:bg-red-900/40 rounded-sm' : ''}>{part.text}</span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border">
                        <div className="border-b p-3">
                          <p className="text-xs text-muted-foreground">v{rightSnapshot.version}</p>
                          <p className="text-sm font-medium">{rightSnapshot.note}</p>
                        </div>
                        <div className="max-h-[55vh] overflow-y-auto custom-scrollbar p-3 text-sm whitespace-pre-wrap leading-relaxed">
                          {diffTokens(leftSnapshot.content, rightSnapshot.content, 'added').map((part, i) => (
                            <span key={`right-part-${i}`} className={part.type === 'added' ? 'bg-emerald-200/60 dark:bg-emerald-900/40 rounded-sm' : ''}>{part.text}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-0">
              {policy.versions.slice().reverse().map((v) => (
                <div key={v.version} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm">{v.note}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(v.updatedAt).toLocaleString()}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">v{v.version}</span>
                </div>
              ))}
            </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          {!linked?.length ? <p className="text-sm text-muted-foreground py-8 text-center">No linked tasks.</p> : (
            <div className="space-y-0">
              {linked.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : 'No due date'}{t.assignedTo ? ` · ${t.assignedTo}` : ''}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{t.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
