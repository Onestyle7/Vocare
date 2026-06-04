import { usePathname } from 'next/navigation';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar';

import { NavLink } from './dashboard-sidebar';
import SidebarLink from './sidebar-link';

export default function NavSection({ links, title }: { links: NavLink[]; title?: string }) {
  const currPath = usePathname();

  return (
    <SidebarGroup className="p-3">
      {title && (
        <SidebarGroupLabel className="text-sidebar-accent-foreground">{title}</SidebarGroupLabel>
      )}
      <SidebarMenu>
        {links &&
          links.map((link) => (
            <SidebarLink key={link.to} link={link} isActive={currPath == link.to} />
          ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
