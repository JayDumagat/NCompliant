import Link from 'next/link';
import { loginAction } from '@/app/actions';

export default async function LoginPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === 'string' ? searchParams.error : '';

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1>Sign in</h1>
        {error ? <p className="muted">Sign in failed: {error}</p> : null}
        <form action={loginAction} className="grid" style={{ marginTop: 12 }}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={8} />
          </label>
          <button type="submit">Sign in</button>
        </form>
        <p className="muted" style={{ marginTop: 8 }}>
          No account? <Link href="/register">Create one</Link>
        </p>
      </div>
    </main>
  );
}
