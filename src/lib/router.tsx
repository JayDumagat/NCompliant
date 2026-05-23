'use client';

import NextLink from 'next/link';
import { usePathname, useRouter, useParams as useNextParams } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

function normalizePath(to: string): string {
  if (!to) return '/app';
  if (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:') || to.startsWith('tel:')) return to;
  if (to === '/') return '/app';
  if (to.startsWith('/app')) return to;
  if (to.startsWith('/login') || to.startsWith('/register') || to.startsWith('/onboarding') || to.startsWith('/invite')) return to;
  if (to.startsWith('/')) return `/app${to}`;
  return `/app/${to}`;
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  to: string;
  children: ReactNode;
};

export function Link({ to, ...props }: LinkProps) {
  return <NextLink href={normalizePath(to)} {...props} />;
}

export function useNavigate() {
  const router = useRouter();
  return (to: string) => {
    router.push(normalizePath(to));
  };
}

export function useLocation() {
  const pathname = usePathname();
  if (!pathname) return { pathname: '/' };
  if (pathname === '/app') return { pathname: '/' };
  if (pathname.startsWith('/app/')) return { pathname: pathname.slice(4) || '/' };
  return { pathname };
}

export function useParams<T extends Record<string, string | undefined>>() {
  return useNextParams() as T;
}
