import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import type { SubscriptionStatuses } from '@/features/billing/types';

import TailorCvFromEditorDialog, {
  type TailorCvSubmitResult,
} from '../components/TailorCvFromEditorDialog';

const availableLimits = {
  canCreateNew: true,
  currentCount: 1,
  maxLimit: 3,
};

const fullLimits = {
  canCreateNew: false,
  currentCount: 3,
  maxLimit: 3,
};

type SubmitHandler = ComponentProps<typeof TailorCvFromEditorDialog>['onSubmit'];
const createSubmitMock = () => vi.fn<SubmitHandler>().mockResolvedValue('success');
type SubmitMock = ReturnType<typeof createSubmitMock>;
type UpgradeHandler = ComponentProps<typeof TailorCvFromEditorDialog>['onUpgrade'];
const createUpgradeMock = () => vi.fn<UpgradeHandler>();
type UpgradeMock = ReturnType<typeof createUpgradeMock>;

const renderDialog = ({
  limits = availableLimits,
  isCheckingLimits = false,
  onSubmit = createSubmitMock(),
  onUpgrade = createUpgradeMock(),
  tokenBalance = 100,
  subscriptionStatus = 'None',
}: {
  limits?: typeof availableLimits | null;
  isCheckingLimits?: boolean;
  onSubmit?: SubmitMock;
  onUpgrade?: UpgradeMock;
  tokenBalance?: number;
  subscriptionStatus?: SubscriptionStatuses;
} = {}) => {
  render(
    <TokenBalanceProvider tokenBalance={tokenBalance} subscriptionStatus={subscriptionStatus}>
      <TailorCvFromEditorDialog
        open
        limits={limits}
        currentCvName="Bazowe CV"
        defaultTargetPosition="Frontend Developer"
        isCheckingLimits={isCheckingLimits}
        isSubmitting={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        onUpgrade={onUpgrade}
      />
    </TokenBalanceProvider>
  );

  return { onSubmit, onUpgrade };
};

const fillOffer = () => {
  fireEvent.change(screen.getByLabelText('Tytuł stanowiska'), {
    target: { value: 'Senior Frontend Developer' },
  });
  fireEvent.change(screen.getByLabelText('Opis oferty'), {
    target: { value: 'Szukamy osoby znającej React i TypeScript.' },
  });
};

afterEach(cleanup);

describe('TailorCvFromEditorDialog', () => {
  it('shows the copy safety note directly below the job description', () => {
    renderDialog();

    const jobDescription = screen.getByLabelText('Opis oferty');
    const safetyNote = screen.getByText(
      'Aktualne CV nie zostanie zastąpione. Nową wersję zapiszemy jako osobne CV i dopiero ją dopasujemy do oferty.'
    );

    expect(jobDescription.nextElementSibling).toBe(safetyNote);
    expect(safetyNote.id).toBe('editor-copy-safety-note');
    expect(safetyNote.classList.contains('font-light')).toBe(true);
    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it('shows the full CV limit as a lightweight note below the job description', () => {
    renderDialog({ limits: fullLimits });

    const jobDescription = screen.getByLabelText('Opis oferty');
    const limitNote = document.querySelector('#editor-cv-limit-note');

    expect(jobDescription.nextElementSibling).toBe(limitNote);
    expect(limitNote?.textContent).toContain('Limit CV wykorzystany · 3/3.');
    expect(limitNote?.textContent).toContain(
      'Nie możemy zapisać kolejnej kopii. Możesz zastąpić obecne CV albo zwiększyć limit.'
    );
    expect(document.querySelector('.bg-amber-400\\/10')).toBeNull();
  });

  it('creates a separate tailored copy when a CV slot is available', async () => {
    const { onSubmit } = renderDialog({ tokenBalance: 20 });
    fillOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV pod ofertę' }));

    const costTitle = screen.getByRole('heading', { name: 'Wygenerować CV pod ofertę?' });
    expect(document.activeElement).toBe(costTitle);
    expect(screen.getByText('20 tokenów')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      {
        targetPosition: 'Senior Frontend Developer',
        jobDescription: 'Szukamy osoby znającej React i TypeScript.',
      },
      'copy'
    );
  });

  it('requires explicit confirmation before replacing a CV at the limit', async () => {
    const { onSubmit } = renderDialog({ limits: fullLimits });
    fillOffer();

    expect(screen.queryByText(/Aktualne CV nie zostanie zastąpione/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Zastąp obecne CV' }));

    const confirmationTitle = screen.getByRole('heading', {
      name: 'Zastąpić „Bazowe CV”?',
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(confirmationTitle);

    fireEvent.click(screen.getByRole('button', { name: 'Wróć' }));
    expect((screen.getByLabelText('Opis oferty') as HTMLTextAreaElement).value).toBe(
      'Szukamy osoby znającej React i TypeScript.'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Zastąp obecne CV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tak, zastąp CV' }));

    expect(screen.getByRole('heading', { name: 'Wygenerować CV pod ofertę?' })).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Generuj i zastąp CV' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[1]).toBe('replace');
  });

  it('keeps the offer and switches to replacement when the limit changes during submit', async () => {
    const onSubmit = vi
      .fn<SubmitHandler>()
      .mockResolvedValueOnce('limit-reached')
      .mockResolvedValueOnce('success');
    renderDialog({ onSubmit });
    fillOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV pod ofertę' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));
    await screen.findByRole('heading', { name: 'Zastąpić „Bazowe CV”?' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[1]).toBe('copy');

    fireEvent.click(screen.getByRole('button', { name: 'Tak, zastąp CV' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1]?.[1]).toBe('replace');
    expect(screen.queryByRole('heading', { name: 'Wygenerować CV pod ofertę?' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Wróć' }));
    expect((screen.getByLabelText('Opis oferty') as HTMLTextAreaElement).value).toBe(
      'Szukamy osoby znającej React i TypeScript.'
    );
    expect(screen.getByText(/^Limit CV wykorzystany/)).toBeTruthy();
  });

  it('blocks generation and links to pricing when the token balance is too low', () => {
    const onUpgrade = createUpgradeMock();
    const { onSubmit } = renderDialog({ tokenBalance: 19, onUpgrade });
    fillOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV pod ofertę' }));

    expect(screen.getByRole('alert').textContent).toContain(
      'Niewystarczające saldo (19/20 tokenów)'
    );
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Zdobądź tokeny' }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows generation without tokens for an active subscription', async () => {
    const { onSubmit } = renderDialog({ tokenBalance: 0, subscriptionStatus: 'Active' });
    fillOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV pod ofertę' }));

    expect(
      screen.getByText('Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.')
    ).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('handles a stale balance rejected by the backend', async () => {
    const onSubmit = vi.fn<SubmitHandler>().mockResolvedValue('insufficient-tokens');
    renderDialog({ tokenBalance: 0, subscriptionStatus: 'Active', onSubmit });
    fillOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV pod ofertę' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alert').textContent).toContain('Saldo tokenów zmieniło się');
    const upgradeButton = screen.getByRole('button', { name: 'Zdobądź tokeny' });
    expect(document.activeElement).toBe(upgradeButton);
    expect(
      screen.queryByText('Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.')
    ).toBeNull();
  });

  it('keeps the offer and restores focus when returning from the cost confirmation', () => {
    renderDialog();
    fillOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV pod ofertę' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wróć' }));

    const formTitle = screen.getByRole('heading', { name: 'Wygeneruj CV pod ofertę' });
    expect(document.activeElement).toBe(formTitle);
    expect((screen.getByLabelText('Opis oferty') as HTMLTextAreaElement).value).toBe(
      'Szukamy osoby znającej React i TypeScript.'
    );
  });

  it('returns to the form when the submit callback rejects', async () => {
    const onSubmit = vi.fn<SubmitHandler>().mockRejectedValue(new Error('network failure'));
    renderDialog({ onSubmit });
    fillOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV pod ofertę' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await screen.findByRole('alert');
    expect(screen.getByRole('heading', { name: 'Wygeneruj CV pod ofertę' })).toBeTruthy();
    expect((screen.getByLabelText('Opis oferty') as HTMLTextAreaElement).value).toBe(
      'Szukamy osoby znającej React i TypeScript.'
    );
  });

  it('allows only one generation request after a double click', async () => {
    let resolveSubmit: (result: TailorCvSubmitResult) => void = () => undefined;
    const onSubmit = vi.fn<SubmitHandler>(
      () =>
        new Promise<TailorCvSubmitResult>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    renderDialog({ onSubmit });
    fillOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV pod ofertę' }));
    const generateButton = screen.getByRole('button', { name: 'Generuj' });
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    resolveSubmit('success');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('blocks submission while the current CV limit is being checked', () => {
    const { onSubmit } = renderDialog({ limits: null, isCheckingLimits: true });
    fillOffer();

    const submitButton = screen.getByRole('button', { name: 'Sprawdzanie limitu...' });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Sprawdzamy dostępny limit CV')).toBeTruthy();

    fireEvent.click(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
