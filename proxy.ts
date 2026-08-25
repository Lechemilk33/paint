import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, isValidSessionToken } from '@/lib/auth/session';

/**
 * Gate for everything under /admin.
 *
 * This runs before any admin page or action does, so an unauthenticated
 * request never reaches code that reads the catalog. The pages verify the
 * session again on the server for themselves - middleware is the fence, not
 * the only lock, because a misconfigured matcher should not silently open the
 * admin up.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const signedIn = await isValidSessionToken(token);

  // Someone already signed in has no use for the login form.
  if (pathname === '/admin/login') {
    if (signedIn) return NextResponse.redirect(new URL('/admin', request.url));
    return NextResponse.next();
  }

  if (!signedIn) {
    const login = new URL('/admin/login', request.url);
    // Remember where they were headed so the round trip is invisible.
    if (pathname !== '/admin') login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
