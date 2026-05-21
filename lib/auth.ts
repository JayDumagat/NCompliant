import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { mutateData, readData } from '@/lib/data';
import type { Session, User } from '@/lib/types';

export const SESSION_COOKIE = 'ncompliant_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashed = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hashed}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [salt, stored] = encoded.split(':');
  if (!salt || !stored) return false;
  const hashed = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(hashed, 'hex'));
}

export async function createSession(userId: string): Promise<Session> {
  const now = Date.now();
  const session: Session = {
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };

  await mutateData((data) => {
    data.sessions = data.sessions.filter((s) => s.userId !== userId);
    data.sessions.push(session);
  });

  return session;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const data = await readData();
  const session = data.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await mutateData((draft) => {
      draft.sessions = draft.sessions.filter((s) => s.id !== session.id);
    });
    return null;
  }

  return data.users.find((u) => u.id === session.userId) ?? null;
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await mutateData((data) => {
      data.sessions = data.sessions.filter((s) => s.id !== sessionId);
    });
  }
  await clearSessionCookie();
}
