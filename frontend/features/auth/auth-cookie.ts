import 'server-only';

export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development',
  sameSite: 'lax',
  path: '/',
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
} as const;
