import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMarketingActions } from '../hooks/useMarketingActions';

const mocks = vi.hoisted(() => ({
  giveMarketingConsentCommand: vi.fn(),
  withdrawMarketingConsentCommand: vi.fn(),
  unauthorizedToast: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('../dal/commands', () => ({
  giveMarketingConsentCommand: mocks.giveMarketingConsentCommand,
  withdrawMarketingConsentCommand: mocks.withdrawMarketingConsentCommand,
}));

vi.mock('@/lib/hooks/useUnauthorizedToast', () => ({
  useUnauthorizedToast: () => ({ unauthorizedToast: mocks.unauthorizedToast }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

const toggle = async (nextValue: boolean) => {
  const setConsent = vi.fn();
  const { result } = renderHook(() => useMarketingActions());

  await act(async () => {
    result.current.handleMarketingToggle(nextValue, setConsent);
  });

  return setConsent;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useMarketingActions', () => {
  it('announces granted welcome tokens on the first consent', async () => {
    mocks.giveMarketingConsentCommand.mockResolvedValue([
      null,
      { message: 'ok', welcomeBonusStatus: 'Granted', welcomeTokensGranted: 120 },
    ]);

    const setConsent = await toggle(true);

    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Zgody marketingowe włączone, przyznano 120 tokenów. Będziemy w kontakcie!'
    );
    expect(setConsent).toHaveBeenCalledWith(true);
  });

  it('skips the token info when the bonus was already claimed', async () => {
    mocks.giveMarketingConsentCommand.mockResolvedValue([
      null,
      { message: 'ok', welcomeBonusStatus: 'AlreadyClaimed', welcomeTokensGranted: 0 },
    ]);

    await toggle(true);

    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Zgody marketingowe włączone. Będziemy w kontakcie!'
    );
  });

  it('confirms the withdrawal', async () => {
    mocks.withdrawMarketingConsentCommand.mockResolvedValue([null, { message: 'ok' }]);

    const setConsent = await toggle(false);

    expect(mocks.toastSuccess).toHaveBeenCalledWith('Zgody marketingowe zostały wycofane.');
    expect(setConsent).toHaveBeenCalledWith(false);
  });

  it.each([
    [true, 'AlreadyActive'],
    [false, 'NoActiveConsent'],
  ] as const)(
    'keeps the requested state %s silently when backend reports %s',
    async (nextValue, type) => {
      const command = nextValue
        ? mocks.giveMarketingConsentCommand
        : mocks.withdrawMarketingConsentCommand;
      command.mockResolvedValue([{ type, message: 'error' }, null]);

      const setConsent = await toggle(nextValue);

      expect(setConsent).toHaveBeenCalledWith(nextValue);
      expect(mocks.toastError).not.toHaveBeenCalled();
      expect(mocks.toastSuccess).not.toHaveBeenCalled();
    }
  );

  it('reverts the toggle and shows an error on generic failure', async () => {
    mocks.giveMarketingConsentCommand.mockResolvedValue([
      { type: 'GenericApiError', message: 'error' },
      null,
    ]);

    const setConsent = await toggle(true);

    expect(mocks.toastError).toHaveBeenCalledWith('Nie udało się udzielić zgody marketingowej.');
    expect(setConsent).toHaveBeenCalledWith(false);
  });
});
