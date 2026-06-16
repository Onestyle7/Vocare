import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = (await authProxy(request)) ?? NextResponse.next();
  return response;
}

async function authProxy(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-current-path', request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (searchParams.has('reason')) {
    response.cookies.delete('token');
    response.cookies.delete('userId');
    return response;
  }

  if (request.cookies.has('token') && authPages.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (
    !request.cookies.has('token') &&
    restrictedPages.some((page) => request.nextUrl.pathname.startsWith(page))
  ) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

const authPages = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];
const restrictedPages = ['/dashboard', '/resume', '/roadmap'];

export const config = {
  matcher: ['/:path*'],
};
