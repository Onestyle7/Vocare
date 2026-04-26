import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = (await authProxy(request)) ?? NextResponse.next();
  return response;
}

async function authProxy(request: NextRequest) {
  if (!request.cookies.has('token')) {
    const callbackUrl = request.nextUrl.pathname;
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('returnTo', callbackUrl);

    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
