import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, BottomTabBar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { seedDatabase } from '@/db/db';

const FULL_WIDTH_ROUTES = ['/data-mapping'];

export function AppLayout() {
  const open = useUIStore((s) => s.sidebarOpen);
  const location = useLocation();
  const isFullWidth = FULL_WIDTH_ROUTES.some(r => location.pathname.startsWith(r));
  useEffect(() => { seedDatabase(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn('flex min-h-screen flex-col transition-all duration-300 ease-in-out', open ? 'lg:pl-56' : 'pl-0')}>
        <Topbar />
        <main className={cn(
          'flex-1',
          isFullWidth
            ? 'p-0'
            : 'px-4 py-6 pb-24 sm:px-8 sm:py-8 sm:pb-8 lg:px-10 lg:py-8'
        )}>
          {isFullWidth ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-4xl">
              <Outlet />
            </div>
          )}
        </main>
      </div>
      <BottomTabBar />
      <Toaster />
    </div>
  );
}

