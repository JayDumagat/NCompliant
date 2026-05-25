import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Zap, Eye, EyeOff, Sun, Moon, Monitor, ArrowRight, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { theme, setTheme } = useUIStore();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    setLoading(true);
    const result = await login(data.email, data.password);
    setLoading(false);
    if (!result.success) {
      setServerError(result.error || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative gradient-mesh items-center justify-center p-12">
        <div className="grid-pattern absolute inset-0 pointer-events-none opacity-10" />
        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-2 mb-10">
            <Zap className="h-6 w-6" />
            <span className="text-lg font-semibold tracking-tight">NCompliant</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight leading-tight mb-4">
            Welcome back.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed mb-10">
            Sign in to access your compliance dashboard, manage policies, track assessments, and keep your organization audit-ready.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: Shield, text: 'End-to-end privacy — your data never leaves your device' },
              { icon: Zap, text: 'Instant offline access to all your compliance data' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 mt-0.5">
                  <f.icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">NCompliant</span>
          </Link>
          <div className="lg:hidden" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cycleTheme} title={`Theme: ${theme}`}>
              <ThemeIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-sm">
            <div className="fade-in-up mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your credentials to access your account.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive fade-in-up">
                  {serverError}
                </div>
              )}

              <div className="space-y-1.5 fade-in-up" data-delay="1">
                <Label htmlFor="login-email" className="text-xs font-medium">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
                  {...register('email', { required: 'Email is required.', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email.' } })}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5 fade-in-up" data-delay="2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-medium">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn('pr-9', errors.password && 'border-destructive focus-visible:ring-destructive')}
                    {...register('password', { required: 'Password is required.' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex items-center gap-2 fade-in-up" data-delay="3">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                  Remember me
                </label>
              </div>

              <Button type="submit" className="w-full gap-2 fade-in-up" data-delay="4" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground fade-in-up" data-delay="5">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
