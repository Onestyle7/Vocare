// @vitest-environment node

import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { parseResetPasswordLink, RESET_PASSWORD_COOKIE } from '@/features/auth/reset-password-link';
import {
  safeCallbackPath,
  SESSION_EXPIRED_REASON,
  SESSION_MARKER,
  SESSION_MARKER_COOKIE,
} from '@/features/auth/session-marker';

import { proxy } from './proxy';

function requestWithCookies(url: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return new NextRequest(url, cookie ? { headers: { cookie } } : undefined);
}

describe('proxy – restricted pages without a token', () => {
  it('sends a first-time visitor to sign-up, without a "session expired" message', async () => {
    const response = await proxy(requestWithCookies('https://vocare.pl/dashboard'));
    const location = new URL(response.headers.get('location') ?? '');

    expect(response.status).toBe(307);
    expect(location.pathname).toBe('/sign-up');
    expect(location.searchParams.get('callbackUrl')).toBe('/dashboard');
    expect(location.searchParams.has('reason')).toBe(false);
  });

  it('tells a user whose session expired to sign in again', async () => {
    const response = await proxy(
      requestWithCookies('https://vocare.pl/dashboard/resume', {
        [SESSION_MARKER_COOKIE]: SESSION_MARKER.active,
      })
    );
    const location = new URL(response.headers.get('location') ?? '');

    expect(location.pathname).toBe('/sign-in');
    expect(location.searchParams.get('callbackUrl')).toBe('/dashboard/resume');
    expect(location.searchParams.get('reason')).toBe(SESSION_EXPIRED_REASON);
  });

  it('sends a user who signed out to sign in, without an error message', async () => {
    const response = await proxy(
      requestWithCookies('https://vocare.pl/dashboard', {
        [SESSION_MARKER_COOKIE]: SESSION_MARKER.signedOut,
      })
    );
    const location = new URL(response.headers.get('location') ?? '');

    expect(location.pathname).toBe('/sign-in');
    expect(location.searchParams.has('reason')).toBe(false);
  });

  it('treats an unknown marker value as a first-time visitor', async () => {
    const response = await proxy(
      requestWithCookies('https://vocare.pl/dashboard', { [SESSION_MARKER_COOKIE]: 'x' })
    );

    expect(new URL(response.headers.get('location') ?? '').pathname).toBe('/sign-up');
  });

  it('lets a signed-in user through', async () => {
    const response = await proxy(
      requestWithCookies('https://vocare.pl/dashboard', { token: 'abc', userId: '1' })
    );

    expect(response.headers.get('location')).toBeNull();
  });

  it('leaves public marketing pages alone', async () => {
    const response = await proxy(requestWithCookies('https://vocare.pl/resume-creator'));

    expect(response.headers.get('location')).toBeNull();
  });
});

describe('safeCallbackPath', () => {
  it.each([
    ['/dashboard', '/dashboard'],
    ['/dashboard/resume?x=1', '/dashboard/resume?x=1'],
    ['https://evil.example', undefined],
    ['//evil.example', undefined],
    ['/\\evil.example', undefined],
    ['', undefined],
    [undefined, undefined],
  ])('%s → %s', (input, expected) => {
    expect(safeCallbackPath(input)).toBe(expected);
  });
});

// ASP.NET Identity tokens contain characters that need encoding in both URLs and cookies
const TOKEN = 'CfDJ8+Ab/cd==';
const EMAIL = 'jan.kowalski+test@example.com';
const RESET_LINK = `https://vocare.pl/reset-password?token=${encodeURIComponent(TOKEN)}&email=${encodeURIComponent(EMAIL)}`;

describe('proxy – password reset link', () => {
  it('redirects to the bare path, so trackers never see the token or the email', async () => {
    const response = await proxy(new NextRequest(RESET_LINK));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://vocare.pl/reset-password');
  });

  it('hands the token and email to the page in an httpOnly cookie scoped to the reset page', async () => {
    const response = await proxy(new NextRequest(RESET_LINK));
    const cookie = response.cookies.get(RESET_PASSWORD_COOKIE);

    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/reset-password' });
    expect(cookie?.maxAge).toBeGreaterThan(0);

    // What the browser sends back on the redirected request, as the page reads it
    const setCookie = response.headers.get('set-cookie') ?? '';
    const nextRequest = new NextRequest('https://vocare.pl/reset-password', {
      headers: { cookie: setCookie.split(';')[0] },
    });

    expect(parseResetPasswordLink(nextRequest.cookies.get(RESET_PASSWORD_COOKIE)?.value)).toEqual({
      token: TOKEN,
      email: EMAIL,
    });
  });

  it('clears a cookie left by an earlier link when the link is incomplete', async () => {
    const response = await proxy(new NextRequest('https://vocare.pl/reset-password?token=abc'));

    expect(response.headers.get('location')).toBe('https://vocare.pl/reset-password');
    expect(response.cookies.get(RESET_PASSWORD_COOKIE)).toMatchObject({
      value: '',
      maxAge: 0,
      path: '/reset-password',
    });
  });

  it('lets the bare reset page through', async () => {
    const response = await proxy(new NextRequest('https://vocare.pl/reset-password'));

    expect(response.headers.get('location')).toBeNull();
    expect(response.cookies.get(RESET_PASSWORD_COOKIE)).toBeUndefined();
  });

  it('does not touch a token parameter on other pages', async () => {
    const response = await proxy(new NextRequest('https://vocare.pl/sign-in?token=abc'));

    expect(response.headers.get('location')).toBeNull();
    expect(response.cookies.get(RESET_PASSWORD_COOKIE)).toBeUndefined();
  });
});
