// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieStore, resetPasswordService } = vi.hoisted(() => ({
  cookieStore: { get: vi.fn(), delete: vi.fn() },
  resetPasswordService: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('@/features/auth/dal/api', () => ({ getOAuthEndpoint: vi.fn() }));
vi.mock('@/features/auth/oauth/base', () => ({ getOauthClient: vi.fn() }));
vi.mock('../dal/services', () => ({ resetPasswordService }));

import { resetPassword } from '../dal/commands';
import { RESET_PASSWORD_COOKIE, serializeResetPasswordLink } from '../reset-password-link';

const passwords = { newPassword: 'Nowe-haslo1', confirmPassword: 'Nowe-haslo1' };
const link = { token: 'CfDJ8+Ab/cd==', email: 'jan@example.com' };

function okResult() {
  return { match: (onOk: () => unknown) => onOk() };
}

function errResult(error: unknown) {
  return { match: (_onOk: unknown, onErr: (e: unknown) => unknown) => onErr(error) };
}

describe('resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.get.mockImplementation((name: string) =>
      name === RESET_PASSWORD_COOKIE ? { name, value: serializeResetPasswordLink(link) } : undefined
    );
  });

  it('sends the token and email from the cookie, not from the browser', async () => {
    resetPasswordService.mockResolvedValue(okResult());

    const [error] = await resetPassword(passwords);

    expect(error).toBeNull();
    expect(resetPasswordService).toHaveBeenCalledWith({ ...link, ...passwords });
  });

  it('removes the cookie once the password has changed', async () => {
    resetPasswordService.mockResolvedValue(okResult());

    await resetPassword(passwords);

    expect(cookieStore.delete).toHaveBeenCalledWith({
      name: RESET_PASSWORD_COOKIE,
      path: '/reset-password',
    });
  });

  it('keeps the cookie when the API rejects the new password, so the user can retry', async () => {
    resetPasswordService.mockResolvedValue(
      errResult({
        type: 'InvalidResetToken',
        message: 'Hasło nie spełnia wymagań lub token wygasł',
      })
    );

    const [error] = await resetPassword(passwords);

    expect(error?.type).toBe('InvalidResetToken');
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it('asks to reopen the email link when the cookie has expired', async () => {
    cookieStore.get.mockReturnValue(undefined);

    const [error] = await resetPassword(passwords);

    expect(error?.type).toBe('ExpiredResetToken');
    expect(resetPasswordService).not.toHaveBeenCalled();
  });
});
