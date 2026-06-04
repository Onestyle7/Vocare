'use client';

import { usePathname } from 'next/navigation';

import { SidebarTrigger } from '@/components/ui/sidebar';

import { SIDEBAR_DATA } from '../../sidebar/components/dashboard-sidebar';

export default function DashboardHeader({ fullName }: { fullName: string }) {
  const currPath = usePathname();
  const allLinks = [...SIDEBAR_DATA.nav, ...SIDEBAR_DATA.info];
  const pageName = allLinks.find((link) => link.to === currPath)?.name;

  return (
    <header className="font-poppins bg-header sticky top-0 z-50 flex h-18.25 w-full items-center justify-between border-b-2 px-3 text-sm lg:h-22 lg:px-6 lg:text-xl">
      <div className="flex items-center justify-start gap-2">
        <SidebarTrigger className="flex size-8 lg:hidden" />
        {pageName && <p>{pageName}</p>}
      </div>
      <div className="">{fullName}</div>
    </header>
  );
}
