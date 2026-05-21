import { redirect } from 'next/navigation';
import { acceptInviteAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { readData } from '@/lib/data';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await readData();
  const invite = data.invites.find((i) => i.token === token && !i.acceptedAt);

  if (!invite) {
    return (
      <main className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <h1>Invite not found</h1>
          <p className="muted">This invite is invalid or already accepted.</p>
        </div>
      </main>
    );
  }

  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return (
      <main className="container" style={{ maxWidth: 520 }}>
        <div className="card">
          <h1>Invite expired</h1>
          <p className="muted">Please request a new invite from your workspace admin.</p>
        </div>
      </main>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  const mismatched = user.email !== invite.email;

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1>Workspace invite</h1>
        <p className="muted">Invite email: {invite.email}</p>
        <p className="muted">Role: {invite.role}</p>
        {mismatched ? <p className="muted">Signed in as {user.email}. Please sign in with the invited email.</p> : null}
        {!mismatched ? (
          <form action={acceptInviteAction.bind(null, token)} style={{ marginTop: 12 }}>
            <button type="submit">Accept invite</button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
