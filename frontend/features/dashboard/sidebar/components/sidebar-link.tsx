import Link from 'next/link';

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import type { NavLink } from './dashboard-sidebar';

export default function SidebarLink({ link, isActive }: { link: NavLink; isActive: boolean }) {
  return (
    <SidebarMenuItem key={link.to}>
      <SidebarMenuButton
        asChild
        tooltip={link.name}
        className={cn(
          'hover:bg-sidebar-accent hover:text-sidebar-primary-foreground px-4 py-6 transition-all duration-300 ease-in-out',
          'group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:gap-0',
          isActive && 'bg-sidebar-accent text-sidebar-primary hover:text-sidebar-primary'
        )}
      >
        <Link href={link.to} className="mx-auto">
          <link.icon className="size-5! shrink-0 transition-all duration-300" />
          <span className="whitespace-nowrap transition-all duration-300 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
            {link.name}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
