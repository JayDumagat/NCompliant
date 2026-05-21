import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NCompliant | Compliance Workspace Platform',
  description:
    'NCompliant provides workspace-based compliance operations with authentication, RBAC, invites, templates, and calendar tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
