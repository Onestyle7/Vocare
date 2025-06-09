import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/', '/sign-in', '/sign-up', '/forgot-password'];
  const isPublic = publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico';

  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
