import { NextRequest } from 'next/server';
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
    isRestrictedPath(request.nextUrl.pathname) &&
    !isPublicAssetPath(request.nextUrl.pathname)
  ) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.append('callbackUrl', request.nextUrl.pathname);
    signInUrl.searchParams.append('reason', 'Sesja wygasła. Zaloguj się ponownie');
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

const authPages = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];
const restrictedExactPages = ['/dashboard'];
const restrictedPagePrefixes = ['/dashboard/', '/resume/', '/roadmap/'];
const publicAssetExtensionPattern =
  /\.(?:avif|webp|png|jpe?g|gif|svg|ico|mp4|webm|mov|woff2?|ttf|otf|eot|json|txt|xml|pdf)$/i;

function isRestrictedPath(pathname: string) {
  return (
    restrictedExactPages.includes(pathname) ||
    restrictedPagePrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}

function isPublicAssetPath(pathname: string) {
  return publicAssetExtensionPattern.test(pathname);
}

export const config = {
  matcher: ['/:path*'],
};
