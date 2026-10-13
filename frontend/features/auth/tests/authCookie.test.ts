// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_OPTIONS } from '../auth-cookie';

describe('AUTH_COOKIE_OPTIONS', () => {
  it('keeps authentication cookies inaccessible to browser JavaScript', () => {
    expect(AUTH_COOKIE_OPTIONS).toMatchObject({
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
    });
  });

  it('matches the one-hour access-token lifetime', () => {
    expect(AUTH_COOKIE_MAX_AGE_SECONDS).toBe(60 * 60);
    expect(AUTH_COOKIE_OPTIONS.maxAge).toBe(AUTH_COOKIE_MAX_AGE_SECONDS);
  });
});
