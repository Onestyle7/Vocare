'use client';
import {
  BriefcaseBusiness,
  CreditCard,
  FileCheck,
  Info,
  LayoutDashboard,
  Map,
  MessageCircleQuestion,
  TrendingUp,
  User,
} from 'lucide-react';
import Image from 'next/image';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { logo } from '@/features/marketing/constants/countries';

import NavSection from './nav-section';

export type NavLink = {
  name: string;
  icon: typeof LayoutDashboard;
  to: string;
};

export const SIDEBAR_DATA = {
  nav: [
    {
      name: 'Pulpit',
      icon: LayoutDashboard,
      to: '/dashboard',
    },
    {
      name: 'Profil',
      icon: User,
      to: '/dashboard/profile',
    },
    {
      name: 'Asystent',
      icon: BriefcaseBusiness,
      to: '/dashboard/assistant',
    },
    {
      name: 'Analiza rynku',
      icon: TrendingUp,
      to: '/dashboard/market-analysis',
    },
    {
      name: 'Roadmap',
      icon: Map,
      to: '/dashboard/roadmap',
    },
    {
      name: 'Kreator CV',
      icon: FileCheck,
      to: '/dashboard/resume',
    },
  ],
  info: [
    {
      name: 'Pakiety',
      icon: CreditCard,
      to: '/pricing',
    },
    {
      name: 'Polityka Prywatności',
      icon: MessageCircleQuestion,
      to: '/privacy-policy',
    },
    {
      name: 'Regulamin',
      icon: Info,
      to: '/terms-of-service',
    },
  ],
};

export default function DashboardSidebar() {
  return (
    <Sidebar collapsible="icon" className="font-poppins z-99">
      <SidebarHeader className="flex h-(--header-h-sm) justify-center border-b-2 px-3 lg:h-(--header-h-lg)">
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-row items-center justify-between">
            <div className="flex max-w-36 flex-col overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
              <Image
                src={logo}
                alt="vocare"
                width={140}
                height={40}
                priority
                className="object-contain"
              />
              <p className="text-muted-foreground mt-0.5 text-[12px]">Odblokuj swój potencjał</p>
            </div>

            <SidebarTrigger className="size-10 shrink-0 transition-all duration-300 group-data-[collapsible=icon]:w-full [&_svg]:size-5!" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex justify-between">
        <NavSection links={SIDEBAR_DATA.nav} title="Nawigacja" />
        {/* TODO: Dodać licznik counterów i status subskrybcji */}
        <NavSection links={SIDEBAR_DATA.info} title="Informacje" />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
