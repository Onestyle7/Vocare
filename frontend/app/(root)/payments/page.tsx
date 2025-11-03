'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const DASHBOARD_ENDPOINT = '/api/Billing/subscription-dashboard';
const SUBSCRIPTION_STATUS_ENDPOINT = '/api/Billing/subscription-status';
const CANCEL_SUBSCRIPTION_ENDPOINT = '/api/Billing/cancel-subscription';
const MARKETING_CONSENT_ENDPOINT = '/api/Marketing/consent';
const TOKEN_TRANSACTIONS_ENDPOINT = '/api/Billing/token-transactions';

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

interface TokenTransaction {
  id?: number | string;
  serviceName: string;
  amount: number;
  type: string;
  createdAt: string;
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
  const [marketingConsent, setMarketingConsent] = React.useState<boolean | null>(null);
  const [isConsentLoading, setIsConsentLoading] = React.useState(true);
  const [isUpdatingConsent, setIsUpdatingConsent] = React.useState(false);
  const [consentError, setConsentError] = React.useState<string | null>(null);
  const [transactions, setTransactions] = React.useState<TokenTransaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = React.useState(true);
  const [transactionsError, setTransactionsError] = React.useState<string | null>(null);

  const evaluateStatus = React.useCallback((status?: string | null) => {
    const key = normalizeStatusKey(status);
    return key === 'active' || key === 'trialing';
  }, []);

  const fetchSubscriptionState = React.useCallback(
    async (options?: { signal?: AbortSignal }) => {
      const { signal } = options ?? {};
      setIsLoading(true);
      setError(null);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const dashboardResponse = await fetch(
          new URL(DASHBOARD_ENDPOINT, API_BASE_URL).toString(),
          {
            signal,
            headers,
          }
        );

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
    },
    [evaluateStatus]
  );

  React.useEffect(() => {
    const controller = new AbortController();
    fetchSubscriptionState({ signal: controller.signal }).catch((err) => {
      if ((err as DOMException).name === 'AbortError') return;
      console.error('Failed to load subscription state', err);
    });

    return () => controller.abort();
  }, [fetchSubscriptionState]);

