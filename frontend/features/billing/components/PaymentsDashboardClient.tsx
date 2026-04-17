'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { useBillingActions } from '@/features/billing/hooks/useBillingActions';

import { PaymentHistoryItem } from '../dal/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const MARKETING_CONSENT_ENDPOINT = '/api/Marketing/consent';

export interface PaymentsDashboardClientProps {
  initialPayments: PaymentHistoryItem[];
}

export default function PaymentsDashboardClient({ initialPayments }: PaymentsDashboardClientProps) {
  const { hasActiveSubscription } = useTokenBalanceContext();
  const { handleCancelSubscription, isPending: isCancelling } = useBillingActions();

  const [marketingConsent, setMarketingConsent] = React.useState<boolean | null>(null);
  const [isConsentLoading, setIsConsentLoading] = React.useState(true);
  const [isUpdatingConsent, setIsUpdatingConsent] = React.useState(false);
  const [consentError, setConsentError] = React.useState<string | null>(null);

  const fetchMarketingConsent = React.useCallback(async (options?: { signal?: AbortSignal }) => {
    const { signal } = options ?? {};
    setIsConsentLoading(true);
    setConsentError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
      const response = await fetch(new URL(MARKETING_CONSENT_ENDPOINT, API_BASE_URL).toString(), {
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

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
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    fetchMarketingConsent({ signal: controller.signal }).catch((err) => {
      if ((err as DOMException).name === 'AbortError') return;
      console.error('Failed to load marketing consent', err);
    });

    return () => controller.abort();
  }, [fetchMarketingConsent]);

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
        const response = await fetch(new URL(MARKETING_CONSENT_ENDPOINT, API_BASE_URL).toString(), {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            nextValue
              ? 'Failed to grant marketing consent.'
              : 'Failed to withdraw marketing consent.'
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
        const message = err instanceof Error ? err.message : 'Error updating marketing preferences';
        setConsentError(message);
        toast.error(message);
      } finally {
        setIsUpdatingConsent(false);
      }
    },
    [isConsentLoading, isUpdatingConsent, marketingConsent]
  );

  const consentChecked = marketingConsent === true;

  const subscriptionStatusLabel = hasActiveSubscription
    ? 'Aktywna subskrypcja'
    : 'Brak aktywnej subskrypcji';
  const subscriptionBadgeVariant = hasActiveSubscription ? 'default' : 'outline';
  const subscriptionBadgeText = hasActiveSubscription ? 'Aktywna' : 'Nieaktywna';

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    []
  );

  const formatPaymentAmount = React.useCallback((amount: number, currency?: string) => {
    if (!Number.isFinite(amount)) return '—';
    const normalizedCurrency = (currency ?? 'USD').toUpperCase();
    const value = amount / 100;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: normalizedCurrency,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${normalizedCurrency}`;
    }
  }, []);

  const getStatusBadgeVariant = React.useCallback((status?: string) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'succeeded' || normalized === 'paid') return 'secondary';
    if (normalized === 'pending' || normalized === 'processing' || normalized === 'open')
      return 'outline';
    if (normalized === 'failed' || normalized === 'canceled') return 'destructive';
    return 'default';
  }, []);

  const formatTypeLabel = React.useCallback((type?: string) => {
    const normalized = type?.toLowerCase();
    if (normalized === 'subscription') return 'Subscription payment';
    if (normalized === 'token_purchase') return 'Token purchase';
    return type ?? 'Payment';
  }, []);

  const payments = React.useMemo(() => {
    if (!initialPayments) return [];
    return initialPayments
      .map((item) => ({
        type: item.type,
        amount: Number(item.amount),
        currency: item.currency,
        status: item.status,
        createdAt: new Date(item.createdAt),
        description: item.description,
        tokenAmount: item.tokenAmount,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialPayments]);

  return (
    <main className="font-korbin bg-background min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight">Płatności</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Zarządzaj subskrypcją, preferencjami marketingowymi i przeglądaj swoją ostatnią
              aktywność.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Wróć do strony głównej
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="flex flex-col gap-6">
            <Card className="border-border/60 bg-card/80 border shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Subskrypcja</CardTitle>
                <CardDescription>
                  Twój aktualny plan dostępu i szybki link do zarządzania płatnościami.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-border/60 bg-background/70 flex flex-col gap-4 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Status
                    </span>
                    <p className="text-foreground text-lg font-semibold">
                      {subscriptionStatusLabel}
                    </p>
                    {!hasActiveSubscription && (
                      <span className="text-muted-foreground text-xs">
                        Wykup plan, aby odblokować pełen dostęp.
                      </span>
                    )}
                  </div>
                  <Badge variant={subscriptionBadgeVariant}>{subscriptionBadgeText}</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="destructive"
                  disabled={!hasActiveSubscription || isCancelling}
                  onClick={handleCancelSubscription}
                  className="w-full sm:w-auto"
                >
                  {isCancelling ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Anulowanie...
                    </span>
                  ) : (
                    'Anuluj subskrypcję'
                  )}
                </Button>
                {!hasActiveSubscription && (
                  <span className="text-muted-foreground text-xs">
                    Anulowanie jest dostępne tylko dla aktywnych subskrypcji.
                  </span>
                )}
              </CardFooter>
            </Card>

            <Card className="border-border/60 bg-card/80 border shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Preferencje marketingowe</CardTitle>
                <CardDescription>
                  Wybierz, czy chcesz otrzymywać aktualizacje produktów Vocare i starannie dobrane
                  porady dotyczące kariery.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-border/60 bg-background/70 flex flex-col gap-3 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <label
                      htmlFor="marketing-consent-toggle"
                      className="text-foreground text-sm font-medium"
                    >
                      Otrzymuj aktualizacje marketingowe
                    </label>
                    <p className="text-muted-foreground text-xs">
                      {isConsentLoading
                        ? 'Sprawdzanie preferencji…'
                        : consentChecked
                          ? 'Będziesz otrzymywać okazjonalne informacje o produktach Vocare.'
                          : 'Bądź na bieżąco z nowymi funkcjami i poradami dotyczącymi kariery.'}
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
                  <span className="text-muted-foreground text-xs">
                    {isUpdatingConsent ? 'Saving your preference…' : 'Loading preference…'}
                  </span>
                )}
                {consentError && (
                  <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-xs">
                    {consentError}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 bg-card/80 border shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Historia transakcji</CardTitle>
              <CardDescription>
                Śledź zakupy i wykorzystanie tokenów powiązanych z Twoim kontem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {payments.length === 0 ? (
                <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
                  <span className="text-foreground text-sm font-medium">Brak płatności</span>
                  <span className="text-muted-foreground text-xs">
                    Opłaty za tokeny i subskrypcje pojawią się tutaj, gdy będą dostępne.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const formattedDate = (() => {
                      const parsedDate = new Date(payment.createdAt);
                      if (Number.isNaN(parsedDate.getTime())) {
                        return '—';
                      }
                      return dateFormatter.format(parsedDate);
                    })();

                    const key = `${payment.createdAt}-${payment.type}-${payment.amount}-${payment.status}`;

                    return (
                      <div
                        key={key}
                        className="border-border/60 bg-background/70 flex flex-col gap-3 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-foreground text-sm font-medium">
                            {payment.description ?? formatTypeLabel(payment.type)}
                          </p>
                          <span className="text-muted-foreground text-xs">{formattedDate}</span>
                          {typeof payment.tokenAmount === 'number' && (
                            <span className="text-muted-foreground text-xs">
                              {payment.tokenAmount} tokens
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status ?? 'Unknown'}
                          </Badge>
                          <span className="text-foreground text-sm font-semibold">
                            {formatPaymentAmount(payment.amount, payment.currency)}
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
}
