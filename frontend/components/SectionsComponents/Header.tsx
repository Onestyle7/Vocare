'use client';

import React, { useState, useEffect } from 'react';
import ThemeSwitch from '../ThemeSwitch';
import { NavLinks } from '@/app/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import MobileNav from '../MobileUI/MobileNav';

const Header = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="relative z-[100] flex items-center justify-end md:justify-center">
      {isMobile ? (
        <MobileNav />
      ) : (
        <nav className="mx-20 mt-10 flex w-full items-center justify-between space-x-10">
          <h1 className="text-[20px] font-medium text-gray-400 uppercase">Vocare</h1>
          <div className="flex items-center justify-center space-x-4">
            <ul className="flex items-center justify-center space-x-4">
              {NavLinks.map(({ label, url }) => (
                <Link key={label} href={url}>
                  <li className={cn('w-full', pathname === url && 'underline')}>
                    <p className="text-[18px] font-normal uppercase">{label}</p>
                  </li>
                </Link>
              ))}
            </ul>
          </div>
          <ThemeSwitch />
        </nav>
      )}
    </header>
  );
};

export default Header;
