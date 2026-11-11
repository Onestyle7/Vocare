import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PricingViewTracker } from '@/features/billing/components/PricingViewTracker';

describe('PricingViewTracker', () => {
  afterEach(() => {
    cleanup();
    delete window.ttq;
  });

  it('reports a view of the pricing page', () => {
    const track = vi.fn();
    window.ttq = { grantConsent: vi.fn(), revokeConsent: vi.fn(), track };

    render(<PricingViewTracker />);

    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith('ViewContent', undefined);
  });
});
