import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, ClipboardCheck, Settings, PanelLeftClose, ListChecks, LayoutTemplate, GraduationCap, AlertTriangle, BarChart3, FileBarChart, Bell, MoreHorizontal, Zap, Building2, Database } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useUIStore } from '@/src/store/uiStore';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/src/components/ui/sheet';
import { useState } from 'react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: FileText, label: 'Policies', to: '/policies' },
  { icon: ClipboardCheck, label: 'Assessments', to: '/assessments' },
  { icon: CheckSquare, label: 'Tasks', to: '/tasks' },
  { icon: ListChecks, label: 'Checklists', to: '/checklists' },
  { icon: LayoutTemplate, label: 'Templates', to: '/templates' },
  { icon: AlertTriangle, label: 'Incidents', to: '/incidents' },
  { icon: BarChart3, label: 'Analytics', to: '/analytics' },
  { icon: FileBarChart, label: 'Reports', to: '/reports' },
  { icon: GraduationCap, label: 'Training', to: '/training' },
  { icon: Building2, label: 'Vendors', to: '/vendors' },
  { icon: Database, label: 'Data', to: '/data-management' },
  { icon: Bell, label: 'Updates', to: '/updates' },
];

function NavLink({ item, onClick }: { item: typeof NAV_ITEMS[0]; onClick?: () => void }) {
  const loc = useLocation();
  const active = item.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(item.to);
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] transition-colors',
        active
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

/** Desktop sidebar */
export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const loc = useLocation();
  if (!sidebarOpen) return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden lg:flex w-56 flex-col border-r bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-semibold tracking-tight">NCompliant</span>
        </Link>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={toggleSidebar}>
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>
      </ScrollArea>
      <div className="px-2 py-3 border-t">
        <Link to="/settings" className={cn(
          'flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] transition-colors',
          loc.pathname === '/settings' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
        )}>
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

/* ── Bottom Tab Bar (Mobile) ── */
const BOTTOM_TABS = [
  { icon: LayoutDashboard, label: 'Home', to: '/' },
  { icon: FileText, label: 'Policies', to: '/policies' },
  { icon: ClipboardCheck, label: 'Assess', to: '/assessments' },
  { icon: CheckSquare, label: 'Tasks', to: '/tasks' },
  { icon: MoreHorizontal, label: 'More', to: '__more__' },
];

const MORE_ITEMS = [
  { icon: ListChecks, label: 'Checklists', to: '/checklists' },
  { icon: LayoutTemplate, label: 'Templates', to: '/templates' },
  { icon: AlertTriangle, label: 'Incidents', to: '/incidents' },
  { icon: BarChart3, label: 'Analytics', to: '/analytics' },
  { icon: FileBarChart, label: 'Reports', to: '/reports' },
  { icon: GraduationCap, label: 'Training', to: '/training' },
  { icon: Building2, label: 'Vendors', to: '/vendors' },
  { icon: Database, label: 'Data', to: '/data-management' },
  { icon: Bell, label: 'Updates', to: '/updates' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export function BottomTabBar() {
  const loc = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-background safe-bottom">
        <div className="flex items-stretch">
          {BOTTOM_TABS.map(tab => {
            if (tab.to === '__more__') {
              const isMoreActive = MORE_ITEMS.some(m => loc.pathname.startsWith(m.to));
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors',
                    isMoreActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            }
            const active = tab.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-[10px]">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More sheet — vertical list */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl pb-safe">
          <div className="mx-auto w-8 h-0.5 rounded-full bg-muted mb-4" />
          <nav className="pb-2">
            {MORE_ITEMS.map(item => {
              const active = loc.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors text-sm',
                    active ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
