/**
 * The auth cookies (`token`, `userId`) live for one hour, so once they expire a returning user
 * looks exactly like a first-time visitor. This marker outlives them and tells the proxy which
 * of the two it is:
 *
 * - `active`: signed in, never signed out. A missing `token` means the session expired.
 * - `signed-out`: signed out on purpose. Send them to sign in, without an error message.
 * - no marker: has never signed in on this browser. Send them to sign up, not to a login form
 *   that greets them with "Sesja wygasła".
 *
 * It holds no identifier, only one of the two states above.
 */
export const SESSION_MARKER_COOKIE = 'vc_session';

export const SESSION_MARKER = {
  active: 'active',
  signedOut: 'signed-out',
} as const;

export type SessionMarker = (typeof SESSION_MARKER)[keyof typeof SESSION_MARKER];

export const SESSION_MARKER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development',
  sameSite: 'lax',
  path: '/',
  // Listed in the privacy policy ("Pliki cookies") with this lifetime; change both together
  maxAge: 60 * 60 * 24 * 90,
} as const;

export const SESSION_EXPIRED_REASON = 'Sesja wygasła. Zaloguj się ponownie';

/** Only same-site paths, so `callbackUrl` cannot be used to send someone to another domain. */
export function safeCallbackPath(value: string | null | undefined): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return undefined;
  }
  return value;
}
