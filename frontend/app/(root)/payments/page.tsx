'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const DASHBOARD_ENDPOINT = '/api/Billing/subscription-dashboard';
const SUBSCRIPTION_STATUS_ENDPOINT = '/api/Billing/subscription-status';
const CANCEL_SUBSCRIPTION_ENDPOINT = '/api/Billing/cancel-subscription';

type SubscriptionStatusKey = 'active' | 'trialing' | 'canceled' | 'past_due' | 'expired';

type HistoryEntryType = 'subscription' | 'token_purchase' | 'token_usage' | 'other';

type HistoryStatus = 'completed' | 'canceled' | 'pending' | 'failed' | 'unknown';

interface SubscriptionSummary {
  subscriptionId?: string | null;
  status: string;
  level: string;
  planName?: string | null;
  currentPeriodEnd?: string | null;
  autoRenew?: boolean | null;
  price?: number | null;
  currency?: string | null;
  billingCycle?: string | null;
  tokenBalance: number;
  lastUpdated?: string | null;
}

interface PaymentHistoryEntry {
  id: string;
  type: HistoryEntryType;
  title: string;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  tokenAmount: number;
  occurredAt: string;
  status: string;
}

interface SubscriptionDashboardResponse {
  subscription?: SubscriptionSummary | null;
  history?: PaymentHistoryEntry[] | null;
}

interface SubscriptionStatusResponse {
  subscriptionStatus?: string | null;
  subscriptionLevel?: string | null;
  subscriptionEndDate?: string | null;
  subscriptionId?: string | null;
}

const statusConfig: Record<SubscriptionStatusKey, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; badgeClassName?: string }> = {
  active: { label: 'Active', variant: 'default' },
  trialing: { label: 'Trialing', variant: 'secondary' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  past_due: { label: 'Past due', variant: 'destructive', badgeClassName: 'bg-destructive/10 text-destructive border-destructive/40' },
  expired: { label: 'Expired', variant: 'outline', badgeClassName: 'text-destructive border-destructive/60' },
};

const historyStatusVariant: Record<HistoryStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'secondary',
  canceled: 'destructive',
  pending: 'outline',
  failed: 'destructive',
  unknown: 'outline',
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const currencyFormatter = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

const SubscriptionSummarySkeleton = () => (
  <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
    <Separator className="my-4" />
    <div className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
    <Skeleton className="mt-6 h-10 w-56" />
  </>
);

const HistorySkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={`history-skeleton-${index}`} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-40" />
        <Separator />
      </div>
    ))}
  </div>
);

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

const normalizeHistoryStatus = (value?: string | null): HistoryStatus => {
  if (!value) return 'unknown';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'completed' || normalized === 'success') return 'completed';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'canceled';
  if (normalized === 'pending' || normalized === 'processing') return 'pending';
  if (normalized === 'failed' || normalized === 'error') return 'failed';
  return 'unknown';
};

const formatDate = (value?: string | null) => {
  return value ? dateFormatter.format(new Date(value)) : 'Not available';
};

const formatDateTime = (value?: string | null) => {
  return value ? dateTimeFormatter.format(new Date(value)) : 'Unknown date';
};

