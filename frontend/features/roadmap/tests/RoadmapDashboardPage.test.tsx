import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import type { ServiceCostActionResult } from '@/features/billing/types';
import type { RoadmapListItemDto } from '@/lib/types/roadmap';

import RoadmapDashboardPage from '../components/RoadmapDashboardPage';

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  const refresh = vi.fn();
  const replace = vi.fn();

  return {
    generateRoadmap: vi.fn<() => Promise<ServiceCostActionResult>>(),
    archiveRoadmap: vi.fn(),
    push,
    refresh,
    replace,
    router: { push, refresh, replace },
  };
});

vi.mock('next/image', () => ({
  default: () => <span data-testid="mock-image" />,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/roadmap',
  useRouter: () => mocks.router,
  useSearchParams: () => ({
    get: (key: string) => {
      // The name is not in the address; the page finds it among availableCareerPaths
      if (key === 'careerPathId') return 'career-path-1';
      return null;
    },
  }),
}));

vi.mock('@/features/market-analysis/components/GridBackgroundDemo', () => ({
  GridBackgroundDemo: () => null,
}));

vi.mock('../hooks/useRoadmapDashboardActions', () => ({
  useRoadmapDashboardActions: () => ({
    handleGenerateRoadmap: mocks.generateRoadmap,
    handleArchiveRoadmap: mocks.archiveRoadmap,
    isPending: false,
    isGenerating: false,
    actionError: null,
    deletingId: null,
  }),
}));

const renderDashboard = ({
  tokenBalance = 0,
  initialRoadmaps = [],
}: {
  tokenBalance?: number;
  initialRoadmaps?: RoadmapListItemDto[];
} = {}) =>
  render(
    <TokenBalanceProvider tokenBalance={tokenBalance} subscriptionStatus="None">
      <RoadmapDashboardPage
        initialRoadmaps={initialRoadmaps}
        initialError={null}
        availableCareerPaths={[
          {
            id: 'career-path-1',
            careerName: 'Frontend Developer',
            description: 'Frontend path',
          },
        ]}
      />
    </TokenBalanceProvider>
  );

const openCostConfirmation = async () => {
  await screen.findByRole('heading', { name: 'Utwórz roadmapę' });
  fireEvent.click(screen.getByRole('button', { name: 'Utwórz roadmapę' }));
  return screen.findByRole('heading', { name: 'Wygenerować roadmapę?' });
};

beforeEach(() => {
  mocks.generateRoadmap.mockResolvedValue('success');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RoadmapDashboardPage generation confirmation', () => {
  it('shows a separate truthful free-service confirmation before generation', async () => {
    renderDashboard({ tokenBalance: 0 });

    await openCostConfirmation();

    expect(mocks.generateRoadmap).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Generowanie roadmapy jest obecnie bezpłatne i nie wykorzysta żadnych tokenów.'
      )
    ).toBeTruthy();
    expect(screen.queryByText(/Niewystarczające saldo/)).toBeNull();
    expect(document.querySelector('.lucide-map')).toBeTruthy();
  });

  it('keeps failed roadmaps visible without counting them toward limits or duplicates', async () => {
    renderDashboard({
      initialRoadmaps: [
        {
          id: 'failed-roadmap',
          title: 'Nieudana roadmapa',
          timeHorizonMonths: 9,
          status: 'Draft',
          createdAt: '2026-08-04T12:00:00.000Z',
          careerPathName: 'Frontend Developer',
          progress: 0,
          failureReason: 'Generation failed',
          generationStatus: 'Failed',
        },
      ],
    });

    expect(await screen.findByText('Błąd generacji')).toBeTruthy();
    expect(screen.getByText('Generation failed')).toBeTruthy();
    expect(screen.getByText('0/1')).toBeTruthy();
    expect(screen.queryByText('Masz juz roadmapę dla tej sciezki.')).toBeNull();

    await openCostConfirmation();
    expect(screen.getByRole('button', { name: 'Generuj' })).toBeTruthy();
  });

  it('returns to the populated form without losing the selected path or horizon', async () => {
    renderDashboard();
    await openCostConfirmation();

    fireEvent.click(screen.getByRole('button', { name: 'Wróć' }));

    const formTitle = await screen.findByRole('heading', { name: 'Utwórz roadmapę' });
    await waitFor(() => expect(document.activeElement).toBe(formTitle));
    expect(screen.getByRole('combobox').textContent).toContain('Frontend Developer');
    expect(screen.getByRole('button', { name: '9 mies.' }).getAttribute('aria-pressed')).toBe(
      'true'
    );
  });

  it('submits the accepted payload only once and closes after success', async () => {
    let resolveGeneration: ((result: ServiceCostActionResult) => void) | undefined;
    mocks.generateRoadmap.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGeneration = resolve;
        })
    );
    renderDashboard();
    await openCostConfirmation();

    const generateButton = screen.getByRole('button', { name: 'Generuj' });
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    expect(mocks.generateRoadmap).toHaveBeenCalledTimes(1);
    expect(mocks.generateRoadmap).toHaveBeenCalledWith({
      careerPathId: 'career-path-1',
      timeHorizonMonths: 9,
    });

    await act(async () => {
      resolveGeneration?.('success');
    });

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Wygenerować roadmapę?' })).toBeNull()
    );
  });

  it('closes for a typed handled error', async () => {
    mocks.generateRoadmap.mockResolvedValue('handled-error');
    renderDashboard();
    await openCostConfirmation();

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Wygenerować roadmapę?' })).toBeNull()
    );
  });

  it('shows a safe terminal state for an ambiguous error instead of offering a blind retry', async () => {
    mocks.generateRoadmap.mockResolvedValue('error');
    renderDashboard();
    await openCostConfirmation();

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'nowe generowanie mogło już zostać uruchomione'
    );
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Wróć do roadmap' })).toBeTruthy();
  });
});
