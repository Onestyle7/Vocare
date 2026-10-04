import type { Metadata } from 'next';

import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import { getTokenSubscriptionStatus } from '@/features/billing/dal/queries';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
      </TokenBalanceProvider>
    </AuthProvider>
  );
}
