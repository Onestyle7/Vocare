'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const DASHBOARD_ENDPOINT = '/api/Billing/subscription-dashboard';
const SUBSCRIPTION_STATUS_ENDPOINT = '/api/Billing/subscription-status';
const CANCEL_SUBSCRIPTION_ENDPOINT = '/api/Billing/cancel-subscription';

type SubscriptionStatusKey = 'active' | 'trialing' | 'canceled' | 'past_due' | 'expired';

interface SubscriptionSummary {
  status: string;
}

interface SubscriptionDashboardResponse {
  subscription?: SubscriptionSummary | null;
}

interface SubscriptionStatusResponse {
  subscriptionStatus?: string | null;
}

const normalizeStatusKey = (value?: string | null): SubscriptionStatusKey | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'active') return 'active';
  if (normalized === 'trialing') return 'trialing';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'canceled';
  if (normalized === 'pastdue' || normalized === 'past_due') return 'past_due';
  if (normalized === 'expired' || normalized === 'incomplete_expired') return 'expired';
  return null;
};

const PaymentsPage: React.FC = () => {
  const [hasSubscription, setHasSubscription] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const evaluateStatus = React.useCallback((status?: string | null) => {
    const key = normalizeStatusKey(status);
    return key === 'active' || key === 'trialing';
  }, []);

  const fetchSubscriptionState = React.useCallback(async (options?: { signal?: AbortSignal }) => {
    const { signal } = options ?? {};
    setIsLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const dashboardResponse = await fetch(new URL(DASHBOARD_ENDPOINT, API_BASE_URL).toString(), {
        signal,
        headers,
      });

      let nextHasSubscription = false;

      if (dashboardResponse.ok) {
        const payload = (await dashboardResponse.json()) as SubscriptionDashboardResponse;
        nextHasSubscription = evaluateStatus(payload.subscription?.status);
      } else if (dashboardResponse.status !== 404) {
        const message = await dashboardResponse.text();
        throw new Error(message || `Dashboard fetch failed: ${dashboardResponse.status}`);
      }

      if (!nextHasSubscription) {
        const statusResponse = await fetch(
          new URL(SUBSCRIPTION_STATUS_ENDPOINT, API_BASE_URL).toString(),
          {
            signal,
            headers,
          }
        );

        if (statusResponse.ok) {
          const statusPayload = (await statusResponse.json()) as SubscriptionStatusResponse;
          nextHasSubscription = evaluateStatus(statusPayload.subscriptionStatus);
        } else if (statusResponse.status !== 404) {
          const message = await statusResponse.text();
          throw new Error(message || `Status fetch failed: ${statusResponse.status}`);
        }
      }

      if (!signal?.aborted) {
        setHasSubscription(nextHasSubscription);
      }
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      console.error('Failed to load subscription state', err);
      setError('Unable to determine subscription status.');
      setHasSubscription(false);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [evaluateStatus]);

  React.useEffect(() => {
    const controller = new AbortController();
    fetchSubscriptionState({ signal: controller.signal }).catch((err) => {
      if ((err as DOMException).name === 'AbortError') return;
      console.error('Failed to load subscription state', err);
    });

    return () => controller.abort();
  }, [fetchSubscriptionState]);

  const handleCancelSubscription = React.useCallback(async () => {
    if (!hasSubscription) return;
    setIsCancelling(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
      const response = await fetch(new URL(CANCEL_SUBSCRIPTION_ENDPOINT, API_BASE_URL).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to open billing portal');
      }

      const data = await response.json();
      const portalUrl = data.url || data.Url;

      if (!portalUrl) {
        throw new Error('No portal URL received from server');
      }

      const portalWindow = window.open(portalUrl, '_blank');

      if (!portalWindow) {
        throw new Error('Please allow popups to open the billing portal');
      }

      setTimeout(() => {
        fetchSubscriptionState().catch((refreshError) => {
          console.error('Failed to refresh subscription state', refreshError);
        });
      }, 3000);
    } catch (err) {
      console.error('Cancel subscription failed', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "We couldn't open the billing portal. Please try again.";
      setError(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  }, [fetchSubscriptionState, hasSubscription]);

  return (
    <main className="font-korbin flex min-h-screen w-full items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <Button
          variant="destructive"
          disabled={!hasSubscription || isCancelling || isLoading}
          onClick={handleCancelSubscription}
          className="min-w-64"
        >
          {isCancelling ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cancelling
            </span>
          ) : (
            'Cancel subscription with one click'
          )}
        </Button>
        {isLoading && (
          <span className="text-muted-foreground text-sm">Checking subscription status...</span>
        )}
        {!isLoading && !hasSubscription && (
          <span className="text-muted-foreground text-sm">
            Cancel becomes available once a subscription is active.
          </span>
        )}
        {error && <span className="text-destructive text-sm">{error}</span>}
      </div>
    </main>
  );
};

export default PaymentsPage;