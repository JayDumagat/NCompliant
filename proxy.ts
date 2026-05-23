import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const SESSION_COOKIE = 'ncompliant_session';

const authRoutes = ['/login', '/register'];

export function proxy(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  const isProtected = pathname.startsWith('/app') || pathname.startsWith('/onboarding') || pathname.startsWith('/invite');
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/app', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/onboarding', '/invite/:path*', '/login', '/register'],
};
