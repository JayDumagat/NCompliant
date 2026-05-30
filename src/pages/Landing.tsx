import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Zap, FileText, ClipboardCheck, CheckSquare,
  AlertTriangle, GraduationCap, Building2, ArrowRight,
  BarChart3, Lock, Globe, Sun, Moon, Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

/* ── Intersection Observer hook for scroll animations ── */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); obs.unobserve(el); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, isInView };
}

/* ── Animated counter ── */
function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView();
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

const FEATURES = [
  { icon: FileText, title: 'Policy Management', desc: 'Create, version, and review compliance policies with full audit trails.' },
  { icon: ClipboardCheck, title: 'Risk Assessments', desc: 'Run PIAs, security checklists, and risk evaluations with guided workflows.' },
  { icon: CheckSquare, title: 'Task Tracking', desc: 'Assign, prioritize, and track compliance tasks with deadline monitoring.' },
  { icon: AlertTriangle, title: 'Incident Response', desc: 'Log and manage security incidents with linked remediation actions.' },
  { icon: GraduationCap, title: 'Training Records', desc: 'Track employee certifications, expirations, and compliance training.' },
  { icon: Building2, title: 'Vendor Management', desc: 'Assess third-party risk, manage vendor compliance, and track assessments.' },
];

const STATS = [
  { value: 100, suffix: '+', label: 'Policies Managed' },
  { value: 99, suffix: '.9%', label: 'Uptime SLA' },
  { value: 50, suffix: '+', label: 'Assessment Templates' },
  { value: 24, suffix: '/7', label: 'Offline Access' },
];

const STEPS = [
  { num: '01', title: 'Set Up Policies', desc: 'Import or create your compliance policies and assign owners.' },
  { num: '02', title: 'Run Assessments', desc: 'Conduct risk assessments, PIAs, and security checklists.' },
  { num: '03', title: 'Stay Compliant', desc: 'Track tasks, monitor deadlines, and generate audit-ready reports.' },
];

export default function Landing() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else if (theme === 'light') document.documentElement.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  const features = useInView();
  const stats = useInView();
  const steps = useInView();
  const cta = useInView();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold tracking-tight">NCompliant</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cycleTheme} title={`Theme: ${theme}`} aria-label={`Theme: ${theme}`}>
              <ThemeIcon className="h-4 w-4" />
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm h-8">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-sm h-8">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="grid-pattern absolute inset-0 pointer-events-none" />
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-chart-2/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 py-24 sm:py-36 text-center">
          <div className="fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs text-muted-foreground shadow-sm">
              <Lock className="h-3 w-3" />
              Privacy-first · Offline-ready · Open source
            </div>
          </div>

          <h1 className="fade-in-up text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]" data-delay="1">
            Compliance management{' '}
            <span className="gradient-text">you can trust.</span>
          </h1>

          <p className="fade-in-up mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed" data-delay="2">
            NCompliant helps your team manage policies, run assessments, track incidents,
            and stay audit-ready — all from a single, privacy-first platform that works offline.
          </p>

          <div className="fade-in-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-3" data-delay="3">
            <Link to="/register">
              <Button size="lg" className="gap-2 text-sm px-6 glow-primary relative">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="gap-2 text-sm px-6">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Hero illustration — abstract dashboard preview */}
          <div className="fade-in-up mt-16 mx-auto max-w-3xl" data-delay="4">
            <div className="rounded-xl border bg-card shadow-2xl shadow-primary/5 p-1">
              <div className="rounded-lg bg-muted/30 p-4 sm:p-6">
                {/* Simulated dashboard preview */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <div className="h-2 flex-1 max-w-32 rounded bg-muted ml-4" />
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[85, 72, 93, 68].map((v, i) => (
                    <div key={i} className="rounded-md bg-card p-3 border">
                      <div className="h-1.5 w-10 rounded bg-muted mb-2" />
                      <div className="text-lg font-semibold tabular-nums text-primary">{v}%</div>
                      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-md bg-card p-3 border space-y-2">
                      <div className="h-1.5 w-16 rounded bg-muted" />
                      <div className="h-1.5 w-24 rounded bg-muted/60" />
                      <div className="h-1.5 w-12 rounded bg-muted/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={features.ref} className="relative border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <div className={cn('text-center mb-14', features.isInView && 'fade-in-up')}>
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-2">Features</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Everything you need to stay compliant</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              A comprehensive toolkit designed for compliance officers, DPOs, and risk teams.
            </p>
          </div>

          <div className={cn('grid sm:grid-cols-2 lg:grid-cols-3 gap-4', features.isInView && 'stagger-children')}>
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={stats.ref} className="border-t">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-8 text-center', stats.isInView && 'fade-in-up')}>
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums text-primary">
                  <Counter end={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section ref={steps.ref} className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28">
          <div className={cn('text-center mb-14', steps.isInView && 'fade-in-up')}>
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-2">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Get started in minutes</h2>
          </div>

          <div className={cn('grid sm:grid-cols-3 gap-6', steps.isInView && 'stagger-children')}>
            {STEPS.map((s) => (
              <div key={s.num} className="relative rounded-xl border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {s.num}
                </div>
                <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights row ── */}
      <section className="border-t">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Lock, title: 'Privacy First', desc: 'Your data stays on your device. No cloud dependency required.' },
              { icon: Globe, title: 'Works Offline', desc: 'Full functionality even without an internet connection.' },
              { icon: BarChart3, title: 'Audit Ready', desc: 'Generate reports and maintain audit trails effortlessly.' },
            ].map((h) => (
              <div key={h.title} className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <h.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{h.title}</h3>
                <p className="text-xs text-muted-foreground">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={cta.ref} className="border-t">
        <div className={cn('mx-auto max-w-4xl px-4 py-20 sm:py-28 text-center', cta.isInView && 'fade-in-up')}>
          <div className="rounded-2xl gradient-mesh p-10 sm:p-16 text-white relative overflow-hidden">
            <div className="grid-pattern absolute inset-0 pointer-events-none opacity-10" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Ready to simplify compliance?
              </h2>
              <p className="text-sm text-white/70 max-w-md mx-auto mb-8">
                Join organizations that trust NCompliant for privacy-first, offline-ready compliance management.
              </p>
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2 text-sm px-6">
                  Create Your Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold tracking-tight">NCompliant</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
              <span>Privacy-first compliance</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} NCompliant. Built with privacy at the core.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
