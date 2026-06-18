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
    <header className="font-poppins text-dashboard-foreground bg-dashboard sticky top-0 z-50 flex h-(--header-h-sm) w-full items-center justify-between gap-4 border-b-2 px-3 text-sm lg:h-(--header-h-lg) lg:px-6 lg:text-xl">
      <div className="flex min-w-0 items-center justify-start gap-2">
        <SidebarTrigger className="flex size-8 min-[1025px]:hidden" />
        {pageName && <p className="truncate max-sm:hidden">{pageName}</p>}
      </div>
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="group text-dashboard-primary-foreground min-w-0 text-right"
        >
          <h3 className="group-hover:text-dashboard-primary truncate transition-all duration-200 group-hover:scale-105">
            {fullName}
          </h3>
          <p className="text-dashboard-secondary-foreground truncate lg:text-sm">{email}</p>
        </Link>
        <TokenCounter size="small" showAnimation={false} className="shrink-0" />
      </div>
    </header>
  );
}