const PaymentsPage: React.FC = () => {
  const [summary, setSummary] = React.useState<SubscriptionSummary | null>(null);
  const [history, setHistory] = React.useState<PaymentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusInfo, setStatusInfo] = React.useState<SubscriptionStatusResponse | null>(null);

  const loadDashboard = React.useCallback(
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

        const dashboardResponse = await fetch(new URL(DASHBOARD_ENDPOINT, API_BASE_URL).toString(), {
          signal,
          headers,
        });

        if (!dashboardResponse.ok) {
          throw new Error(`Dashboard fetch failed: ${dashboardResponse.status}`);
        }

        const payload = (await dashboardResponse.json()) as SubscriptionDashboardResponse;
        let nextSummary = payload.subscription ? { ...payload.subscription } : null;
        setHistory(Array.isArray(payload.history) ? payload.history : []);

        try {
          const statusResponse = await fetch(new URL(SUBSCRIPTION_STATUS_ENDPOINT, API_BASE_URL).toString(), {
            signal,
            headers,
          });

          if (statusResponse.ok) {
            const statusPayload = (await statusResponse.json()) as SubscriptionStatusResponse;
            if (!signal?.aborted) {
              setStatusInfo(statusPayload);
              if (nextSummary) {
                nextSummary = {
                  ...nextSummary,
                  status: statusPayload.subscriptionStatus ?? nextSummary.status,
                  level: statusPayload.subscriptionLevel ?? nextSummary.level,
                  currentPeriodEnd: statusPayload.subscriptionEndDate ?? nextSummary.currentPeriodEnd,
                  subscriptionId: statusPayload.subscriptionId ?? nextSummary.subscriptionId,
                };
              }
            }
          } else if (statusResponse.status === 404) {
            if (!signal?.aborted) {
              setStatusInfo(null);
            }
          } else {
            const message = await statusResponse.text();
            throw new Error(message || `Status fetch failed: ${statusResponse.status}`);
          }
        } catch (statusError) {
          if ((statusError as DOMException).name === 'AbortError') return;
          console.error('Failed to load subscription status', statusError);
          if (!signal?.aborted) {
            setStatusInfo(null);
          }
        }

        if (!signal?.aborted) {
          setSummary(nextSummary);
        }
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        console.error('Failed to load subscription dashboard', err);
        setError('Unable to load subscription details.');
        setSummary(null);
        setHistory([]);
        setStatusInfo(null);
      } finally {
        if (!options?.signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    const controller = new AbortController();
    loadDashboard({ signal: controller.signal }).catch((err) => {
      if ((err as DOMException).name === 'AbortError') return;
      console.error('Failed to load subscription dashboard', err);
    });

    return () => controller.abort();
  }, [loadDashboard]);

  const statusKey = React.useMemo<SubscriptionStatusKey | null>(
    () => normalizeStatusKey(statusInfo?.subscriptionStatus ?? summary?.status),
    [statusInfo?.subscriptionStatus, summary?.status]
  );

  const canCancel = React.useMemo(() => {
    if (!statusKey) return false;
    return statusKey === 'active' || statusKey === 'trialing';
  }, [statusKey]);

  const nextRenewalDate = React.useMemo(
    () => statusInfo?.subscriptionEndDate ?? summary?.currentPeriodEnd ?? null,
    [statusInfo?.subscriptionEndDate, summary?.currentPeriodEnd]
  );

  const handleCancelSubscription = React.useCallback(async () => {
    if (!canCancel) return;
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
        throw new Error(message || 'Cancel request failed');
      }

      await loadDashboard();
    } catch (err) {
      console.error('Cancel subscription failed', err);
      setError("We couldn't cancel the subscription. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }, [canCancel, loadDashboard]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 font-korbin lg:px-0">
      <section className="space-y-2">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2.5 py-1 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Subscription</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your Vocare subscription and review both token purchases and subscription activity.
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border border-border/60 bg-background/60 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            See the current status, plan details, renewal information, and token balance for your account.
          </CardDescription>
          <CardAction>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : statusKey ? (
              <Badge
                variant={statusConfig[statusKey].variant}
                className={statusConfig[statusKey].badgeClassName}
              >
                {statusConfig[statusKey].label}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                No subscription
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <SubscriptionSummarySkeleton />
          ) : !summary ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
              You do not have an active subscription yet. Once a plan is activated, the details will appear here.
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="mt-1 text-base font-medium">{summary.planName ?? 'Vocare subscription'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing cycle</p>
                  <p className="mt-1 text-base font-medium">{summary.billingCycle ?? 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="mt-1 text-base font-medium">
                    {summary.price != null && summary.currency
                      ? currencyFormatter(summary.price, summary.currency)
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next renewal</p>
                  <p className="mt-1 text-base font-medium">
                    {nextRenewalDate ? formatDate(nextRenewalDate) : 'No renewal scheduled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-renewal</p>
                  <p className="mt-1 text-base font-medium">
                    {summary.autoRenew === true
                      ? 'Enabled'
                      : summary.autoRenew === false
                        ? 'Disabled'
                        : 'Not available'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Token balance</p>
                  <p className="mt-1 text-base font-medium">{summary.tokenBalance}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last update</p>
                  <p className="mt-1 text-base font-medium">{formatDate(summary.lastUpdated)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button
            variant="destructive"
            disabled={!canCancel || isCancelling}
            onClick={handleCancelSubscription}
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
          <p className="text-sm text-muted-foreground">
            {canCancel
              ? 'Once confirmed, the subscription will be stopped immediately on the server side.'
              : 'Cancel will be available once you activate a subscription plan.'}
          </p>
        </CardFooter>
      </Card>

      <Card className="border border-border/60 bg-background/60 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>
            Token top-ups, subscription events, and other billing changes in one timeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <HistorySkeleton />
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No billing activity recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => {
                const normalizedStatus = normalizeHistoryStatus(entry.status);
                const badgeVariant = historyStatusVariant[normalizedStatus] ?? 'outline';
                const currencyLabel = entry.amount != null && entry.currency
                  ? currencyFormatter(entry.amount, entry.currency)
                  : null;
                const tokenLabel = entry.tokenAmount !== 0
                  ? `${entry.tokenAmount > 0 ? '+' : ''}${entry.tokenAmount} tokens`
                  : null;

                return (
                  <React.Fragment key={entry.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{entry.title}</p>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground">{entry.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.occurredAt)}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-sm sm:items-end">
                        {currencyLabel && <span className="font-semibold text-foreground">{currencyLabel}</span>}
                        {tokenLabel && <span className="text-muted-foreground">{tokenLabel}</span>}
                        <Badge variant={badgeVariant}>{entry.status}</Badge>
                      </div>
                    </div>
                    {index < history.length - 1 && <Separator />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default PaymentsPage;
