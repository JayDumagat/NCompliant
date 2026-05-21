import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { getActiveWorkspaceContext } from '@/lib/workspace';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const active = await getActiveWorkspaceContext(user.id);
  if (!active) redirect('/onboarding');

  return (
    <main className="container">
      <header className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>{active.workspace.name}</strong>
            <p className="muted">Signed in as {user.email} · role: {active.membership.role}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="inline secondary">Logout</button>
          </form>
        </div>
        <nav className="row" style={{ marginTop: 12 }}>
          <Link href="/app">Dashboard</Link>
          <Link href="/app/calendar">Calendar</Link>
          <Link href="/app/templates">Templates</Link>
          <Link href="/app/members">Members</Link>
          <Link href="/app/settings">Settings</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
