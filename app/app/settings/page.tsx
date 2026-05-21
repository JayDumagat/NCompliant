import { wipeWorkspaceAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { getActiveWorkspaceContext } from '@/lib/workspace';

export default async function SettingsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const active = await getActiveWorkspaceContext(user.id);
  if (!active) return null;

  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === 'string' ? searchParams.error : '';

  return (
    <section className="grid">
      <article className="card">
        <h2>Workspace settings</h2>
        <p className="muted">Current workspace: {active.workspace.name}</p>
        <p className="muted">Your role: {active.membership.role}</p>
      </article>

      <article className="card">
        <h2>Complete data wipe</h2>
        <p className="muted">
          This permanently removes all workspace data (templates, events, members, invites, logs) from server storage.
          Browser-local persistence is not used in this platform path.
        </p>
        {error ? <p className="muted">Error: {error}</p> : null}
        <form action={wipeWorkspaceAction} style={{ marginTop: 12 }}>
          <button type="submit">Wipe workspace data permanently</button>
        </form>
      </article>
    </section>
  );
}
