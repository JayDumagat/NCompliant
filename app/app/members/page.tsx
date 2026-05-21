import { createInviteAction, updateMemberRoleAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { readData } from '@/lib/data';
import { getActiveWorkspaceContext } from '@/lib/workspace';

export default async function MembersPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const active = await getActiveWorkspaceContext(user.id);
  if (!active) return null;

  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === 'string' ? searchParams.error : '';
  const invited = typeof searchParams.invited === 'string' ? searchParams.invited : '';
  const token = typeof searchParams.token === 'string' ? searchParams.token : '';

  const data = await readData();
  const members = data.memberships
    .filter((m) => m.workspaceId === active.workspace.id)
    .map((m) => ({ ...m, user: data.users.find((u) => u.id === m.userId) }))
    .filter((m) => m.user);

  const pendingInvites = data.invites
    .filter((i) => i.workspaceId === active.workspace.id && !i.acceptedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <section className="grid grid-2">
      <article className="card">
        <h2>Invite user via email</h2>
        <p className="muted">Invites expire after 7 days and enforce role assignment on acceptance.</p>
        {error ? <p className="muted">Error: {error}</p> : null}
        <form action={createInviteAction} className="grid" style={{ marginTop: 12 }}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Role
            <select name="role" defaultValue="viewer">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <button type="submit">Send invite</button>
        </form>
        {invited && token ? (
          <p className="muted" style={{ marginTop: 10 }}>
            Invite queued for {invited}. Link: /invite/{token}
          </p>
        ) : null}
      </article>
      <article className="card">
        <h2>Members and roles</h2>
        {members.length ? (
          <ul>
            {members.map((member) => (
              <li key={member.id} style={{ marginBottom: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong>{member.user?.email}</strong>
                    <div className="muted">Current role: {member.role}</div>
                  </div>
                  <form action={updateMemberRoleAction} className="row">
                    <input type="hidden" name="memberUserId" value={member.userId} />
                    <select name="role" defaultValue={member.role} style={{ width: 130 }}>
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button type="submit" className="inline secondary">Update</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No members yet.</p>
        )}
        <h3>Pending invites</h3>
        {pendingInvites.length ? (
          <ul>
            {pendingInvites.map((invite) => (
              <li key={invite.id}>
                {invite.email} · {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No pending invites.</p>
        )}
      </article>
    </section>
  );
}
