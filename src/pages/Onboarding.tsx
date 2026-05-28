import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowRight, Building2, CheckCircle2,
  FileText, ClipboardCheck, AlertTriangle, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { db, WS_DEFAULT_ID } from '@/db/db';
import { cn } from '@/lib/utils';

const FEATURE_HIGHLIGHTS = [
  { icon: FileText, title: 'Policy Management', desc: 'Create and maintain compliance policies with version history.' },
  { icon: ClipboardCheck, title: 'Risk Assessments', desc: 'Run PIAs, security checklists, and risk evaluations.' },
  { icon: AlertTriangle, title: 'Incident Tracking', desc: 'Log and resolve security and compliance incidents.' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Track compliance posture and generate audit-ready reports.' },
];

type Step = 'welcome' | 'workspace' | 'done';

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<Step>('welcome');
  const [workspaceName, setWorkspaceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  async function handleWorkspaceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = workspaceName.trim();
    if (!name) {
      setError('Please enter a workspace name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const existing = await db.workspaces.get(WS_DEFAULT_ID);
      if (existing) {
        await db.workspaces.update(WS_DEFAULT_ID, { name });
      } else {
        await db.workspaces.add({ id: WS_DEFAULT_ID, name, createdAt: Date.now() });
      }
      setStep('done');
    } catch {
      setError('Failed to save workspace. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleFinish() {
    completeOnboarding();
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold tracking-tight">NCompliant</span>
          </div>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            {(['welcome', 'workspace', 'done'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : (['welcome', 'workspace', 'done'].indexOf(step) > i)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground',
                )}>
                  {(['welcome', 'workspace', 'done'].indexOf(step) > i)
                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : i + 1}
                </div>
                <span className={cn(
                  'text-xs hidden sm:block',
                  step === s ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}>
                  {s === 'welcome' ? 'Welcome' : s === 'workspace' ? 'Set Up Workspace' : 'All Set'}
                </span>
                {i < 2 && <div className="h-px w-6 bg-border hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Step 1: Welcome */}
          {step === 'welcome' && (
            <div className="fade-in-up space-y-8">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Welcome, {firstName}! 👋
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  You're all set up. Let's take a quick look at what NCompliant can do for you.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURE_HIGHLIGHTS.map((f) => (
                  <div key={f.title} className="rounded-xl border bg-card p-4 flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{f.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full gap-2" size="lg" onClick={() => setStep('workspace')}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Workspace Setup */}
          {step === 'workspace' && (
            <div className="fade-in-up space-y-8">
              <div className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Set up your workspace</h2>
                <p className="text-sm text-muted-foreground">
                  Give your workspace a name so it's easy to identify throughout the app.
                </p>
              </div>

              <form onSubmit={handleWorkspaceSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="workspace-name" className="text-xs font-medium">
                    Organization / Workspace Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="workspace-name"
                    type="text"
                    placeholder="Acme Corp"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">This will appear throughout the app.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep('welcome')} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={saving}>
                    {saving ? 'Saving…' : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="fade-in-up space-y-8 text-center">
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">You're all set!</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Your workspace is ready. Start by adding policies, running assessments, or exploring your dashboard.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-5 text-left space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick start ideas</p>
                <div className="space-y-2">
                  {[
                    'Create your first compliance policy',
                    'Add a data asset to your inventory',
                    'Run a Privacy Impact Assessment',
                    'Invite team members and assign tasks',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full gap-2" size="lg" onClick={handleFinish}>
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
