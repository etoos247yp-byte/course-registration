import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecretKey } from '@/lib/production-config';

const SESSION_COOKIE_NAME = 'session';

type SessionPayload = {
  userId: string;
  role: 'student' | 'admin' | 'super_admin' | 'teacher';
  name: string;
};

// Route matching patterns
const ADMIN_ROUTE_PREFIX = '/admin';
const STUDENT_ROUTES = ['/dashboard', '/catalog', '/cart', '/schedule', '/course'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Retrieve the session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let sessionPayload: SessionPayload | null = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, getJwtSecretKey(), {
        algorithms: ['HS256'],
      });
      sessionPayload = payload as SessionPayload;
    } catch (error) {
      console.error('Middleware JWT Verification failed:', error);
      // If token is invalid or expired, remove cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  // 2. Gate Admin Routes (/admin/*)
  if (pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`)) {
    if (!sessionPayload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (sessionPayload.role !== 'admin' && sessionPayload.role !== 'super_admin' && sessionPayload.role !== 'teacher') {
      // Forbidden: Students cannot access admin routes
      // Redirect to student dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 3. Gate Student Routes
  const isStudentRoute = STUDENT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isStudentRoute) {
    if (!sessionPayload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (sessionPayload.role === 'admin' || sessionPayload.role === 'super_admin') {
      // Admins are not supposed to visit standard student dashboards directly (except via impersonation/preview, if handled by client state)
      // Standard middleware block redirects them to admin homepage
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // 4. Gate Login Route (Redirect logged-in users away from /login)
  if (pathname === '/login') {
    if (sessionPayload) {
      if (sessionPayload.role === 'admin' || sessionPayload.role === 'super_admin' || sessionPayload.role === 'teacher') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

// Configure middleware matching paths to optimize performance
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/catalog/:path*',
    '/cart/:path*',
    '/schedule/:path*',
    '/course/:path*',
    '/login',
  ],
};
