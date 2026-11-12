import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackCheckoutCompleted } from '@/features/billing/checkoutTracking';
import { PricingInteractive } from '@/features/billing/components/PricingInteractive';
import type { SubscriptionStatuses } from '@/features/billing/types';
import { ADS_CONSENT_KEY, COOKIE_CONSENT_KEY } from '@/lib/utils/consent';

// The checkout is remembered for the return from Stripe only with tracking consent
const grantAdsConsent = () => {
  document.cookie = `${ADS_CONSENT_KEY}=granted; path=/`;
};

const billing = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  getCustomerPortalUrl: vi.fn(),
  cancelSubscriptionCommand: vi.fn(),
  getSubscriptionStatusAction: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/env/client', () => ({
  default: {
    NEXT_PUBLIC_PERSONAL_PRICE_ID: 'price_test_500_tokens',
    NEXT_PUBLIC_GROWTH_PRICE_ID: 'price_test_premium_monthly',
    NEXT_PUBLIC_GROWTH_QUARTERLY_PRICE_ID: 'price_test_premium_quarterly',
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
  if (isAuthenticated) {
    billing.getSubscriptionStatusAction.mockResolvedValue([
      undefined,
      { tokenBalance: 0, subscriptionStatus },
    ]);
  } else {
    billing.getSubscriptionStatusAction.mockResolvedValue([
      { type: 'Unauthorized', message: 'Not authenticated' },
    ]);
  }
  return render(<PricingInteractive />);
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  document.cookie = `${ADS_CONSENT_KEY}=; max-age=0; path=/`;
  document.cookie = `${COOKIE_CONSENT_KEY}=; max-age=0; path=/`;
  delete window.ttq;
  delete window.fbq;
  billing.createCheckout.mockResolvedValue([undefined]);
  billing.getCustomerPortalUrl.mockResolvedValue([undefined]);
  billing.getSubscriptionStatusAction.mockResolvedValue([
    { type: 'Unauthorized', message: 'Not authenticated' },
  ]);
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
    // Niezalogowany widzi domyślny trial – kwalifikację sprawdza API po zalogowaniu
    for (const name of ['Testuj 14 dni za darmo', 'Dokup 500 tokenów']) {
      expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(
        '/sign-in?callbackUrl=%2Fpricing'
      );
    }
    expect(billing.createCheckout).not.toHaveBeenCalled();
  });

  it('links an authenticated Free user to the dashboard without initiating checkout', async () => {
    renderPricing({ isAuthenticated: true });

    const link = await screen.findByRole('link', { name: 'Przejdź do pulpitu' });
    expect(link.getAttribute('href')).toBe('/dashboard');
    expect(billing.createCheckout).not.toHaveBeenCalled();
  });

  it.each([
    ['Wybierz Premium', 'subscription', 'price_test_premium_monthly'],
    ['Dokup 500 tokenów', 'tokens', 'price_test_500_tokens'],
  ])('routes %s to the correct checkout mode and configured price', async (cta, type, priceId) => {
    renderPricing({ isAuthenticated: true });

    const button = await screen.findByRole('button', { name: cta });
    fireEvent.click(button);

    await waitFor(() => expect(billing.createCheckout).toHaveBeenCalledTimes(1));
    expect(billing.createCheckout).toHaveBeenCalledWith(type, { priceId });
    expect(billing.getCustomerPortalUrl).not.toHaveBeenCalled();
  });

  it.each(['Active', 'Trialing'] as const)(
    'offers subscription management for %s instead of a second subscription',
    async (subscriptionStatus) => {
      renderPricing({ isAuthenticated: true, subscriptionStatus });

      const button = await screen.findByRole('button', { name: 'Zarządzaj subskrypcją' });
      expect(screen.queryByRole('button', { name: 'Wybierz Premium' })).toBeNull();
      fireEvent.click(button);

      await waitFor(() => expect(billing.getCustomerPortalUrl).toHaveBeenCalledTimes(1));
      expect(billing.createCheckout).not.toHaveBeenCalled();
      expect(billing.cancelSubscriptionCommand).not.toHaveBeenCalled();
    }
  );

  it('still allows a token purchase for a subscriber', async () => {
    renderPricing({ isAuthenticated: true, subscriptionStatus: 'Active' });

    const button = await screen.findByRole('button', { name: 'Dokup 500 tokenów' });
    fireEvent.click(button);

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

    const premiumButton = await screen.findByRole('button', { name: 'Wybierz Premium' });
    const tokensButton = await screen.findByRole('button', { name: 'Dokup 500 tokenów' });
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

    const button = await screen.findByRole('button', { name: 'Dokup 500 tokenów' });
    fireEvent.click(button);

    await waitFor(() =>
      expect(billing.toastError).toHaveBeenCalledWith('Błąd podczas inicjowania płatności')
    );
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    expect(billing.createCheckout).toHaveBeenCalledTimes(1);
  });

  it('keeps the payment timing accessible from the Premium action', async () => {
    renderPricing({ isAuthenticated: true });

    const button = await screen.findByRole('button', { name: 'Wybierz Premium' });
    const description = document.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toBe('Pierwsza płatność dziś, kolejna za miesiąc.');
  });

  it('offers an eligible user a trial with the price and auto-renewal stated next to the action', async () => {
    billing.getSubscriptionStatusAction.mockResolvedValue([
      undefined,
      { tokenBalance: 0, subscriptionStatus: 'None', trialDays: 14, consentDiscount: null },
    ]);
    render(<PricingInteractive />);

    const button = await screen.findByRole('button', { name: 'Testuj 14 dni za darmo' });
    const description = document.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toBe(
      '0 zł przez 14 dni, potem 29 zł/miesiąc, odnawiane automatycznie.'
    );
    expect(description?.querySelector('strong')?.textContent).toBe(
      'potem 29 zł/miesiąc, odnawiane automatycznie.'
    );

    fireEvent.click(button);
    await waitFor(() =>
      expect(billing.createCheckout).toHaveBeenCalledWith('subscription', {
        priceId: 'price_test_premium_monthly',
      })
    );
  });

  it('shows the consent discount price on the token package only', async () => {
    billing.getSubscriptionStatusAction.mockResolvedValue([
      undefined,
      {
        tokenBalance: 0,
        subscriptionStatus: 'None',
        trialDays: null,
        consentDiscount: { percentOff: 25, expiresAt: '2026-10-29T12:00:00Z' },
      },
    ]);
    render(<PricingInteractive />);

    const tokens = within(await screen.findByRole('article', { name: 'Pakiet 500 tokenów' }));
    await waitFor(() => expect(tokens.getByText('-25%')).toBeTruthy());
    expect(tokens.getByText(/^14,25/)).toBeTruthy();
    expect(tokens.getByText('19 zł', { exact: false, selector: 's' })).toBeTruthy();
    expect(tokens.getByText(/Rabat -25% za zgodę marketingową/)).toBeTruthy();

    const premium = within(screen.getByRole('article', { name: 'Premium' }));
    expect(premium.getByText(/^29/)).toBeTruthy();
    expect(premium.getByRole('button', { name: 'Wybierz Premium' })).toBeTruthy();
  });

  it('counts a return from a trial checkout as a trial start, not a purchase', async () => {
    grantAdsConsent();
    const track = vi.fn();
    window.ttq = { grantConsent: vi.fn(), revokeConsent: vi.fn(), track };
    billing.getSubscriptionStatusAction.mockResolvedValue([
      undefined,
      { tokenBalance: 0, subscriptionStatus: 'None', trialDays: 14, consentDiscount: null },
    ]);
    render(<PricingInteractive />);

    fireEvent.click(await screen.findByRole('button', { name: 'Testuj 14 dni za darmo' }));
    await waitFor(() => expect(billing.createCheckout).toHaveBeenCalledTimes(1));
    trackCheckoutCompleted();

    const trialParams = {
      contents: [
        {
          content_id: 'price_test_premium_monthly',
          content_type: 'product',
          content_name: 'Premium',
        },
      ],
      value: 0,
      currency: 'PLN',
    };
    const eventId = { event_id: expect.any(String) };
    expect(track).toHaveBeenCalledWith('InitiateCheckout', trialParams, eventId);
    expect(track).toHaveBeenCalledWith('StartTrial', trialParams, eventId);
    expect(track).not.toHaveBeenCalledWith('Purchase', expect.anything(), expect.anything());
  });

  it('counts a token purchase with the amount after the consent discount', async () => {
    grantAdsConsent();
    const track = vi.fn();
    window.ttq = { grantConsent: vi.fn(), revokeConsent: vi.fn(), track };
    billing.getSubscriptionStatusAction.mockResolvedValue([
      undefined,
      {
        tokenBalance: 0,
        subscriptionStatus: 'None',
        trialDays: null,
        consentDiscount: { percentOff: 25, expiresAt: '2026-10-29T12:00:00Z' },
      },
    ]);
    window.fbq = vi.fn();
    render(<PricingInteractive />);

    fireEvent.click(await screen.findByRole('button', { name: 'Dokup 500 tokenów' }));
    await waitFor(() => expect(billing.createCheckout).toHaveBeenCalledTimes(1));
    trackCheckoutCompleted();

    expect(track).toHaveBeenCalledWith(
      'Purchase',
      {
        contents: [
          {
            content_id: 'price_test_500_tokens',
            content_type: 'product',
            content_name: 'Pakiet 500 tokenów',
          },
        ],
        value: 14.25,
        currency: 'PLN',
      },
      { event_id: expect.any(String) }
    );
    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      {
        content_ids: ['price_test_500_tokens'],
        content_type: 'product',
        content_name: 'Pakiet 500 tokenów',
        value: 14.25,
        currency: 'PLN',
      },
      { eventID: expect.any(String) }
    );
  });

  it('detects an active subscriber on a static page without an AuthProvider and shows subscription management', async () => {
    billing.getSubscriptionStatusAction.mockResolvedValue([
      undefined,
      { tokenBalance: 100, subscriptionStatus: 'Active' },
    ]);

    render(<PricingInteractive />);

    const button = await screen.findByRole('button', { name: 'Zarządzaj subskrypcją' });
    expect(button).toBeTruthy();

    fireEvent.click(button);
    await waitFor(() => expect(billing.getCustomerPortalUrl).toHaveBeenCalledTimes(1));
  });

  it('detects a logged-in user without a subscription on a static page and initiates checkout', async () => {
    billing.getSubscriptionStatusAction.mockResolvedValue([
      undefined,
      { tokenBalance: 50, subscriptionStatus: 'None' },
    ]);

    render(<PricingInteractive />);

    const button = await screen.findByRole('button', { name: 'Wybierz Premium' });
    expect(button).toBeTruthy();

    fireEvent.click(button);
    await waitFor(() =>
      expect(billing.createCheckout).toHaveBeenCalledWith('subscription', {
        priceId: 'price_test_premium_monthly',
      })
    );
  });

  it('switches Premium to the quarterly plan with its own price and checkout', async () => {
    renderPricing({ isAuthenticated: true });

    const premium = within(await screen.findByRole('article', { name: 'Premium' }));
    const monthly = premium.getByRole('radio', { name: 'Miesięcznie' });
    expect(monthly.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(premium.getByRole('radio', { name: /Kwartalnie/ }));

    expect(premium.getByText(/^69/)).toBeTruthy();
    expect(premium.getByText('/ 3 miesiące')).toBeTruthy();
    const button = premium.getByRole('button', { name: 'Wybierz Premium' });
    const description = document.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toBe('Pierwsza płatność dziś, kolejna za 3 miesiące.');

    fireEvent.click(button);
    await waitFor(() =>
      expect(billing.createCheckout).toHaveBeenCalledWith('subscription', {
        priceId: 'price_test_premium_quarterly',
      })
    );
  });

  it('states the quarterly price after the trial', async () => {
    billing.getSubscriptionStatusAction.mockResolvedValue([
      undefined,
      { tokenBalance: 0, subscriptionStatus: 'None', trialDays: 14, consentDiscount: null },
    ]);
    render(<PricingInteractive />);

    const premium = within(await screen.findByRole('article', { name: 'Premium' }));
    fireEvent.click(premium.getByRole('radio', { name: /Kwartalnie/ }));

    const button = await premium.findByRole('button', { name: 'Testuj 14 dni za darmo' });
    const description = document.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toBe(
      '0 zł przez 14 dni, potem 69 zł/3 miesiące, odnawiane automatycznie.'
    );
  });
});
