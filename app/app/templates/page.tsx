import { createTemplateAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { readData } from '@/lib/data';
import { getActiveWorkspaceContext } from '@/lib/workspace';

export default async function TemplatesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const active = await getActiveWorkspaceContext(user.id);
  if (!active) return null;

  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === 'string' ? searchParams.error : '';
  const success = typeof searchParams.success === 'string' ? searchParams.success : '';

  const data = await readData();
  const templates = data.templates
    .filter((t) => t.workspaceId === active.workspace.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <section className="grid grid-2">
      <article className="card">
        <h2>Template builder</h2>
        <p className="muted">Create templates for policies, assessments, risk reviews, vendors, and tasks.</p>
        {error ? <p className="muted">Error: {error}</p> : null}
        {success ? <p className="muted">Template created.</p> : null}
        <form action={createTemplateAction} className="grid" style={{ marginTop: 12 }}>
          <label>
            Title
            <input name="title" required />
          </label>
          <label>
            Type
            <select name="type" defaultValue="policy">
              <option value="policy">Policy</option>
              <option value="assessment">Assessment</option>
              <option value="risk">Risk</option>
              <option value="vendor">Vendor</option>
              <option value="task">Task</option>
            </select>
          </label>
          <label>
            Template content
            <textarea name="content" rows={7} required />
          </label>
          <button type="submit">Save template</button>
        </form>
      </article>
      <article className="card">
        <h2>Saved templates</h2>
        {templates.length ? (
          <ul>
            {templates.map((template) => (
              <li key={template.id} style={{ marginBottom: 12 }}>
                <strong>{template.title}</strong> ({template.type})
                <div className="muted">v{template.version} · updated {new Date(template.updatedAt).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No templates yet.</p>
        )}
      </article>
    </section>
  );
}
