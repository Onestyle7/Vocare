import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import PaymentsDashboardClient from '@/features/billing/components/PaymentsDashboardClient';
import { getPaymentHistoryQuery } from '@/features/billing/dal/queries';
import { getMarketingConsentQuery } from '@/features/marketing/dal/queries';

export default async function PaymentsPage() {
  const [paymentError, paymentsData] = await getPaymentHistoryQuery(50);
  const [consentError, consentData] = await getMarketingConsentQuery();

  if (paymentError) {
    if (paymentError.type === 'Unauthorized') {
      await forceLoginRedirect();
    }
    // Pozostałe błędy zostaną przechwycone przez najbliższe error.tsx
    throw new Error(paymentError.message);
  }

  if (consentError) {
    if (consentError.type === 'Unauthorized') {
      await forceLoginRedirect();
    }
  }

  const initialMarketingConsent = consentData?.hasConsent ?? false;

  return (
    <PaymentsDashboardClient
      initialPayments={paymentsData.payments}
      initialMarketingConsent={initialMarketingConsent}
    />
  );
}
