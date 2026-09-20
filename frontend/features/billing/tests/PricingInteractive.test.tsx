import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { PricingInteractive } from '@/features/billing/components/PricingInteractive';
import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import type { SubscriptionStatuses } from '@/features/billing/types';

const billing = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  getCustomerPortalUrl: vi.fn(),
  cancelSubscriptionCommand: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/env/client', () => ({
  default: {
    NEXT_PUBLIC_PERSONAL_PRICE_ID: 'price_test_500_tokens',
    NEXT_PUBLIC_GROWTH_PRICE_ID: 'price_test_premium_monthly',
  },
}));

vi.mock('@/features/billing/dal/commands', () => billing);

vi.mock('sonner', () => ({ toast: { error: billing.toastError } }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

vi.mock('next/image', () => ({ default: () => null }));

vi.mock('react-just-parallax', () => ({
  ScrollParallax: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function renderPricing({
  isAuthenticated = false,
  subscriptionStatus = 'None',
}: {
  isAuthenticated?: boolean;
  subscriptionStatus?: SubscriptionStatuses;
} = {}) {
  return render(
    <AuthProvider isAuthenticated={isAuthenticated}>
      <TokenBalanceProvider tokenBalance={0} subscriptionStatus={subscriptionStatus}>
        <PricingInteractive />
      </TokenBalanceProvider>
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  billing.createCheckout.mockResolvedValue([undefined]);
  billing.getCustomerPortalUrl.mockResolvedValue([undefined]);
});

afterEach(cleanup);

describe('PricingInteractive', () => {
  it('presents the three offers in order with their payment terms and token alternatives', () => {
    renderPricing();

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    ).toEqual(['Free', 'Premium', 'Pakiet 500 tokenów']);
    const free = within(screen.getByRole('article', { name: 'Free' }));
    const premium = within(screen.getByRole('article', { name: 'Premium' }));
    const tokens = within(screen.getByRole('article', { name: 'Pakiet 500 tokenów' }));

    expect(free.getByText(/na zawsze$/)).toBeTruthy();
    expect(premium.getByText('/ miesiąc')).toBeTruthy();
    expect(tokens.getByText('jednorazowo')).toBeTruthy();
    expect(premium.getByText('Najczęściej wybierany')).toBeTruthy();
    expect(tokens.getAllByText('lub')).toHaveLength(3);
    expect(screen.queryByText('Indywidualne')).toBeNull();
  });

  it('links Free to registration and paid offers to sign-in with a return to pricing', () => {
    renderPricing();

    expect(
      screen.getByRole('link', { name: 'Zarejestruj się za darmo' }).getAttribute('href')
    ).toBe('/sign-up');
    for (const name of ['Wybierz Premium', 'Dokup 500 tokenów']) {
      expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(
        '/sign-in?callbackUrl=%2Fpricing'
      );
    }
    expect(billing.createCheckout).not.toHaveBeenCalled();
  });

  it('links an authenticated Free user to the dashboard without initiating checkout', () => {
    renderPricing({ isAuthenticated: true });

    expect(screen.getByRole('link', { name: 'Przejdź do pulpitu' }).getAttribute('href')).toBe(
      '/dashboard'
    );
    expect(billing.createCheckout).not.toHaveBeenCalled();
  });

  it.each([
    ['Wybierz Premium', 'subscription', 'price_test_premium_monthly'],
    ['Dokup 500 tokenów', 'tokens', 'price_test_500_tokens'],
  ])('routes %s to the correct checkout mode and configured price', async (cta, type, priceId) => {
    renderPricing({ isAuthenticated: true });

    fireEvent.click(screen.getByRole('button', { name: cta }));

    await waitFor(() => expect(billing.createCheckout).toHaveBeenCalledTimes(1));
    expect(billing.createCheckout).toHaveBeenCalledWith(type, { priceId });
    expect(billing.getCustomerPortalUrl).not.toHaveBeenCalled();
  });

  it.each(['Active', 'Trialing'] as const)(
    'offers subscription management for %s instead of a second subscription',
    async (subscriptionStatus) => {
      renderPricing({ isAuthenticated: true, subscriptionStatus });

      expect(screen.queryByRole('button', { name: 'Wybierz Premium' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Zarządzaj subskrypcją' }));

      await waitFor(() => expect(billing.getCustomerPortalUrl).toHaveBeenCalledTimes(1));
      expect(billing.createCheckout).not.toHaveBeenCalled();
      expect(billing.cancelSubscriptionCommand).not.toHaveBeenCalled();
    }
  );

  it('still allows a token purchase for a subscriber', async () => {
    renderPricing({ isAuthenticated: true, subscriptionStatus: 'Active' });

    fireEvent.click(screen.getByRole('button', { name: 'Dokup 500 tokenów' }));

    await waitFor(() =>
      expect(billing.createCheckout).toHaveBeenCalledWith('tokens', {
        priceId: 'price_test_500_tokens',
      })
    );
  });

  it('prevents duplicate and competing checkout requests while a payment action is pending', async () => {
    let completeCheckout: (result: [undefined]) => void = () => undefined;
    billing.createCheckout.mockReturnValue(
      new Promise<[undefined]>((resolve) => {
        completeCheckout = resolve;
      })
    );
    renderPricing({ isAuthenticated: true });

    const premiumButton = screen.getByRole('button', { name: 'Wybierz Premium' });
    const tokensButton = screen.getByRole('button', { name: 'Dokup 500 tokenów' });
    fireEvent.click(premiumButton);
    fireEvent.click(premiumButton);
    fireEvent.click(tokensButton);

    expect((premiumButton as HTMLButtonElement).disabled).toBe(true);
    expect((tokensButton as HTMLButtonElement).disabled).toBe(true);
    expect(premiumButton.getAttribute('aria-busy')).toBe('true');
    expect(billing.createCheckout).toHaveBeenCalledTimes(1);

    await act(async () => completeCheckout([undefined]));
    await waitFor(() => expect((premiumButton as HTMLButtonElement).disabled).toBe(false));
  });

  it('shows an initialization failure and re-enables the purchase buttons', async () => {
    billing.createCheckout.mockResolvedValue([
      { type: 'PaymentInitError', message: 'Checkout unavailable' },
    ]);
    renderPricing({ isAuthenticated: true });

    const button = screen.getByRole('button', { name: 'Dokup 500 tokenów' });
    fireEvent.click(button);

    await waitFor(() =>
      expect(billing.toastError).toHaveBeenCalledWith('Błąd podczas inicjowania płatności')
    );
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    expect(billing.createCheckout).toHaveBeenCalledTimes(1);
  });

  it('keeps the payment timing accessible from the Premium action', () => {
    renderPricing({ isAuthenticated: true });

    const button = screen.getByRole('button', { name: 'Wybierz Premium' });
    const description = document.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toBe(
      'Pierwsza płatność dziś, kolejna za miesiąc. Rezygnacja bez zobowiązań.'
    );
  });
});
