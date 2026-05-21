import type { Role } from '@/lib/types';

export type Permission =
  | 'invite:create'
  | 'member:manage'
  | 'template:create'
  | 'calendar:create'
  | 'workspace:wipe';

const matrix: Record<Role, Permission[]> = {
  owner: ['invite:create', 'member:manage', 'template:create', 'calendar:create', 'workspace:wipe'],
  admin: ['invite:create', 'template:create', 'calendar:create'],
  editor: ['template:create', 'calendar:create'],
  viewer: [],
};

export function can(role: Role, permission: Permission): boolean {
  return matrix[role].includes(permission);
}
