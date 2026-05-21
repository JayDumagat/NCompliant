export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  createdByUserId: string;
}

export interface Membership {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  createdAt: string;
}

export interface Invite {
  id: string;
  workspaceId: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  createdByUserId: string;
}

export type TemplateType = 'policy' | 'assessment' | 'risk' | 'vendor' | 'task';

export interface Template {
  id: string;
  workspaceId: string;
  type: TemplateType;
  title: string;
  content: string;
  version: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventType = 'assessment_review' | 'policy_review' | 'training' | 'audit' | 'custom';

export interface CalendarEvent {
  id: string;
  workspaceId: string;
  type: CalendarEventType;
  title: string;
  dueDate: string;
  createdByUserId: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserPreference {
  userId: string;
  activeWorkspaceId: string;
}

export interface AppData {
  users: User[];
  workspaces: Workspace[];
  memberships: Membership[];
  invites: Invite[];
  templates: Template[];
  calendarEvents: CalendarEvent[];
  auditLogs: AuditLog[];
  sessions: Session[];
  userPreferences: UserPreference[];
}
