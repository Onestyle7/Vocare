import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LegalConsentModal } from '../components/LegalConsentModal';
import type { PendingDocumentDto } from '../types';

const mocks = vi.hoisted(() => ({
  acceptLegalConsents: vi.fn(),
  logOut: vi.fn(),
  replace: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@/features/auth/dal/commands', () => ({
  logOut: mocks.logOut,
  deleteAccount: vi.fn(),
}));

vi.mock('../dal/commands', () => ({
  acceptLegalConsents: mocks.acceptLegalConsents,
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

const documents: PendingDocumentDto[] = [
  {
    id: 'terms-1',
    type: 'TermsOfService',
    version: '1.0',
    contentPath: '/legal/terms-v1.0.pdf',
    validFrom: '2026-09-01T00:00:00Z',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'privacy-1',
    type: 'PrivacyPolicy',
    version: '1.0',
    contentPath: '/legal/privacy-v1.0.pdf',
    validFrom: '2026-09-01T00:00:00Z',
    createdAt: '2026-09-01T00:00:00Z',
  },
];

const renderModal = ({ onSuccess = vi.fn(), onLogout = vi.fn() } = {}) => {
  render(
    <LegalConsentModal isOpen documents={documents} onSuccess={onSuccess} onLogout={onLogout} />
  );

  return { onSuccess, onLogout };
};

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

beforeEach(() => {
  localStorage.clear();
  mocks.acceptLegalConsents.mockResolvedValue([null, { success: true }]);
  mocks.logOut.mockResolvedValue([null, { success: true }]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('LegalConsentModal', () => {
  it('requires every displayed document before submitting their ids', async () => {
    const { onSuccess } = renderModal();
    const submitButton = screen.getByRole('button', {
      name: 'Akceptuję i przechodzę do serwisu',
    });

    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(checkboxes[1]);
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(mocks.acceptLegalConsents).toHaveBeenCalledWith({
        documentIds: ['terms-1', 'privacy-1'],
      })
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('shows an action error and keeps the modal open', async () => {
    mocks.acceptLegalConsents.mockResolvedValue([
      { type: 'GenericApiError', message: 'Nie udało się zapisać zgód.' },
      null,
    ]);
    const { onSuccess } = renderModal();

    screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox));
    fireEvent.click(screen.getByRole('button', { name: 'Akceptuję i przechodzę do serwisu' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Nie udało się zapisać zgód.');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
  });

  it('restores the submit state after an unexpected action failure', async () => {
    mocks.acceptLegalConsents.mockRejectedValue(new Error('network failure'));
    renderModal();

    screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox));
    fireEvent.click(screen.getByRole('button', { name: 'Akceptuję i przechodzę do serwisu' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Wystąpił błąd podczas akceptacji regulaminów.'
    );
    expect(
      (
        screen.getByRole('button', {
          name: 'Akceptuję i przechodzę do serwisu',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });

  it('clears a legacy token and redirects after logout', async () => {
    localStorage.setItem('token', 'legacy-token');
    const { onLogout } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Wyloguj się' }));

    await waitFor(() => expect(mocks.logOut).toHaveBeenCalledTimes(1));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('token')).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
  });
});
