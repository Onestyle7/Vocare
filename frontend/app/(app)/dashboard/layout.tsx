import type { Metadata } from 'next';

import { SidebarProvider } from '@/components/ui/sidebar';
import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import DashboardHeader from '@/features/dashboard/header/components/dashboard-header';
import DashboardSidebar from '@/features/dashboard/sidebar/components/dashboard-sidebar';
import { ProfileProvider } from '@/features/profile/components/ProfileProvider';
import { getUserProfileQuery } from '@/features/profile/dal/queries';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayoutPage({ children }: { children: React.ReactNode }) {
  const [userProfileError, userProfileData] = await getUserProfileQuery();

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
        <SidebarProvider>
          <DashboardSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader userProfileData={userProfileData} />
            <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
          </div>
        </SidebarProvider>
      </ProfileProvider>
    </main>
  );
}
