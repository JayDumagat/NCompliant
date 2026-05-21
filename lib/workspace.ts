import 'server-only';
import { readData } from '@/lib/data';
import type { Membership, Workspace } from '@/lib/types';

export interface ActiveWorkspaceContext {
  workspace: Workspace;
  membership: Membership;
}

export async function getActiveWorkspaceContext(userId: string): Promise<ActiveWorkspaceContext | null> {
  const data = await readData();
  const memberships = data.memberships.filter((m) => m.userId === userId);
  if (!memberships.length) return null;

  const pref = data.userPreferences.find((p) => p.userId === userId);
  const membership = memberships.find((m) => m.workspaceId === pref?.activeWorkspaceId) ?? memberships[0];

  const workspace = data.workspaces.find((w) => w.id === membership.workspaceId);
  if (!workspace) return null;

  return { workspace, membership };
}
