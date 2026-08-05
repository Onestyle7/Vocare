import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';

import AssistantPage from '../components/MainPageAssisstant';
import NoRecommendationsState from '../components/NoRecommendationsState';
import { ASSISTANT_AUTO_GENERATE_CONFIRMATION_KEY } from '../constants';

const mocks = vi.hoisted(() => ({
  autoGenerateQuery: true,
  handleAutoGenerateRecommendations: vi.fn().mockResolvedValue('success'),
  handleGenerateNewRecommendations: vi.fn().mockResolvedValue('success'),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: () => <span data-testid="mock-image" />,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/assistant',
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
    replace: mocks.replace,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'autoGenerate' && mocks.autoGenerateQuery ? '1' : null),
    toString: () => (mocks.autoGenerateQuery ? 'autoGenerate=1' : ''),
  }),
}));

vi.mock('@/features/profile/components/ProfileProvider', () => ({
  useProfileContext: () => ({ profile: null, isProfileEmpty: true }),
}));

vi.mock('@/lib/hooks/useCollapse', () => ({
  useCollapse: () => ({ isCollapsed: false, toggleCollapse: vi.fn() }),
}));

vi.mock('../hooks/useAssistantActions', () => ({
  useAssistantActions: () => ({
    handleAutoGenerateRecommendations: mocks.handleAutoGenerateRecommendations,
    handleGenerateNewRecommendations: mocks.handleGenerateNewRecommendations,
    isAutoGenerating: false,
  }),
}));

vi.mock('../components/GenerateRecommendationFail', () => ({
  default: () => <div>Uzupełnij profil</div>,
}));

vi.mock('@/features/market-analysis/components/GridBackgroundDemo', () => ({
  GridBackgroundDemo: () => null,
}));

beforeEach(() => {
  mocks.autoGenerateQuery = true;
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('Assistant generation entry points', () => {
  it('consumes a confirmed one-shot auto-generation even with a stale empty profile provider', async () => {
    sessionStorage.setItem(ASSISTANT_AUTO_GENERATE_CONFIRMATION_KEY, '1');

    render(
      <AssistantPage
        initialRecommendation={null}
        initialJobMatches={[]}
        recommendationError={undefined}
        jobMatchesError={undefined}
      />
    );

    await waitFor(() => expect(mocks.handleAutoGenerateRecommendations).toHaveBeenCalledTimes(1));
    expect(sessionStorage.getItem(ASSISTANT_AUTO_GENERATE_CONFIRMATION_KEY)).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/dashboard/assistant', { scroll: false });
  });

  it('removes an unconfirmed autoGenerate query without starting a paid action', async () => {
    render(
      <AssistantPage
        initialRecommendation={null}
        initialJobMatches={[]}
        recommendationError={undefined}
        jobMatchesError={undefined}
      />
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/dashboard/assistant', { scroll: false })
    );
    expect(mocks.handleAutoGenerateRecommendations).not.toHaveBeenCalled();
  });

  it('opens the shared Assistant modal before first manual generation', async () => {
    const onGenerate = vi.fn().mockResolvedValue('success');

    render(
      <TokenBalanceProvider tokenBalance={60} subscriptionStatus="None">
        <NoRecommendationsState onGenerate={onGenerate} />
      </TokenBalanceProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Wygeneruj' }));

    expect(screen.getByRole('heading', { name: 'Wygenerować rekomendacje?' })).toBeTruthy();
    expect(screen.getByText('60 tokenów')).toBeTruthy();
    expect(document.querySelector('.lucide-briefcase-business')).toBeTruthy();
    expect(onGenerate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));
    await waitFor(() => expect(onGenerate).toHaveBeenCalledTimes(1));
  });
});
