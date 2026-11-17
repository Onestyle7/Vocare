import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  RESET_PASSWORD_COOKIE,
  RESET_PASSWORD_COOKIE_OPTIONS,
  RESET_PASSWORD_PATH,
  serializeResetPasswordLink,
} from '@/features/auth/reset-password-link';

export async function proxy(request: NextRequest) {
  const response =
    legacyBlogCategoryRedirect(request) ??
    resetPasswordLinkRedirect(request) ??
    (await authProxy(request)) ??
    NextResponse.next();
  return response;
}

/**
 * Moves the token and email from the reset link into an httpOnly cookie and redirects to the bare
 * /reset-password. The browser follows the redirect before rendering anything, so GA4 and the
 * pixels never see the link: neither as the page address nor later as the referrer.
 */
function resetPasswordLinkRedirect(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== RESET_PASSWORD_PATH || searchParams.size === 0) return null;

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const response = NextResponse.redirect(new URL(RESET_PASSWORD_PATH, request.url));

  if (token && email) {
    response.cookies.set(
      RESET_PASSWORD_COOKIE,
      serializeResetPasswordLink({ token, email }),
      RESET_PASSWORD_COOKIE_OPTIONS
    );
  } else {
    // A broken link must not fall back to a cookie left by an earlier one
    response.cookies.set(RESET_PASSWORD_COOKIE, '', {
      ...RESET_PASSWORD_COOKIE_OPTIONS,
      maxAge: 0,
    });
  }

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
    requestHeaders.delete('cookie');
    const cleanResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    cleanResponse.cookies.set('token', '', { path: '/', maxAge: 0 });
    cleanResponse.cookies.set('userId', '', { path: '/', maxAge: 0 });
    return cleanResponse;
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
