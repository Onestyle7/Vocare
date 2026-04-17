import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import PaymentsDashboardClient from '@/features/billing/components/PaymentsDashboardClient';
import { getPaymentHistoryQuery } from '@/features/billing/dal/queries';

export default async function PaymentsPage() {
  const [error, paymentsData] = await getPaymentHistoryQuery(50);

  if (error) {
    if (error.type === 'Unauthorized') {
      await forceLoginRedirect();
    }
    // Pozostałe błędy zostaną przechwycone przez najbliższe error.tsx
    throw new Error(error.message);
  }

  return <PaymentsDashboardClient initialPayments={paymentsData.payments} />;
}
