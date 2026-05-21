'use server';

import crypto from 'node:crypto';
import { redirect } from 'next/navigation';
import { can } from '@/lib/rbac';
import { createSession, destroyCurrentSession, getCurrentUser, hashPassword, setSessionCookie, verifyPassword } from '@/lib/auth';
import { mutateData, readData } from '@/lib/data';
import type { CalendarEventType, Role, TemplateType } from '@/lib/types';
import { getActiveWorkspaceContext } from '@/lib/workspace';

function cleanEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function registerAction(formData: FormData): Promise<void> {
  const email = cleanEmail(String(formData.get('email') ?? ''));
  const password = String(formData.get('password') ?? '');

  if (!email || !password || password.length < 8) {
    redirect('/register?error=invalid_input');
  }

  const existing = await readData();
  if (existing.users.some((u) => u.email === email)) {
    redirect('/register?error=email_exists');
  }

  const userId = crypto.randomUUID();
  await mutateData((data) => {
    data.users.push({
      id: userId,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    });
  });

  const session = await createSession(userId);
  await setSessionCookie(session.id);
  redirect('/onboarding');
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = cleanEmail(String(formData.get('email') ?? ''));
  const password = String(formData.get('password') ?? '');

  const data = await readData();
  const user = data.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect('/login?error=invalid_credentials');
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.id);

  const hasMembership = data.memberships.some((m) => m.userId === user.id);
  redirect(hasMembership ? '/app' : '/onboarding');
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect('/');
}

export async function createWorkspaceAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/onboarding?error=name_required');

  const workspaceId = crypto.randomUUID();
  await mutateData((data) => {
    data.workspaces.push({
      id: workspaceId,
      name,
      createdAt: new Date().toISOString(),
      createdByUserId: user.id,
    });
    data.memberships.push({
      id: crypto.randomUUID(),
      userId: user.id,
      workspaceId,
      role: 'owner',
      createdAt: new Date().toISOString(),
    });

    const existingPref = data.userPreferences.find((p) => p.userId === user.id);
    if (existingPref) {
      existingPref.activeWorkspaceId = workspaceId;
    } else {
      data.userPreferences.push({ userId: user.id, activeWorkspaceId: workspaceId });
    }

    data.auditLogs.push({
      id: crypto.randomUUID(),
      workspaceId,
      actorUserId: user.id,
      action: 'workspace.created',
      targetType: 'workspace',
      targetId: workspaceId,
      createdAt: new Date().toISOString(),
    });
  });

  redirect('/app');
}

export async function createInviteAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const ctx = await getActiveWorkspaceContext(user.id);
  if (!ctx) redirect('/onboarding');

  if (!can(ctx.membership.role, 'invite:create')) {
    redirect('/app/members?error=forbidden');
  }

  const email = cleanEmail(String(formData.get('email') ?? ''));
  const role = String(formData.get('role') ?? 'viewer') as Role;

  if (!email) redirect('/app/members?error=email_required');

  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = new Date(now + 1000 * 60 * 60 * 24 * 7).toISOString();

  await mutateData((data) => {
    data.invites.push({
      id: crypto.randomUUID(),
      workspaceId: ctx.workspace.id,
      email,
      role,
      token,
      expiresAt,
      createdAt: new Date(now).toISOString(),
      createdByUserId: user.id,
    });

    data.auditLogs.push({
      id: crypto.randomUUID(),
      workspaceId: ctx.workspace.id,
      actorUserId: user.id,
      action: 'invite.created',
      targetType: 'invite',
      targetId: token,
      createdAt: new Date().toISOString(),
    });
  });

  redirect(`/app/members?invited=${encodeURIComponent(email)}&token=${token}`);
}

