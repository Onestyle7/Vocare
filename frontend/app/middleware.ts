import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log(request.cookies.get('token'));

  // if (!isAuth && request.nextUrl.pathname.startsWith('/profile')) {
  //   return NextResponse.redirect(new URL('/sign-in', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile', '/profile/:path*'],
};
