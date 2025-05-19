'use client';

import React, { useState, useEffect } from 'react';
import { logo, NavLinks } from '@/app/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import MobileNav from '@/components/MobileUI/MobileNav';
import { TokenCounter } from '@/components/PricingComponents/TokenCounter';
import ThemeSwitch from '../ThemeSwitch';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredLinks = isAuthenticated ? NavLinks : [];

  return (
    <header className="relative z-[100] flex items-center justify-end md:justify-center">
      {isMobile ? (
        <MobileNav isAuthenticated={isAuthenticated} />
      ) : (
        <nav className="mx-20 mt-10 flex w-full items-center justify-between space-x-10">
          <Link href="/">
            <Image
              src={logo}
              alt="vocare"
              width={184}
              height={184}
              className="pointer-events-none invert dark:invert-0"
            />
          </Link>

          {isAuthenticated ? (
            <ul className="flex items-center justify-center space-x-4">
  {filteredLinks.map(({ label, url, disabled }) => (
    <li
      key={label}
      className={cn(
        'relative w-full',
        pathname === url && !disabled && 'underline',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {disabled ? (
        <div className="flex items-center space-x-2 text-[18px] font-normal uppercase relative">
  <span>{label}</span>
  <Badge variant="outline" className="absolute -right-6 -top-4 scale-75">soon</Badge>
</div>

      ) : (
        <Link href={url}>
          <p className="text-[18px] font-normal uppercase">{label}</p>
        </Link>
      )}
    </li>
  ))}
</ul>

          ) : (
            <div />
          )}

          <div className="flex items-center space-x-4">
            {isAuthenticated && <TokenCounter />}
            {!isAuthenticated && (
              <Link href="/sign-in">
                <p className="text-[18px] font-normal uppercase">Sign In</p>
              </Link>
            )}
            <ThemeSwitch />
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
