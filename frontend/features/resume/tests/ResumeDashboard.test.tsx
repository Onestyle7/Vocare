import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';

import ResumeDashboard from '../components/resumeDashboard';

const mocks = vi.hoisted(() => ({
  handleCreateResume: vi.fn(),
  handleDeleteResume: vi.fn(),
  handleGenerateResume: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: () => <span data-testid="mock-image" />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
    replace: mocks.replace,
  }),
}));

vi.mock('@/features/market-analysis/components/GridBackgroundDemo', () => ({
  GridBackgroundDemo: () => null,
}));

vi.mock('@/lib/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../hooks/useResumeDashboardActions', () => ({
  useResumeDashboardActions: () => ({
    handleCreateResume: mocks.handleCreateResume,
    handleDeleteResume: mocks.handleDeleteResume,
    handleGenerateResume: mocks.handleGenerateResume,
    isCreating: false,
    isGenerating: false,
  }),
}));

const availableLimits = {
  canCreateNew: true,
  currentCount: 0,
  maxLimit: 3,
};

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const renderDashboard = ({
  tokenBalance = 100,
  subscriptionStatus = 'None',
}: {
  tokenBalance?: number;
  subscriptionStatus?: 'None' | 'Active';
} = {}) =>
  render(
    <TokenBalanceProvider tokenBalance={tokenBalance} subscriptionStatus={subscriptionStatus}>
      <ResumeDashboard initialCvs={[]} initialLimits={availableLimits} />
    </TokenBalanceProvider>
  );

const openCreationPicker = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));
};

const openJobOfferForm = async () => {
  openCreationPicker();
  fireEvent.click(screen.getByRole('button', { name: /Wygeneruj CV pod konkretną ofertę/i }));
  await screen.findByLabelText('Tytuł stanowiska');
};

const fillJobOffer = () => {
  fireEvent.change(screen.getByLabelText('Tytuł stanowiska'), {
    target: { value: 'Senior Frontend Developer' },
  });
  fireEvent.change(screen.getByLabelText('Opis oferty'), {
    target: { value: 'Szukamy osoby znającej React i TypeScript.' },
  });
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    return window.setTimeout(() => callback(performance.now()), 0);
  });
  mocks.handleGenerateResume.mockResolvedValue('success');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('ResumeDashboard CV generation cost confirmation', () => {
  it('creates a blank CV without a token confirmation because the service is free', () => {
    renderDashboard();
    openCreationPicker();

    fireEvent.click(screen.getByRole('button', { name: /Stwórz puste CV/i }));

    expect(mocks.handleCreateResume).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('heading', { name: 'Wygenerować CV pod ofertę?' })).toBeNull();
  });

  it('requires confirmation of the 20-token cost before generating from a job offer', async () => {
    renderDashboard({ tokenBalance: 20 });
    await openJobOfferForm();
    fillJobOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));

    const costTitle = await screen.findByRole('heading', {
      name: 'Wygenerować CV pod ofertę?',
    });
    await waitFor(() => expect(document.activeElement).toBe(costTitle));
    expect(screen.getByText('20 tokenów')).toBeTruthy();
    expect(mocks.handleGenerateResume).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await waitFor(() => expect(mocks.handleGenerateResume).toHaveBeenCalledTimes(1));
    expect(mocks.handleGenerateResume).toHaveBeenCalledWith({
      targetPosition: 'Senior Frontend Developer',
      jobDescription: 'Szukamy osoby znającej React i TypeScript.',
    });
  });

  it('keeps the form values and restores focus when returning from cost confirmation', async () => {
    renderDashboard();
    await openJobOfferForm();
    fillJobOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Wróć' }));

    const formTitle = await screen.findByRole('heading', { name: 'Wygeneruj CV pod ofertę' });
    await waitFor(() => expect(document.activeElement).toBe(formTitle));
    expect((screen.getByLabelText('Tytuł stanowiska') as HTMLInputElement).value).toBe(
      'Senior Frontend Developer'
    );
    expect((screen.getByLabelText('Opis oferty') as HTMLTextAreaElement).value).toBe(
      'Szukamy osoby znającej React i TypeScript.'
    );
  });

  it('blocks generation and offers token purchase when the balance is too low', async () => {
    renderDashboard({ tokenBalance: 19 });
    await openJobOfferForm();
    fillJobOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Niewystarczające saldo (19/20 tokenów)'
    );
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Zdobądź tokeny' })).toBeTruthy();
    expect(mocks.handleGenerateResume).not.toHaveBeenCalled();
  });

  it('does not charge users with an active subscription', async () => {
    renderDashboard({ tokenBalance: 0, subscriptionStatus: 'Active' });
    await openJobOfferForm();
    fillJobOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));

    expect(
      await screen.findByText(
        'Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.'
      )
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Generuj' })).toBeTruthy();
  });

  it('switches to the insufficient-balance state when the backend rejects stale billing data', async () => {
    mocks.handleGenerateResume.mockResolvedValue('insufficient-tokens');
    renderDashboard({ tokenBalance: 100 });
    await openJobOfferForm();
    fillJobOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Generuj' }));

    await waitFor(() => expect(mocks.handleGenerateResume).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alert').textContent).toContain('Saldo tokenów zmieniło się');
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();
  });

  it('submits only once when the confirmation button is clicked twice', async () => {
    let resolveGeneration: ((result: 'success') => void) | undefined;
    mocks.handleGenerateResume.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGeneration = resolve;
        })
    );
    renderDashboard();
    await openJobOfferForm();
    fillJobOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));
    const generateButton = await screen.findByRole('button', { name: 'Generuj' });
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    expect(mocks.handleGenerateResume).toHaveBeenCalledTimes(1);

    await act(async () => resolveGeneration?.('success'));
  });

  it('shows a limit step in the same dialog when the backend detects a limit race', async () => {
    mocks.handleGenerateResume.mockResolvedValue('limit-reached');
    renderDashboard();
    await openJobOfferForm();
    fillJobOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Generuj' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Osiągnąłeś limit CV dla swojego planu',
      })
    ).toBeTruthy();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(mocks.handleGenerateResume).toHaveBeenCalledTimes(1);
  });

  it('does not offer a blind retry after an ambiguous backend error', async () => {
    mocks.handleGenerateResume.mockResolvedValue('error');
    renderDashboard();
    await openJobOfferForm();
    fillJobOffer();

    fireEvent.click(screen.getByRole('button', { name: 'Stwórz CV' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Generuj' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'nowa pozycja mogła już zostać zapisana'
    );
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Wróć do dashboardu' })).toBeTruthy();
  });
});
