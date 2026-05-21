# NCompliant (Next.js)

NCompliant is now a Next.js App Router application with workspace-first access control and server-side persistence.

## Features implemented

- Authentication (register/login/logout) with server-side sessions
- Workspace-first onboarding gate before protected app access
- RBAC roles: owner, admin, editor, viewer
- Email invite flow with expiring invite tokens and acceptance route
- Server-side data storage (`.data/db.json`) for users, workspaces, memberships, invites, templates, calendar, sessions, and audit logs
- Public SEO-friendly landing page
- Calendar page for compliance events
- Template builder page for policy/assessment/risk/vendor/task templates
- Workspace complete data wipe action (owner-only)

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run start
```

## Notes

- Existing legacy Vite SPA files under `src/` are no longer used by the active runtime path.
- Data is handled on the server and is not persisted in browser local storage in the active application path.
