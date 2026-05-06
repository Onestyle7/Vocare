import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import { getTokenSubscriptionStatus } from '@/features/billing/dal/queries';

export default async function DashboardLayoutPage({ children }: { children: React.ReactNode }) {
  const [tokenBalanceError, tokenBalanceData] = await getTokenSubscriptionStatus();

  if (tokenBalanceError) {
    switch (tokenBalanceError.type) {
      case 'Unauthorized': {
        await forceLoginRedirect();
      }
      default: {
        throw new Error(tokenBalanceError.message);
      }
    }
  }
  return (
    <main>
      <TokenBalanceProvider
        tokenBalance={tokenBalanceData.tokenBalance}
        subscriptionStatus={tokenBalanceData.subscriptionStatus}
      >
        {children}
      </TokenBalanceProvider>
    </main>
  );
}
