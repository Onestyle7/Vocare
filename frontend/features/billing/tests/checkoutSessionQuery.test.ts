// @vitest-environment node

import { ok } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCheckoutSessionSummaryQuery } from '../dal/queries';

const { getCheckoutSessionSummaryService } = vi.hoisted(() => ({
  getCheckoutSessionSummaryService: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('../dal/services', () => ({ getCheckoutSessionSummaryService }));

afterEach(() => {
  vi.clearAllMocks();
});

describe('getCheckoutSessionSummaryQuery', () => {
  it('asks the API about a well-formed Stripe session ID', async () => {
    getCheckoutSessionSummaryService.mockResolvedValue(ok({ sessionId: 'cs_test_a1B2_c3' }));

    const [error, summary] = await getCheckoutSessionSummaryQuery('cs_test_a1B2_c3');

    expect(error).toBeNull();
    expect(summary).toEqual({ sessionId: 'cs_test_a1B2_c3' });
    expect(getCheckoutSessionSummaryService).toHaveBeenCalledWith('cs_test_a1B2_c3');
  });

  it.each(['', 'pi_123', 'cs_../billing', 'cs_test?x=1', `cs_${'a'.repeat(300)}`])(
    'does not call the API for an address param that is no session ID: %s',
    async (sessionId) => {
      const [error] = await getCheckoutSessionSummaryQuery(sessionId);

      expect(error?.type).toBe('CheckoutSessionNotFound');
      expect(getCheckoutSessionSummaryService).not.toHaveBeenCalled();
    }
  );
});
