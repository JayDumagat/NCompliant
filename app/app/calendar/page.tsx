import { createCalendarEventAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { readData } from '@/lib/data';
import { getActiveWorkspaceContext } from '@/lib/workspace';

export default async function CalendarPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const active = await getActiveWorkspaceContext(user.id);
  if (!active) return null;

  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === 'string' ? searchParams.error : '';
  const success = typeof searchParams.success === 'string' ? searchParams.success : '';

  const data = await readData();
  const events = data.calendarEvents
    .filter((e) => e.workspaceId === active.workspace.id)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <section className="grid grid-2">
      <article className="card">
        <h2>Create calendar event</h2>
        <p className="muted">Track policy reviews, assessments, and deadlines.</p>
        {error ? <p className="muted">Error: {error}</p> : null}
        {success ? <p className="muted">Event created.</p> : null}
        <form action={createCalendarEventAction} className="grid" style={{ marginTop: 12 }}>
          <label>
            Title
            <input name="title" required />
          </label>
          <label>
            Type
            <select name="type" defaultValue="assessment_review">
              <option value="assessment_review">Assessment Review</option>
              <option value="policy_review">Policy Review</option>
              <option value="training">Training</option>
              <option value="audit">Audit</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label>
            Due date
            <input name="dueDate" type="date" required />
          </label>
          <button type="submit">Add event</button>
        </form>
      </article>
      <article className="card">
        <h2>Events</h2>
        {events.length ? (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                {event.title} · {event.type} · {new Date(event.dueDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No events yet.</p>
        )}
      </article>
    </section>
  );
}
