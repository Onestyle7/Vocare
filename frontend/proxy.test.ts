// @vitest-environment node

import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { parseResetPasswordLink, RESET_PASSWORD_COOKIE } from '@/features/auth/reset-password-link';

import { proxy } from './proxy';

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
