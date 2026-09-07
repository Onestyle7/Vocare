// @vitest-environment node

import { ok } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { acceptLegalConsents } from '../dal/commands';

const mocks = vi.hoisted(() => ({
  acceptLegalConsentsService: vi.fn(),
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 3600,
  },
  cookieSet: vi.fn(),
  invalidateUserTag: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: mocks.cookieSet })),
}));

vi.mock('@/features/auth/auth-cookie', () => ({
  AUTH_COOKIE_OPTIONS: mocks.cookieOptions,
}));

vi.mock('@/lib/tags', () => ({
  invalidateUserTag: mocks.invalidateUserTag,
}));

vi.mock('../dal/services', () => ({
  acceptLegalConsentsService: mocks.acceptLegalConsentsService,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('acceptLegalConsents', () => {
  it('stores the refreshed token in a protected cookie without returning it to the client', async () => {
    mocks.acceptLegalConsentsService.mockResolvedValue(
      ok({ success: true, accessToken: 'server-only-token' })
    );

    const result = await acceptLegalConsents({ documentIds: ['terms-1', 'privacy-1'] });

    expect(mocks.cookieSet).toHaveBeenCalledWith('token', 'server-only-token', mocks.cookieOptions);
    expect(mocks.invalidateUserTag).toHaveBeenCalledWith('legalConsents');
    expect(result).toEqual([null, { success: true }]);
    expect(JSON.stringify(result)).not.toContain('server-only-token');
  });

  it('does not report success when the backend omits the refreshed token', async () => {
    mocks.acceptLegalConsentsService.mockResolvedValue(
      ok({ success: true, accessToken: undefined })
    );

    const [error, data] = await acceptLegalConsents({ documentIds: ['terms-1'] });

    expect(error?.type).toBe('GenericApiError');
    expect(data).toBeNull();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.invalidateUserTag).not.toHaveBeenCalled();
  });
});
