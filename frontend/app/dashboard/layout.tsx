import { SidebarProvider } from '@/components/ui/sidebar';
import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import { getTokenSubscriptionStatus } from '@/features/billing/dal/queries';
import DashboardHeader from '@/features/dashboard/header/components/dashboard-header';
import DashboardSidebar from '@/features/dashboard/sidebar/components/dashboard-sidebar';
import { getPendingLegalDocuments } from '@/features/legal/dal/queries';
import { ProfileProvider } from '@/features/profile/components/ProfileProvider';
import { getUserProfileQuery } from '@/features/profile/dal/queries';

export default async function DashboardLayoutPage({ children }: { children: React.ReactNode }) {
  const [pendingLegalErr, pendingLegalData] = await getPendingLegalDocuments();

  if (pendingLegalErr) {
    if (pendingLegalErr.type === 'Unauthorized') {
      await forceLoginRedirect(pendingLegalErr.message);
    }

    throw new Error(pendingLegalErr.message);
  }

  if (pendingLegalData.length > 0) {
    return <main className="bg-background h-screen w-screen overflow-hidden" />;
  }

  const [tokenBalanceError, tokenBalanceData] = await getTokenSubscriptionStatus();
  const [userProfileError, userProfileData] = await getUserProfileQuery();

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

  if (userProfileError) {
    switch (userProfileError.type) {
      case 'Unauthorized': {
        await forceLoginRedirect();
      }
      default: {
        throw new Error(userProfileError.message);
      }
    }
  }
  return (
    <main className="h-screen w-screen overflow-x-hidden overflow-y-auto">
      <ProfileProvider profile={userProfileData}>
        <TokenBalanceProvider
          tokenBalance={tokenBalanceData.tokenBalance}
          subscriptionStatus={tokenBalanceData.subscriptionStatus}
        >
          <SidebarProvider>
            <DashboardSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <DashboardHeader userProfileData={userProfileData} />
              <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
            </div>
          </SidebarProvider>
        </TokenBalanceProvider>
      </ProfileProvider>
    </main>
  );
}
