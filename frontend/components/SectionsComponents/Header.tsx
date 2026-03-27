'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logo, NavLinks } from '@/app/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import MobileNav from '@/components/MobileComponents/MobileNav';
import { TokenCounter } from '@/components/PricingComponents/TokenCounter';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'motion/react';
// import ThemeSwitch from '../SupportComponents/ThemeSwitch';

type FloatingNavVariant = 'default' | 'reveal-on-scroll-up';

const floatingNavConfig = {
  enabled: true,
  variant: 'reveal-on-scroll-up' as FloatingNavVariant,
};

const FLOATING_NAV_TOP_OFFSET = 24;
const FLOATING_NAV_REVEAL_THRESHOLD = 20;

const Header = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(false);
  const { isAuthenticated } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const floatingNavSwitch = floatingNavConfig.enabled;
  const floatingNavVariant = floatingNavConfig.variant;
  const lastScrollYRef = useRef(0);
  const upwardScrollDistanceRef = useRef(0);

  // Magnetic hover states
  const navRef = useRef<HTMLUListElement>(null);
  const [dotLeft, setDotLeft] = useState(0);
  const [dotOpacity, setDotOpacity] = useState(0);
  const [activeDotLeft, setActiveDotLeft] = useState(0);
  const [activeDotOpacity, setActiveDotOpacity] = useState(0);

  const publicLinks = [
    { label: 'Work', url: '/work' },
    { label: 'About', url: '/about' },
    { label: 'Playground', url: '/playground' },
    { label: 'Resource', url: '/resource' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !navRef.current) return;

    const activeLink = navRef.current.querySelector(`[data-active="true"]`) as HTMLElement | null;
    if (!activeLink) {
      setActiveDotOpacity(0);
      return;
    }

    const rect = activeLink.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();
    const relativeLeft = rect.left - navRect.left + rect.width / 2 - 3;

    setActiveDotLeft(relativeLeft);
    setActiveDotOpacity(1);
  }, [pathname, isAuthenticated, isMobile]);

  useEffect(() => {
    if (!floatingNavSwitch || isMobile) {
      setShowFloatingNav(false);
      return;
    }

    const headerNode = headerRef.current;
    if (!headerNode) return;

    if (floatingNavVariant === 'default') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setShowFloatingNav(!entry.isIntersecting);
        },
        {
          threshold: 0,
          rootMargin: '-12px 0px 0px 0px',
        }
      );

      observer.observe(headerNode);

      return () => observer.disconnect();
    }

    lastScrollYRef.current = window.scrollY;
    upwardScrollDistanceRef.current = 0;

    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      const headerBottom = headerNode.getBoundingClientRect().bottom;
      const headerIsClearOfFloatingNav = headerBottom <= FLOATING_NAV_TOP_OFFSET;

      if (!headerIsClearOfFloatingNav) {
        upwardScrollDistanceRef.current = 0;
        setShowFloatingNav(false);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (scrollDelta > 0) {
        upwardScrollDistanceRef.current = 0;
        setShowFloatingNav(false);
      } else if (scrollDelta < 0) {
        upwardScrollDistanceRef.current += Math.abs(scrollDelta);

        if (upwardScrollDistanceRef.current >= FLOATING_NAV_REVEAL_THRESHOLD) {
          setShowFloatingNav(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isMobile, floatingNavSwitch, floatingNavVariant]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLLIElement>) => {
    const node = e.currentTarget;
    const rect = node.getBoundingClientRect();
    const navRect = navRef.current?.getBoundingClientRect();

    if (!navRect) return;

    const relativeLeft = rect.left - navRect.left + rect.width / 2 - 3;
    setDotLeft(relativeLeft);
    setDotOpacity(1);
  };

  const handleMouseLeave = () => {
    setDotOpacity(0);
  };

  const filteredLinks = isAuthenticated ? NavLinks : [];
  const floatingLinks = isAuthenticated ? filteredLinks : publicLinks;

  return (
    <>
      <AnimatePresence>
        {floatingNavSwitch && !isMobile && showFloatingNav && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="pointer-events-none fixed inset-x-0 top-6 z-140 flex justify-center px-3 sm:px-0"
          >
            <nav className="font-poppins pointer-events-auto flex items-center gap-4 rounded-full border border-white/10 bg-[#0c0c0c] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.5)] sm:gap-6">
              {/* Logo po lewej */}
              <Link
                href="/"
                aria-label="Go to homepage"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#111111] transition-transform hover:scale-105"
              >
                <Image
                  src="/metadata/favicon-32x32.png"
                  alt="vocare"
                  width={20}
                  height={20}
                  className="pointer-events-none"
                />
              </Link>

              {/* Linki po prawej */}
              <ul className="flex items-center gap-1 pr-1.5">
                {floatingLinks.map(({ label, url }) => {
                  const isActive = pathname === url;

                  return (
                    <li key={label}>
                      <Link
                        href={url}
                        className={cn(
                          'group relative flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-medium transition-colors',
                          isActive
                            ? 'pointer-events-none bg-white text-black'
                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <span className="relative block overflow-hidden">
                          <span className="block transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-[120%]">
                            {label}
                          </span>
                          <span className="absolute inset-0 block translate-y-[120%] transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-y-0">
                            {label}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <header
        ref={headerRef}
        className="font-korbin relative z-100 flex items-center justify-end border-gray-400 max-md:border-b md:justify-center dark:border-gray-600/30"
      >
        {isMobile ? (
          <MobileNav isAuthenticated={isAuthenticated} />
        ) : (
          <nav className="mx-20 mt-10 flex w-full items-center justify-between space-x-10">
            <Link href="/" aria-label="Go to homepage">
              <Image
                src={logo}
                alt="vocare"
                width={184}
                height={184}
                className="pointer-events-none invert dark:invert-0"
                priority
              />
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <ul
                  ref={navRef}
                  onMouseLeave={handleMouseLeave}
                  className="flex items-center justify-center space-x-4"
                >
                  {filteredLinks.map(({ label, url, highlighted, badge }) => {
                    const isActive = pathname === url;

                    return (
                      <li
                        key={label}
                        onMouseEnter={handleMouseEnter}
                        data-active={isActive}
                        className="relative w-full"
                      >
                        <Link
                          href={url}
                          className={cn(
                            'relative flex items-center text-[18px] font-normal uppercase',
                            highlighted && 'cursor-pointer'
                          )}
                        >
                          <span>{label}</span>

                          {highlighted && badge && (
                            <Badge
                              variant="outline"
                              className="pointer-events-none absolute -top-4 -right-6 scale-75"
                            >
                              {badge}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <motion.div
                  animate={{ left: dotLeft, opacity: dotOpacity }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-current"
                />

                <motion.div
                  animate={{ left: activeDotLeft, opacity: activeDotOpacity }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-gray-400/70"
                />
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-4">
              {isAuthenticated && <TokenCounter />}

              <>
                {!isAuthenticated &&
                  publicLinks.map((link) => (
                    <Link href={link.url} key={link.url}>
                      <p className="text-[18px] font-normal uppercase">{link.label}</p>
                    </Link>
                  ))}
              </>
            </div>
          </nav>
        )}
      </header>
    </>
  );
};

export default Header;
