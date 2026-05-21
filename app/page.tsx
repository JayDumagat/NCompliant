import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="container">
      <h1>NCompliant</h1>
      <p className="muted">
        Multi-tenant compliance operations platform with workspace onboarding, RBAC, email invites, calendar tracking, and
        reusable templates.
      </p>
      <div className="row" style={{ marginTop: 16 }}>
        <Link href="/register"><button className="inline">Get started</button></Link>
        <Link href="/login"><button className="inline secondary">Sign in</button></Link>
      </div>
      <section className="grid grid-2" style={{ marginTop: 24 }}>
        <article className="card">
          <h3>Authentication + RBAC</h3>
          <p className="muted">Owner/Admin/Editor/Viewer permissions enforced on server actions.</p>
        </article>
        <article className="card">
          <h3>Workspace-first access</h3>
          <p className="muted">Users must create or join a workspace before entering protected app areas.</p>
        </article>
        <article className="card">
          <h3>Calendar + reminders</h3>
          <p className="muted">Track policy reviews, assessment reviews, training deadlines, and custom events.</p>
        </article>
        <article className="card">
          <h3>Template builder</h3>
          <p className="muted">Create policy, assessment, risk, vendor, and task templates with versioned records.</p>
        </article>
      </section>
    </main>
  );
}
