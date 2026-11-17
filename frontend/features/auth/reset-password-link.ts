import { z } from 'zod';

/**
 * The reset link in the email carries the token and the email address in its query string.
 * GA4 and the TikTok and Meta pixels send the page address to their servers, so proxy.ts moves
 * both values into this cookie and redirects to the bare path before any script can load.
 */
export const RESET_PASSWORD_PATH = '/reset-password';
export const RESET_PASSWORD_COOKIE = 'reset_password';

// Shorter than the token's 24 hours: opening the link from the email again sets it anew
const RESET_PASSWORD_COOKIE_MAX_AGE_SECONDS = 60 * 60;

export const RESET_PASSWORD_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development',
  // Lax, because the link is opened from another site (the mailbox)
  sameSite: 'lax',
  path: RESET_PASSWORD_PATH,
  maxAge: RESET_PASSWORD_COOKIE_MAX_AGE_SECONDS,
} as const;

const resetPasswordLinkSchema = z.object({
  token: z.string().min(1),
  email: z.string().min(1),
});

export type ResetPasswordLink = z.infer<typeof resetPasswordLinkSchema>;

export function serializeResetPasswordLink(link: ResetPasswordLink): string {
  return JSON.stringify(link);
}

export function parseResetPasswordLink(value: string | undefined): ResetPasswordLink | null {
  if (!value) return null;

  try {
    const result = resetPasswordLinkSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
