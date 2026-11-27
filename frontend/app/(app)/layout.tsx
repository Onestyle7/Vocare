import type { Metadata } from 'next';

import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import { TrialOfferBanner } from '@/features/billing/components/TrialOfferBanner';
import { getTokenSubscriptionStatus } from '@/features/billing/dal/queries';
import { LegalConsentProvider } from '@/features/legal/components/LegalConsentProvider';
import { getPendingLegalDocuments } from '@/features/legal/dal/queries';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [pendingLegalErr, pendingLegalData] = await getPendingLegalDocuments();

  if (pendingLegalErr) {
    if (pendingLegalErr.type === 'Unauthorized') {
      await forceLoginRedirect(pendingLegalErr.message);
    }
    throw new Error(pendingLegalErr.message);
  }

  if (pendingLegalData.length > 0) {
    return (
      <AuthProvider isAuthenticated={true}>
        <LegalConsentProvider initialPendingDocuments={pendingLegalData}>
          <main className="bg-background h-screen w-screen overflow-hidden" />
        </LegalConsentProvider>
      </AuthProvider>
    );
  }

  const [tokenBalanceError, tokenBalanceData] = await getTokenSubscriptionStatus();

  if (tokenBalanceError) {
    if (tokenBalanceError.type === 'Unauthorized') {
      await forceLoginRedirect();
    }
    throw new Error(tokenBalanceError.message);
  }

  return (
    <AuthProvider isAuthenticated={true}>
      <TokenBalanceProvider
        tokenBalance={tokenBalanceData.tokenBalance}
        subscriptionStatus={tokenBalanceData.subscriptionStatus}
      >
        {children}
        <TrialOfferBanner
          trialDays={tokenBalanceData.trialDays}
          subscriptionStatus={tokenBalanceData.subscriptionStatus}
        />
      </TokenBalanceProvider>
    </AuthProvider>
  );
}
