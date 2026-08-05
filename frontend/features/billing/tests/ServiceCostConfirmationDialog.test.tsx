import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Map } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ServiceCostConfirmationDialog from '@/features/billing/components/ServiceCostConfirmationDialog';
import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import type { SubscriptionStatuses } from '@/features/billing/types';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: () => <span data-testid="ai-magic" />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

type ConfirmHandler = ComponentProps<typeof ServiceCostConfirmationDialog>['onConfirm'];

const renderDialog = ({
  tokenBalance = 100,
  subscriptionStatus = 'None',
  tokenCost = 50,
  onConfirm = vi.fn<ConfirmHandler>().mockResolvedValue('success'),
  onOpenChange = vi.fn(),
  onBack,
}: {
  tokenBalance?: number;
  subscriptionStatus?: SubscriptionStatuses;
  tokenCost?: number;
  onConfirm?: ConfirmHandler;
  onOpenChange?: (open: boolean) => void;
  onBack?: () => void;
} = {}) => {
  render(
    <TokenBalanceProvider tokenBalance={tokenBalance} subscriptionStatus={subscriptionStatus}>
      <ServiceCostConfirmationDialog
        open
        onOpenChange={onOpenChange}
        icon={Map}
        title="Wygenerować roadmapę?"
        tokenCost={tokenCost}
        onConfirm={onConfirm}
        onBack={onBack}
      />
    </TokenBalanceProvider>
  );

  return { onConfirm, onOpenChange };
};

beforeEach(() => {
  navigation.push.mockReset();
  navigation.refresh.mockReset();
});

afterEach(cleanup);

describe('ServiceCostConfirmationDialog', () => {
  it('renders the Tailor CV confirmation layout with the module icon and AI action icon', () => {
    renderDialog();

    const title = screen.getByRole('heading', { name: 'Wygenerować roadmapę?' });
    expect(document.activeElement).toBe(title);
    expect(document.querySelector('.lucide-map')).not.toBeNull();
    expect(screen.getByText('50 tokenów')).toBeTruthy();
    expect(screen.getByTestId('ai-magic')).toBeTruthy();
  });

  it('uses the backend subscription rule instead of treating Trialing as unlimited', () => {
    renderDialog({ tokenBalance: 0, subscriptionStatus: 'Trialing' });

    expect(screen.getByRole('alert').textContent).toContain(
      'Niewystarczające saldo (0/50 tokenów)'
    );
    expect(
      screen.queryByText('Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.')
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();
  });

  it('allows an Active subscription without tokens', async () => {
    const onConfirm = vi.fn<ConfirmHandler>().mockResolvedValue('success');
    const onOpenChange = vi.fn();
    renderDialog({ tokenBalance: 0, subscriptionStatus: 'Active', onConfirm, onOpenChange });

    expect(
      screen.getByText('Masz aktywną subskrypcję, więc ta akcja nie wykorzysta żadnych tokenów.')
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('describes a backend-free service truthfully and allows confirmation at zero balance', async () => {
    const onConfirm = vi.fn<ConfirmHandler>().mockResolvedValue('success');
    renderDialog({ tokenBalance: 0, tokenCost: 0, onConfirm });

    expect(screen.getByText('Ta akcja nie wykorzysta żadnych tokenów.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('stops a nominally free action if the backend reports changed billing conditions', async () => {
    const onConfirm = vi.fn<ConfirmHandler>().mockResolvedValue('insufficient-tokens');
    renderDialog({ tokenBalance: 0, tokenCost: 0, onConfirm });

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Warunki rozliczenia tej usługi')
    );
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Zdobądź tokeny' })).toBeTruthy();
  });

  it('routes to pricing when the local balance is insufficient', () => {
    const { onConfirm, onOpenChange } = renderDialog({ tokenBalance: 49 });

    const upgradeButton = screen.getByRole('button', { name: 'Zdobądź tokeny' });
    expect(document.activeElement).toBe(upgradeButton);
    fireEvent.click(upgradeButton);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigation.push).toHaveBeenCalledWith('/pricing');
  });

  it('handles a stale billing snapshot rejected by the backend', async () => {
    const onConfirm = vi.fn<ConfirmHandler>().mockResolvedValue('insufficient-tokens');
    renderDialog({ tokenBalance: 50, onConfirm });

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Saldo tokenów'));
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
  });

  it('allows only one request while confirmation is pending', async () => {
    let resolveConfirmation: (result: 'success') => void = () => undefined;
    const onConfirm = vi.fn<ConfirmHandler>(
      () =>
        new Promise<'success'>((resolve) => {
          resolveConfirmation = resolve;
        })
    );
    renderDialog({ onConfirm });

    const generateButton = screen.getByRole('button', { name: 'Generuj' });
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole('button', { name: 'Generowanie...' }) as HTMLButtonElement).disabled
    ).toBe(true);
    resolveConfirmation('success');
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('does not offer a blind retry when the result of a paid operation is ambiguous', async () => {
    const onConfirm = vi.fn<ConfirmHandler>().mockResolvedValue('error');
    const onOpenChange = vi.fn();
    renderDialog({ onConfirm, onOpenChange });

    fireEvent.click(screen.getByRole('button', { name: 'Generuj' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('sprawdź, czy nowy wynik nie został już zapisany');
    expect(screen.queryByRole('button', { name: 'Generuj' })).toBeNull();
    expect(navigation.refresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Wróć do modułu' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('returns to the preceding module step without confirming', () => {
    const onBack = vi.fn();
    const { onConfirm } = renderDialog({ onBack });

    fireEvent.click(screen.getByRole('button', { name: 'Wróć' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('restores focus to the button that opened the modal', async () => {
    const FocusHarness = () => {
      const [open, setOpen] = useState(false);

      return (
        <TokenBalanceProvider tokenBalance={100} subscriptionStatus="None">
          <button type="button" onClick={() => setOpen(true)}>
            Otwórz potwierdzenie
          </button>
          <ServiceCostConfirmationDialog
            open={open}
            onOpenChange={setOpen}
            icon={Map}
            title="Wygenerować roadmapę?"
            tokenCost={50}
            onConfirm={() => 'success'}
          />
        </TokenBalanceProvider>
      );
    };

    render(<FocusHarness />);
    const trigger = screen.getByRole('button', { name: 'Otwórz potwierdzenie' });

    trigger.focus();
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Wygenerować roadmapę?' })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Wróć' }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
