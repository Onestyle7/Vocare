'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AnalyticsConsentCard } from '@/components/SupportComponents/AnalyticsConsentCard';
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
import { useMarketingActions } from '@/features/marketing/hooks/useMarketingActions';

import {
  formatPaymentAmount,
  getStatusBadgeText,
  getStatusBadgeVariant,
  getTypeLabel,
  PAYMENT_DATE_FORMATTER,
} from '../billingUtils';
import { PaymentHistoryItem } from '../dal/api';

export interface PaymentsDashboardClientProps {
  initialPayments: PaymentHistoryItem[];
  initialMarketingConsent: boolean;
}

export default function PaymentsDashboardClient({
  initialPayments,
  initialMarketingConsent,
}: PaymentsDashboardClientProps) {
  const { hasActiveSubscription } = useTokenBalanceContext();
  const { handleCancelSubscription, isPending: isCancelling } = useBillingActions();
  const { handleMarketingToggle, isPending: isUpdatingConsent } = useMarketingActions();

  const [marketingConsent, setMarketingConsent] = useState<boolean>(initialMarketingConsent);

  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const success = searchParams.get('success');
    if (success?.toLowerCase() === 'true') {
      setTimeout(() => {
        toast.success('Płatność powiodła się');
      }, 300);
      window.history.replaceState(null, '', pathname);
    } else if (success?.toLowerCase() === 'false') {
      setTimeout(() => {
        toast.info('Płatność została anulowana.');
      }, 300);
      window.history.replaceState(null, '', pathname);
    }
  }, [searchParams, pathname]);

  useEffect(() => {
    setMarketingConsent(initialMarketingConsent);
  }, [initialMarketingConsent]);

  const onToggleConsent = (nextValue: boolean) => {
    handleMarketingToggle(nextValue, setMarketingConsent);
  };

  const subscriptionStatusLabel = hasActiveSubscription
    ? 'Aktywna subskrypcja'
    : 'Brak aktywnej subskrypcji';
  const subscriptionBadgeVariant = hasActiveSubscription ? 'default' : 'outline';
  const subscriptionBadgeText = hasActiveSubscription ? 'Aktywna' : 'Nieaktywna';

  const payments = useMemo(() => {
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
    <main className="font-korbin bg-background w-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight">Płatności</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Zarządzaj subskrypcją, preferencjami marketingowymi i przeglądaj swoją ostatnią
              aktywność.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/profile" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Wróć do swojego profilu
            </Link>
          </Button>
        </div>

        <div className="lg:grid-rows grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
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
                      {marketingConsent
                        ? 'Będziesz otrzymywać okazjonalne informacje o produktach Vocare.'
                        : 'Bądź na bieżąco z nowymi funkcjami i poradami dotyczącymi kariery.'}
                    </p>
                  </div>
                  <Switch
                    id="marketing-consent-toggle"
                    checked={marketingConsent}
                    disabled={isUpdatingConsent}
                    onCheckedChange={onToggleConsent}
                    aria-label="Toggle marketing updates"
                  />
                </div>
                {isUpdatingConsent && (
                  <span className="text-muted-foreground text-xs">Zapisywanie preferencji…</span>
                )}
              </CardContent>
              <CardContent className="space-y-4">
                <AnalyticsConsentCard />
              </CardContent>
            </Card>
          </div>

          <div className="relative lg:min-h-0">
            <Card className="border-border/60 bg-card/80 flex h-full flex-col overflow-hidden border shadow-sm backdrop-blur lg:absolute lg:inset-0">
              <CardHeader>
                <CardTitle>Historia transakcji</CardTitle>
                <CardDescription>
                  Śledź zakupy i wykorzystanie tokenów powiązanych z Twoim kontem.
                </CardDescription>
              </CardHeader>
              <CardContent className="show-scrollbar flex-1 space-y-4 overflow-y-auto">
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
                        return PAYMENT_DATE_FORMATTER.format(parsedDate);
                      })();

                      const key = `${payment.createdAt}-${payment.type}-${payment.amount}-${payment.status}`;

                      return (
                        <div
                          key={key}
                          className="border-border/60 bg-background/70 flex flex-col gap-3 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="text-foreground text-sm font-medium">
                              {getTypeLabel(payment.type)}
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
                              {getStatusBadgeText(payment.status)}
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
      </div>
    </main>
  );
}
