import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { readData } from '@/lib/data';
import { getActiveWorkspaceContext } from '@/lib/workspace';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const active = await getActiveWorkspaceContext(user.id);
  if (!active) return null;

  const data = await readData();
  const workspaceId = active.workspace.id;
  const upcoming = data.calendarEvents
    .filter((e) => e.workspaceId === workspaceId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const templateCount = data.templates.filter((t) => t.workspaceId === workspaceId).length;
  const memberCount = data.memberships.filter((m) => m.workspaceId === workspaceId).length;
  const inviteCount = data.invites.filter((i) => i.workspaceId === workspaceId && !i.acceptedAt).length;

  return (
    <section className="grid grid-2">
      <article className="card">
        <h2>Workspace overview</h2>
        <p className="muted">Members: {memberCount}</p>
        <p className="muted">Templates: {templateCount}</p>
        <p className="muted">Pending invites: {inviteCount}</p>
      </article>
      <article className="card">
        <h2>Upcoming compliance events</h2>
        {upcoming.length ? (
          <ul>
            {upcoming.map((event) => (
              <li key={event.id}>
                {event.title} · {event.type} · {new Date(event.dueDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No upcoming events.</p>
        )}
        <p style={{ marginTop: 8 }}><Link href="/app/calendar">Manage calendar events</Link></p>
      </article>
    </section>
  );
}
