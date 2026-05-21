import Link from 'next/link';
import { registerAction } from '@/app/actions';

export default async function RegisterPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === 'string' ? searchParams.error : '';
  const message = typeof searchParams.message === 'string' ? searchParams.message : '';

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1>Create account</h1>
        {message ? <p className="muted">{message === 'wiped' ? 'Workspace data wiped successfully.' : message}</p> : null}
        {error ? <p className="muted">Registration failed: {error}</p> : null}
        <form action={registerAction} className="grid" style={{ marginTop: 12 }}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={8} />
          </label>
          <button type="submit">Create account</button>
        </form>
        <p className="muted" style={{ marginTop: 8 }}>
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
