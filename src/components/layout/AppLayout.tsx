import { Outlet } from 'react-router-dom';
import { Sidebar, BottomTabBar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '@/src/store/uiStore';
import { cn } from '@/src/lib/utils';
import { Toaster } from '@/src/components/ui/sonner';
import { useEffect } from 'react';
import { seedDatabase } from '@/src/db/db';

export function AppLayout() {
  const open = useUIStore((s) => s.sidebarOpen);
  useEffect(() => { seedDatabase(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn('flex min-h-screen flex-col transition-all duration-300 ease-in-out', open ? 'lg:pl-56' : 'pl-0')}>
        <Topbar />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-8 sm:py-8 sm:pb-8 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-4xl">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomTabBar />
      <Toaster />
    </div>
  );
}
