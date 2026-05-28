import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Zap, Eye, EyeOff, Sun, Moon, Monitor, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
  terms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});
type RegisterForm = z.infer<typeof registerSchema>;

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  return { score: 5, label: 'Excellent', color: 'bg-emerald-600' };
}

export default function Register() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding);
  const { theme, setTheme } = useUIStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(needsOnboarding ? '/onboard' : '/dashboard', { replace: true });
  }, [isAuthenticated, needsOnboarding, navigate]);

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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', terms: false },
  });

  const watchPassword = watch('password', '');
  const strength = useMemo(() => getPasswordStrength(watchPassword), [watchPassword]);

  const onSubmit = async (data: RegisterForm) => {
    if (!termsChecked) {
      setServerError('Please accept the terms and conditions.');
      return;
    }
    setServerError('');
    setLoading(true);
    const result = await registerUser(data.name, data.email, data.password);
    setLoading(false);
    if (!result.success) {
      setServerError(result.error || 'Registration failed.');
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
            Start managing compliance today.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed mb-10">
            Create your account and immediately get access to policy management, risk assessments, task tracking, and everything you need to stay audit-ready.
          </p>

          {/* Benefits list */}
          <div className="space-y-3">
            {[
              'Privacy-first — all data stored locally on your device',
              'Works offline — no internet connection required',
              'Full-featured — policies, assessments, incidents & more',
              'Audit-ready — generate reports with one click',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-300" />
                <p className="text-xs text-white/60 leading-relaxed">{text}</p>
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
              <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Set up your compliance workspace in seconds.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive fade-in-up">
                  {serverError}
                </div>
              )}

              <div className="space-y-1.5 fade-in-up" data-delay="1">
                <Label htmlFor="register-name" className="text-xs font-medium">Full Name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
                  {...register('name', { required: 'Name is required.', minLength: { value: 2, message: 'At least 2 characters.' } })}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5 fade-in-up" data-delay="2">
                <Label htmlFor="register-email" className="text-xs font-medium">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
                  {...register('email', { required: 'Email is required.', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email.' } })}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5 fade-in-up" data-delay="3">
                <Label htmlFor="register-password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={cn('pr-9', errors.password && 'border-destructive focus-visible:ring-destructive')}
                    {...register('password', { required: 'Password is required.', minLength: { value: 8, message: 'At least 8 characters.' } })}
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

                {/* Password strength */}
                {watchPassword.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn('strength-bar flex-1', i <= strength.score ? strength.color : 'bg-muted')}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{strength.label}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 fade-in-up" data-delay="4">
                <Label htmlFor="register-confirm" className="text-xs font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="register-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={cn('pr-9', errors.confirmPassword && 'border-destructive focus-visible:ring-destructive')}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password.',
                      validate: (value) => value === watchPassword || 'Passwords do not match.',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex items-start gap-2 fade-in-up" data-delay="5">
                <Checkbox
                  id="terms"
                  checked={termsChecked}
                  onCheckedChange={(checked) => setTermsChecked(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <span className="text-primary hover:underline">Terms of Service</span>{' '}
                  and{' '}
                  <span className="text-primary hover:underline">Privacy Policy</span>
                </label>
              </div>

              <Button type="submit" className="w-full gap-2 fade-in-up" data-delay="6" disabled={loading || !termsChecked}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground fade-in-up" data-delay="6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
