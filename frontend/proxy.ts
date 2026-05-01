import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = (await authProxy(request)) ?? NextResponse.next();
  return response;
}

async function authProxy(request: NextRequest) {
  if (request.cookies.has('token') && authPages.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!request.cookies.has('token') && request.nextUrl.pathname.startsWith('/dashboard')) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }
}

const authPages = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];

export const config = {
  matcher: ['/:path*'],
};
