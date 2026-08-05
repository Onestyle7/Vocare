import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import type { ServiceCostActionResult } from '@/features/billing/types';

import NoMarketAnalysisState from '../components/NoMarketAnalysisState';
import { useMarketAnalysisActions } from '../hooks/useMarketAnalysisActions';

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  const refresh = vi.fn();

  return {
    generateMarketAnalysisCommand: vi.fn(),
    push,
    refresh,
    router: { push, refresh },
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
    unauthorizedToast: vi.fn(),
  };
});

vi.mock('next/image', () => ({
  default: () => <span data-testid="mock-image" />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mocks.router,
}));

vi.mock('../dal/commands', () => ({
  generateMarketAnalysisCommand: mocks.generateMarketAnalysisCommand,
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

vi.mock('../components/GridBackgroundDemo', () => ({
  GridBackgroundDemo: () => null,
}));

const executeGeneration = async (
  commandResult: [Record<string, unknown> | null, Record<string, unknown> | null]
) => {
  mocks.generateMarketAnalysisCommand.mockResolvedValue(commandResult);
  const { result } = renderHook(() => useMarketAnalysisActions());
  let actionResult: ServiceCostActionResult | undefined;

  await act(async () => {
    actionResult = await result.current.handleGenerateNewAnalysis();
  });

  return { actionResult, hook: result.current };
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Market Analysis generation flow', () => {
  it('opens the shared Market modal before the first analysis', async () => {
    const onGenerate = vi.fn().mockResolvedValue('success');

    render(
      <TokenBalanceProvider tokenBalance={50} subscriptionStatus="None">
        <NoMarketAnalysisState onOpenAdvisor={vi.fn()} onGenerate={onGenerate} />
      </TokenBalanceProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Wygeneruj/ }));

    expect(screen.getByRole('heading', { name: 'Wygenerować analizę rynku?' })).toBeTruthy();
    expect(screen.getByText('50 tokenów')).toBeTruthy();
    expect(document.querySelector('.lucide-trending-up')).toBeTruthy();
    expect(onGenerate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));
    await waitFor(() => expect(onGenerate).toHaveBeenCalledTimes(1));
  });

  it('does not expose a paid action before career paths exist', () => {
    const onGenerate = vi.fn().mockResolvedValue('success');
    const onOpenAdvisor = vi.fn();

    render(
      <TokenBalanceProvider tokenBalance={50} subscriptionStatus="None">
        <NoMarketAnalysisState
          requiresCareerPaths
          onOpenAdvisor={onOpenAdvisor}
          onGenerate={onGenerate}
        />
      </TokenBalanceProvider>
    );

    expect(screen.queryByRole('button', { name: /Wygeneruj/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Przejdź do Doradcy' }));
    expect(onOpenAdvisor).toHaveBeenCalledTimes(1);
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('returns success after generation and announces the new analysis', async () => {
    const { actionResult } = await executeGeneration([null, { id: 'analysis-1' }]);

    expect(actionResult).toBe('success');
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Nowa analiza rynku została wygenerowana pomyślnie'
    );
  });

  it('passes an insufficient-token response back to the shared modal', async () => {
    const { actionResult, hook } = await executeGeneration([
      { type: 'InsufficientTokens', message: 'Za mało tokenów' },
      null,
    ]);

    expect(actionResult).toBe('insufficient-tokens');
    expect(hook.generateError?.type).toBe('InsufficientTokens');
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('handles authorization and missing career paths without a blind retry', async () => {
    const unauthorized = await executeGeneration([
      { type: 'Unauthorized', message: 'Session expired' },
      null,
    ]);
    expect(unauthorized.actionResult).toBe('handled-error');
    expect(mocks.unauthorizedToast).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    const missingPaths = await executeGeneration([
      { type: 'MissingCareerPaths', message: 'Brak ścieżek kariery' },
      null,
    ]);
    expect(missingPaths.actionResult).toBe('handled-error');
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
  });

  it('keeps a generic, potentially ambiguous outcome in the modal error state', async () => {
    const { actionResult } = await executeGeneration([
      { type: 'GenericApiError', message: 'Unknown outcome' },
      null,
    ]);

    expect(actionResult).toBe('error');
    expect(mocks.toastError).not.toHaveBeenCalled();
  });
});