  const fetchMarketingConsent = React.useCallback(
    async (options?: { signal?: AbortSignal }) => {
      const { signal } = options ?? {};
      setIsConsentLoading(true);
      setConsentError(null);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
        const response = await fetch(
          new URL(MARKETING_CONSENT_ENDPOINT, API_BASE_URL).toString(),
          {
            signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (response.status === 401) {
          setMarketingConsent(false);
          setConsentError('You need to sign in to manage marketing preferences.');
          return;
        }

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Failed to load marketing consent (${response.status}).`);
        }

        const payload = await response.json();
        setMarketingConsent(Boolean(payload?.hasConsent));
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        console.error('Failed to load marketing consent', err);
        setConsentError("We couldn't load your marketing preference. Please try again.");
        setMarketingConsent(false);
      } finally {
        if (!signal?.aborted) {
          setIsConsentLoading(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    const controller = new AbortController();
    fetchMarketingConsent({ signal: controller.signal }).catch((err) => {
      if ((err as DOMException).name === 'AbortError') return;
      console.error('Failed to load marketing consent', err);
    });

    return () => controller.abort();
  }, [fetchMarketingConsent]);

  const fetchTransactions = React.useCallback(
    async (options?: { signal?: AbortSignal }) => {
      const { signal } = options ?? {};
      setIsTransactionsLoading(true);
      setTransactionsError(null);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
        const response = await fetch(
          new URL(TOKEN_TRANSACTIONS_ENDPOINT, API_BASE_URL).toString(),
          {
            signal,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (response.status === 401) {
          setTransactions([]);
          setTransactionsError('You need to sign in to view your transaction history.');
          return;
        }

        if (response.status === 404) {
          setTransactions([]);
          return;
        }

        if (!response.ok) {
          const contentType = response.headers.get('content-type') ?? '';
          let message = '';
          if (contentType.includes('application/json')) {
            try {
              const data = await response.json();
              message = data?.message ?? '';
            } catch {
              message = '';
            }
          } else {
            message = await response.text();
          }
          throw new Error(message || 'Failed to load transaction history.');
        }

        const payload = await response.json();
        const rawList = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.transactions)
            ? payload.transactions
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

        const normalized = rawList
          .map((item) => ({
            id: item.id ?? item.Id ?? item.transactionId ?? undefined,
            serviceName:
              item.serviceName ?? item.ServiceName ?? item.service_name ?? 'Unknown service',
            amount: Number(item.amount ?? item.Amount ?? 0),
            type: item.type ?? item.Type ?? item.transactionType ?? 'Unknown',
            createdAt:
              item.createdAt ??
              item.CreatedAt ??
              item.created_at ??
              item.timestamp ??
              new Date().toISOString(),
          }))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setTransactions(normalized);
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        console.error('Failed to load transaction history', err);
        setTransactionsError('Unable to load transaction history right now.');
        setTransactions([]);
      } finally {
        if (!signal?.aborted) {
          setIsTransactionsLoading(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    const controller = new AbortController();
    fetchTransactions({ signal: controller.signal }).catch((err) => {
      if ((err as DOMException).name === 'AbortError') return;
      console.error('Failed to load transaction history', err);
    });

    return () => controller.abort();
  }, [fetchTransactions]);

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

  const handleMarketingToggle = React.useCallback(
    async (nextValue: boolean) => {
      if (isConsentLoading || isUpdatingConsent) return;
      const previousValue = marketingConsent === true;
      setIsUpdatingConsent(true);
      setConsentError(null);

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
        if (!token) {
          setConsentError('You need to sign in to manage marketing preferences.');
          setMarketingConsent(false);
          return;
        }

        const method = nextValue ? 'POST' : 'DELETE';
        const response = await fetch(
          new URL(MARKETING_CONSENT_ENDPOINT, API_BASE_URL).toString(),
          {
            method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const contentType = response.headers.get('content-type') ?? '';
          let message = '';
          if (contentType.includes('application/json')) {
            try {
              const data = await response.json();
              message = data?.message ?? '';
            } catch {
              message = '';
            }
          } else {
            message = await response.text();
          }
          throw new Error(
            message ||
              (nextValue
                ? 'Failed to grant marketing consent.'
                : 'Failed to withdraw marketing consent.')
          );
        }

        setMarketingConsent(nextValue);
        toast.success(
          nextValue
            ? 'Marketing updates enabled. Thanks for staying in the loop!'
            : 'You will no longer receive marketing emails.'
        );
      } catch (err) {
        console.error('Failed to update marketing consent', err);
        setMarketingConsent(previousValue);
        const message =
          err instanceof Error
            ? err.message
            : nextValue
              ? 'Unable to enable marketing emails.'
              : 'Unable to disable marketing emails.';
        setConsentError(message);
        toast.error(message);
      } finally {
        setIsUpdatingConsent(false);
      }
    },
    [isConsentLoading, isUpdatingConsent, marketingConsent]
  );

  const consentChecked = marketingConsent === true;

  const subscriptionStatusLabel = hasSubscription ? 'Active subscription' : 'No active subscription';
  const subscriptionBadgeVariant = hasSubscription ? 'default' : 'outline';
  const subscriptionBadgeText = hasSubscription ? 'Active' : 'Inactive';

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    []
  );

  const formatAmount = React.useCallback((amount: number, type: string) => {
    if (Number.isNaN(amount)) return '0';
    const prefix = type?.toLowerCase() === 'usage' ? '-' : '+';
    return `${prefix}${Math.abs(amount)}`;
  }, []);

  return (
    <main className="font-korbin min-h-screen w-full bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Payments</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your subscription, marketing preferences, and review your recent activity.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="flex flex-col gap-6">
            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  Your current access plan and quick link to manage billing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-background/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Status
                      </span>
                      <p className="text-lg font-semibold text-foreground">{subscriptionStatusLabel}</p>
                      {!hasSubscription && (
                        <span className="text-xs text-muted-foreground">
                          Purchase a plan to unlock unlimited access.
                        </span>
                      )}
                    </div>
                    <Badge variant={subscriptionBadgeVariant}>{subscriptionBadgeText}</Badge>
                  </div>
                )}
                {error && !isLoading && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="destructive"
                  disabled={!hasSubscription || isCancelling || isLoading}
                  onClick={handleCancelSubscription}
                  className="w-full sm:w-auto"
                >
                  {isCancelling ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cancelling…
                    </span>
                  ) : (
                    'Cancel subscription'
                  )}
                </Button>
                {!isLoading && !hasSubscription && (
                  <span className="text-xs text-muted-foreground">
                    Cancellation becomes available after activating a subscription.
                  </span>
                )}
              </CardFooter>
            </Card>

            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Marketing preferences</CardTitle>
                <CardDescription>
                  Choose if you want to receive Vocare product updates and curated career tips.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <label
                      htmlFor="marketing-consent-toggle"
                      className="text-sm font-medium text-foreground"
                    >
                      Marketing updates
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {isConsentLoading
                        ? 'Checking your preference...'
                        : consentChecked
                          ? 'You will receive occasional product news from Vocare.'
                          : 'Stay informed about new features and career tips.'}
                    </p>
                  </div>
                  <Switch
                    id="marketing-consent-toggle"
                    checked={consentChecked}
                    disabled={isConsentLoading || isUpdatingConsent}
                    onCheckedChange={(checked) => {
                      void handleMarketingToggle(checked);
                    }}
                    aria-label="Toggle marketing updates"
                  />
                </div>
                {(isConsentLoading || isUpdatingConsent) && (
                  <span className="text-xs text-muted-foreground">
                    {isUpdatingConsent ? 'Saving your preference…' : 'Loading preference…'}
                  </span>
                )}
                {consentError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {consentError}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Transaction history</CardTitle>
              <CardDescription>
                Track purchases and usage of tokens associated with your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTransactionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ) : transactionsError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {transactionsError}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
                  <span className="text-sm font-medium text-foreground">No transactions yet</span>
                  <span className="text-xs text-muted-foreground">
                    Purchases and token usage will appear here once available.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction, index) => {
                    const amountClass =
                      transaction.type?.toLowerCase() === 'usage'
                        ? 'text-destructive'
                        : 'text-emerald-500';

                    const formattedDate = (() => {
                      const parsedDate = new Date(transaction.createdAt);
                      if (Number.isNaN(parsedDate.getTime())) {
                        return '—';
                      }
                      return dateFormatter.format(parsedDate);
                    })();

                    const key =
                      transaction.id ?? `${transaction.createdAt}-${transaction.serviceName}-${index}`;

                    return (
                      <div
                        key={key}
                        className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {transaction.serviceName}
                          </p>
                          <span className="text-xs text-muted-foreground">{formattedDate}</span>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <Badge
                            variant={
                              transaction.type?.toLowerCase() === 'usage' ? 'outline' : 'secondary'
                            }
                          >
                            {transaction.type}
                          </Badge>
                          <span className={`text-sm font-semibold ${amountClass}`}>
                            {formatAmount(transaction.amount, transaction.type)} tokens
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default PaymentsPage;
