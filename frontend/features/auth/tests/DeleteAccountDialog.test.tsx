import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteAccountDialog } from '../components/DeleteAccountDialog';

const mocks = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/features/auth/dal/commands', () => ({
  deleteAccount: mocks.deleteAccount,
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

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

const originalLocation = window.location;

beforeEach(() => {
  localStorage.clear();
  mocks.deleteAccount.mockReset();
  mocks.toastError.mockReset();
  mocks.toastSuccess.mockReset();
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, href: '' },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe('DeleteAccountDialog', () => {
  it('renders modal with warning and inputs when open', () => {
    render(<DeleteAccountDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Trwałe usunięcie konta')).toBeDefined();
    expect(screen.getByText('Strefa niebezpieczna')).toBeDefined();
    expect(screen.getByLabelText('Hasło do konta')).toBeDefined();
    expect(screen.getByRole('button', { name: /Potwierdzam usunięcie konta/i })).toBeDefined();
  });

  it('submits deletion without password for OAuth users and redirects on success', async () => {
    mocks.deleteAccount.mockResolvedValue([null, { success: true }]);
    const onClose = vi.fn();

    render(<DeleteAccountDialog isOpen={true} onClose={onClose} />);

    const confirmButton = screen.getByRole('button', { name: /Potwierdzam usunięcie konta/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mocks.deleteAccount).toHaveBeenCalledWith(undefined);
    });

    await waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith('Twoje konto zostało pomyślnie usunięte.');
      expect(onClose).toHaveBeenCalled();
      expect(window.location.href).toBe('/');
    });
  });

  it('submits deletion with trimmed password when entered', async () => {
    mocks.deleteAccount.mockResolvedValue([null, { success: true }]);
    const onClose = vi.fn();

    render(<DeleteAccountDialog isOpen={true} onClose={onClose} />);

    const passwordInput = screen.getByLabelText('Hasło do konta');
    fireEvent.change(passwordInput, { target: { value: 'SecretPassword123!' } });

    const confirmButton = screen.getByRole('button', { name: /Potwierdzam usunięcie konta/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mocks.deleteAccount).toHaveBeenCalledWith({ password: 'SecretPassword123!' });
    });
  });

  it('displays error message when deletion fails', async () => {
    mocks.deleteAccount.mockResolvedValue([
      { type: 'InvalidPassword', message: 'Podane hasło jest nieprawidłowe' },
      null,
    ]);
    const onClose = vi.fn();

    render(<DeleteAccountDialog isOpen={true} onClose={onClose} />);

    const confirmButton = screen.getByRole('button', { name: /Potwierdzam usunięcie konta/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Podane hasło jest nieprawidłowe');
    });

    expect(mocks.toastError).toHaveBeenCalledWith('Podane hasło jest nieprawidłowe');
    expect(onClose).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });
});
