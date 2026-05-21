import { redirect } from 'next/navigation';
import { createWorkspaceAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { getActiveWorkspaceContext } from '@/lib/workspace';

export default async function OnboardingPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const active = await getActiveWorkspaceContext(user.id);
  if (active) redirect('/app');

  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === 'string' ? searchParams.error : '';

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1>Create your first workspace</h1>
        <p className="muted">You need a workspace before accessing dashboards, templates, and calendar features.</p>
        {error ? <p className="muted">Error: {error}</p> : null}
        <form action={createWorkspaceAction} className="grid" style={{ marginTop: 12 }}>
          <label>
            Workspace name
            <input name="name" required minLength={2} maxLength={80} />
          </label>
          <button type="submit">Create workspace</button>
        </form>
      </div>
    </main>
  );
}
