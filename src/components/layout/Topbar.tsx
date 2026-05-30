import { Menu, WifiOff, Sun, Moon, Monitor, Download, Zap } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

// Avatar dropdown moved to sidebar

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function Topbar() {
  const { sidebarOpen, toggleSidebar, theme, setTheme } = useUIStore();
  // Avatar/menu moved to Sidebar; no auth/navigation usage here
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

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
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

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
        {/* Avatar/menu moved to sidebar; nothing rendered here */}
      </div>
    </header>
  );
}