export async function acceptInviteAction(token: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/invite/${token}`);

  const data = await readData();
  const invite = data.invites.find((i) => i.token === token && !i.acceptedAt);
  if (!invite) redirect('/app?error=invite_not_found');

  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    redirect('/app?error=invite_expired');
  }

  if (invite.email !== user.email) {
    redirect('/app?error=invite_email_mismatch');
  }

  await mutateData((draft) => {
    const existing = draft.memberships.find((m) => m.userId === user.id && m.workspaceId === invite.workspaceId);
    if (!existing) {
      draft.memberships.push({
        id: crypto.randomUUID(),
        userId: user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
        createdAt: new Date().toISOString(),
      });
    }

    const pending = draft.invites.find((i) => i.token === token);
    if (pending) pending.acceptedAt = new Date().toISOString();

    const existingPref = draft.userPreferences.find((p) => p.userId === user.id);
    if (existingPref) existingPref.activeWorkspaceId = invite.workspaceId;
    else draft.userPreferences.push({ userId: user.id, activeWorkspaceId: invite.workspaceId });

    draft.auditLogs.push({
      id: crypto.randomUUID(),
      workspaceId: invite.workspaceId,
      actorUserId: user.id,
      action: 'invite.accepted',
      targetType: 'invite',
      targetId: token,
      createdAt: new Date().toISOString(),
    });
  });

  redirect('/app');
}

export async function createTemplateAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const ctx = await getActiveWorkspaceContext(user.id);
  if (!ctx) redirect('/onboarding');
  if (!can(ctx.membership.role, 'template:create')) redirect('/app/templates?error=forbidden');

  const title = String(formData.get('title') ?? '').trim();
  const type = String(formData.get('type') ?? 'policy') as TemplateType;
  const content = String(formData.get('content') ?? '').trim();

  if (!title || !content) redirect('/app/templates?error=missing_fields');

  await mutateData((data) => {
    data.templates.push({
      id: crypto.randomUUID(),
      workspaceId: ctx.workspace.id,
      type,
      title,
      content,
      version: 1,
      createdByUserId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  redirect('/app/templates?success=created');
}

export async function createCalendarEventAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const ctx = await getActiveWorkspaceContext(user.id);
  if (!ctx) redirect('/onboarding');
  if (!can(ctx.membership.role, 'calendar:create')) redirect('/app/calendar?error=forbidden');

  const title = String(formData.get('title') ?? '').trim();
  const dueDate = String(formData.get('dueDate') ?? '').trim();
  const type = String(formData.get('type') ?? 'custom') as CalendarEventType;

  if (!title || !dueDate) redirect('/app/calendar?error=missing_fields');

  await mutateData((data) => {
    data.calendarEvents.push({
      id: crypto.randomUUID(),
      workspaceId: ctx.workspace.id,
      title,
      dueDate,
      type,
      createdByUserId: user.id,
      createdAt: new Date().toISOString(),
    });
  });

  redirect('/app/calendar?success=created');
}

export async function updateMemberRoleAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const ctx = await getActiveWorkspaceContext(user.id);
  if (!ctx) redirect('/onboarding');

  if (!can(ctx.membership.role, 'member:manage')) {
    redirect('/app/members?error=forbidden');
  }

  const memberUserId = String(formData.get('memberUserId') ?? '');
  const role = String(formData.get('role') ?? 'viewer') as Role;

  if (!memberUserId || memberUserId === user.id) {
    redirect('/app/members?error=invalid_member');
  }

  await mutateData((data) => {
    const membership = data.memberships.find((m) => m.workspaceId === ctx.workspace.id && m.userId === memberUserId);
    if (membership) {
      membership.role = role;
      data.auditLogs.push({
        id: crypto.randomUUID(),
        workspaceId: ctx.workspace.id,
        actorUserId: user.id,
        action: 'member.role_updated',
        targetType: 'user',
        targetId: memberUserId,
        createdAt: new Date().toISOString(),
      });
    }
  });

  redirect('/app/members?success=role_updated');
}

export async function wipeWorkspaceAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const ctx = await getActiveWorkspaceContext(user.id);
  if (!ctx) redirect('/onboarding');

  if (!can(ctx.membership.role, 'workspace:wipe')) {
    redirect('/app/settings?error=forbidden');
  }

  await mutateData((data) => {
    const targetWorkspaceId = ctx.workspace.id;

    data.workspaces = data.workspaces.filter((w) => w.id !== targetWorkspaceId);
    data.memberships = data.memberships.filter((m) => m.workspaceId !== targetWorkspaceId);
    data.invites = data.invites.filter((i) => i.workspaceId !== targetWorkspaceId);
    data.templates = data.templates.filter((t) => t.workspaceId !== targetWorkspaceId);
    data.calendarEvents = data.calendarEvents.filter((e) => e.workspaceId !== targetWorkspaceId);
    data.auditLogs = data.auditLogs.filter((a) => a.workspaceId !== targetWorkspaceId);

    const activeWorkspaceIds = new Set(data.workspaces.map((w) => w.id));
    data.userPreferences = data.userPreferences.filter((p) => activeWorkspaceIds.has(p.activeWorkspaceId));

    const usersWithMembership = new Set(data.memberships.map((m) => m.userId));
    data.users = data.users.filter((u) => usersWithMembership.has(u.id));
    data.sessions = data.sessions.filter((s) => usersWithMembership.has(s.userId));
  });

  await destroyCurrentSession();
  redirect('/register?message=wiped');
}
