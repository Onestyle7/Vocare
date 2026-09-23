import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const response =
    legacyBlogCategoryRedirect(request) ?? (await authProxy(request)) ?? NextResponse.next();
  return response;
}

/**
 * Blog category slugs were normalised to lowercase Polish on 2026-09-22.
 * Old links still point at the capitalised segments, which now 404.
 *
 * This cannot live in `next.config.ts`: redirect `source` matching is
 * case-insensitive, so a '/blog/CV/:slug' rule also matches '/blog/cv/:slug'
 * and sends every cv/ and kariera/ post into an infinite redirect loop.
 * Comparing the segment here keeps the match exact.
 */
const LEGACY_BLOG_CATEGORIES = new Map([
  ['CV', 'cv'],
  ['Job', 'praca'],
  ['Kariera', 'kariera'],
]);

function legacyBlogCategoryRedirect(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/');
  // ['', 'blog', '<category>', ...rest]
  if (segments[1] !== 'blog' || segments.length < 3) return null;

  const replacement = LEGACY_BLOG_CATEGORIES.get(segments[2]);
  if (!replacement) return null;

  segments[2] = replacement;
  const url = request.nextUrl.clone();
  url.pathname = segments.join('/');
  return NextResponse.redirect(url, 308);
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
    response.cookies.delete('is_authenticated');
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
    const redirectResponse = NextResponse.redirect(signInUrl);
    redirectResponse.cookies.delete('is_authenticated');
    return redirectResponse;
  }

  if (request.cookies.has('token') && !request.cookies.has('is_authenticated')) {
    response.cookies.set('is_authenticated', '1', {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    });
  } else if (!request.cookies.has('token') && request.cookies.has('is_authenticated')) {
    response.cookies.delete('is_authenticated');
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
