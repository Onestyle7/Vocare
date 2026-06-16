'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { TokenCounter } from '@/features/billing/components/TokenCounter';

import { SIDEBAR_DATA } from '../../sidebar/components/dashboard-sidebar';

export default function DashboardHeader({ fullName, email }: { fullName: string; email: string }) {
  const currPath = usePathname();
  const allLinks = [...SIDEBAR_DATA.nav, ...SIDEBAR_DATA.info];
  const pageName = allLinks.find((link) => link.to === currPath)?.name;

  return (
    <header className="font-poppins text-dashboard-foreground bg-dashboard sticky top-0 z-50 flex h-(--header-h-sm) w-full items-center justify-between border-b-2 px-3 text-sm lg:h-(--header-h-lg) lg:px-6 lg:text-xl">
      <div className="flex items-center justify-start gap-2">
        <SidebarTrigger className="flex size-8 lg:hidden" />
        {pageName && <p className="max-sm:hidden">{pageName}</p>}
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="group text-dashboard-primary-foreground text-right"
        >
          <h3 className="group-hover:text-dashboard-primary transition-all duration-200 group-hover:scale-105">
            {fullName}
          </h3>
          <p className="text-dashboard-secondary-foreground lg:text-sm">{email}</p>
        </Link>
        <TokenCounter size="small" showAnimation={false} />
      </div>
    </header>
  );
}
