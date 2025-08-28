'use client';
import React, { useState, useEffect, useRef } from 'react';
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
import { motion } from 'motion/react';

const Header = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated } = useAuth();

  // Magnetic hover states
  const navRef = useRef<HTMLUListElement>(null);
  const [dotLeft, setDotLeft] = useState(0);
  const [dotOpacity, setDotOpacity] = useState(0);
  const [activeDotLeft, setActiveDotLeft] = useState(0);
  const [activeDotOpacity, setActiveDotOpacity] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated && navRef.current) {
      const activeLink = navRef.current.querySelector(`[data-active="true"]`) as HTMLElement;
      if (activeLink) {
        const rect = activeLink.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        const relativeLeft = rect.left - navRect.left + rect.width / 2 - 3;
        setActiveDotLeft(relativeLeft);
        setActiveDotOpacity(1);
      } else {
        setActiveDotOpacity(0);
      }
    }
  }, [pathname, isAuthenticated, isMobile]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLLIElement>) => {
    const node = e.currentTarget;
    const rect = node.getBoundingClientRect();
    const navRect = navRef.current?.getBoundingClientRect();

    if (navRect) {
      const relativeLeft = rect.left - navRect.left + rect.width / 2 - 3;
      setDotLeft(relativeLeft);
      setDotOpacity(1);
    }
  };

  const handleMouseLeave = () => {
    setDotOpacity(0);
  };

  const filteredLinks = isAuthenticated ? NavLinks : [];

  return (
    <header className="font-korbin relative z-[100] flex items-center justify-end border-gray-400 max-md:border-b-[1px] md:justify-center dark:border-gray-600/30">
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
            <div className="relative">
              <ul
                ref={navRef}
                onMouseLeave={handleMouseLeave}
                className="flex items-center justify-center space-x-4"
              >
                {filteredLinks.map(({ label, url, disabled }) => (
                  <li
                    key={label}
                    onMouseEnter={handleMouseEnter}
                    data-active={pathname === url && !disabled}
                    className={cn('relative w-full', disabled && 'cursor-not-allowed opacity-50')}
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
              {/* Animowana kropka na hover */}
              <motion.div
                animate={{
                  left: dotLeft,
                  opacity: dotOpacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
                className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-current"
              />
              <motion.div
                animate={{
                  left: activeDotLeft,
                  opacity: activeDotOpacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-gray-400/70"
              />
            </div>
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
