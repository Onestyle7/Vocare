'use client';

import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef,useState } from 'react';

import { logo, NavLinks } from '@/app/constants';
import MobileNav from '@/components/MobileComponents/MobileNav';
import { TokenCounter } from '@/components/PricingComponents/TokenCounter';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
// import ThemeSwitch from '../SupportComponents/ThemeSwitch';

const Header = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(false);
  const { isAuthenticated } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const floatingNavSwitch = true;

  // Magnetic hover states
  const navRef = useRef<HTMLUListElement>(null);
  const [dotLeft, setDotLeft] = useState(0);
  const [dotOpacity, setDotOpacity] = useState(0);
  const [activeDotLeft, setActiveDotLeft] = useState(0);
  const [activeDotOpacity, setActiveDotOpacity] = useState(0);
  const publicLinks = [
    { label: 'Blog', url: '/blog' },
    { label: 'Pricing', url: '/pricing' },
    { label: 'Sign In', url: '/sign-in' },
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
  }, [isMobile, floatingNavSwitch]);

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
            className="pointer-events-none fixed inset-x-0 top-3 z-[140] flex justify-center px-3 sm:top-4 sm:px-0"
          >
            <nav className="font-poppins pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-1.5 overflow-x-auto rounded-full border border-black/10 bg-white/85 px-2 py-2 text-neutral-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:max-w-[calc(100vw-2rem)] sm:gap-2 sm:px-3 dark:border-white/10 dark:bg-black/30 dark:text-white dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
              <Link
                href="/"
                aria-label="Go to homepage"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10 sm:h-10 sm:w-10"
              >
                <Image
                  src="/metadata/favicon-32x32.png"
                  alt="vocare"
                  width={24}
                  height={24}
                  className="pointer-events-none invert dark:invert-0"
                />
              </Link>

              <div className="h-6 w-px flex-none bg-black/10 dark:bg-white/10" />

              <ul className="flex items-center gap-1">
                {floatingLinks.map(({ label, url }) => {
                  const isActive = pathname === url;

                  return (
                    <li key={label}>
                      <Link
                        href={url}
                        className={cn(
                          'flex rounded-full px-3 py-2 text-[10px] font-medium whitespace-nowrap uppercase transition-all sm:text-xs lg:px-4',
                          isActive
                            ? 'bg-[linear-gradient(90deg,rgba(146,150,253,0.96)_0%,rgba(199,169,254,0.96)_100%)] text-white shadow-[0_10px_30px_rgba(146,150,253,0.3)]'
                            : 'text-neutral-600 hover:bg-black/5 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white'
                        )}
                      >
                        {label}
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
        className="font-korbin relative z-[100] flex items-center justify-end border-gray-400 max-md:border-b-[1px] md:justify-center dark:border-gray-600/30"
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

                {/* Animowana kropka na hover */}
                <motion.div
                  animate={{ left: dotLeft, opacity: dotOpacity }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-current"
                />

                {/* Kropka aktywnego linku */}
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

              {/* <ThemeSwitch /> */}
            </div>
          </nav>
        )}
      </header>
    </>
  );
};

export default Header;
