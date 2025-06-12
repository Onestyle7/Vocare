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
    <header className="relative z-[100] flex items-center justify-end border-gray-400 max-md:border-b-[1px] md:justify-center dark:border-gray-600/30">
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
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {disabled ? (
                    <div className="relative flex items-center space-x-2 text-[18px] font-normal uppercase">
                      <span>{label}</span>
                      <Badge variant="outline" className="absolute -top-4 -right-6 scale-75">
                        soon
                      </Badge>
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
