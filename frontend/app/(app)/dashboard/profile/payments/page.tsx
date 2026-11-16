import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import PaymentsDashboardClient from '@/features/billing/components/PaymentsDashboardClient';
import {
  getCheckoutSessionSummaryQuery,
  getPaymentHistoryQuery,
  getSubscriptionDetailsQuery,
} from '@/features/billing/dal/queries';
import { getMarketingConsentQuery } from '@/features/marketing/dal/queries';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; session_id?: string }>;
}) {
  const { success, session_id: sessionId } = await searchParams;
  const [paymentError, paymentsData] = await getPaymentHistoryQuery(50);
  const [consentError, consentData] = await getMarketingConsentQuery();
  // Opis triala jest dodatkiem – błąd nie blokuje strony płatności
  const [, subscriptionDetails] = await getSubscriptionDetailsQuery();

  if (paymentError) {
    if (paymentError.type === 'Unauthorized') {
      await forceLoginRedirect();
    }
    throw new Error(paymentError.message);
  }

  if (consentError) {
    if (consentError.type === 'Unauthorized') {
      await forceLoginRedirect();
    }
  }

  const initialMarketingConsent = consentData?.hasConsent ?? false;

  // Stripe adds session_id to the return address; the verified session drives the conversion.
  // Only a measurement aid, so a failed check never blocks the page.
  const [, completedCheckout] =
    success === 'true' && sessionId
      ? await getCheckoutSessionSummaryQuery(sessionId)
      : [null, null];

  return (
    <PaymentsDashboardClient
      initialPayments={paymentsData.payments}
      initialMarketingConsent={initialMarketingConsent}
      trial={subscriptionDetails?.trial ?? null}
      completedCheckout={completedCheckout}
    />
  );
}
