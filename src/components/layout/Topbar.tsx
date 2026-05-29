import { Menu, WifiOff, Sun, Moon, Monitor, Download, Zap, User, Settings, LogOut, CalendarClock } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { sidebarOpen, toggleSidebar, theme, setTheme } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else if (theme === 'light') document.documentElement.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt();
    setInstallPrompt(null);
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;
  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Mobile: branding */}
      <div className="flex items-center gap-2 lg:hidden">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-semibold tracking-tight">NCompliant</span>
      </div>
      {/* Desktop sidebar toggle */}
      {!sidebarOpen && (
        <Button variant="ghost" size="icon" className="h-8 w-8 hidden lg:flex" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        {installPrompt && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs hidden sm:flex h-7" onClick={handleInstall}>
            <Download className="h-3.5 w-3.5" />Install
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cycleTheme} title={`Theme: ${theme}`}>
          <ThemeIcon className="h-4 w-4" />
        </Button>
        {offline && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <WifiOff className="h-3.5 w-3.5" />
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-[11px] font-medium">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <p className="text-sm">{user?.name || 'Account'}</p>
              <p className="text-xs text-muted-foreground font-normal">{user?.email || ''}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/profile')}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/reminders')}>
              <CalendarClock className="h-4 w-4" />
              Reminders
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
