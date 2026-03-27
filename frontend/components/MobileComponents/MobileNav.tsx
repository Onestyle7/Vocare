'use client';

import React, { useRef, useEffect } from 'react';
import { NavLinks } from '@/app/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { gsap } from 'gsap';
import { TokenCounter } from '../PricingComponents/TokenCounter';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { Button } from '../ui/button';

interface MobileNavProps {
  isAuthenticated: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ isAuthenticated }) => {
  const pathname = usePathname();
  const isMobile = useIsMobile('(max-width: 767px)');
  const line1Ref = useRef<HTMLSpanElement | null>(null);
  const line2Ref = useRef<HTMLSpanElement | null>(null);
  const line3Ref = useRef<HTMLSpanElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    if (!isMobile) setIsOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (isOpen) {
      gsap.to(line1Ref.current, {
        rotation: 45,
        top: '50%',
        duration: 0.3,
        ease: 'power2.inOut',
      });
      gsap.to(line2Ref.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      });
      gsap.to(line3Ref.current, {
        rotation: -45,
        top: '50%',
        duration: 0.3,
        ease: 'power2.inOut',
      });
    } else {
      gsap.to(line1Ref.current, {
        rotation: 0,
        top: '35%',
        duration: 0.3,
        ease: 'power2.inOut',
      });
      gsap.to(line2Ref.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      });
      gsap.to(line3Ref.current, {
        rotation: 0,
        top: '65%',
        duration: 0.3,
        ease: 'power2.inOut',
      });
    }
  }, [isOpen]);

  const filteredLinks = isAuthenticated ? NavLinks : [];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* ZMIANA: Dodano fixed, top-0, left-0, z-50 oraz tło z efektem szkła */}
      <div className="bg-background fixed top-0 left-0 z-50 flex w-full items-center justify-between border-b border-b-gray-600/20 px-4 py-3 transition-colors duration-300">
        {/* LEWA STRONA */}
        <Link href="/" className="flex items-center">
          <Image
            src="/icons/mobile-icon.png"
            alt="Vocare"
            width={28}
            height={28}
            className="invert dark:invert-0"
          />
        </Link>

        {/* PRAWA STRONA */}
        <div className="flex items-center gap-3">
          <Link href="/assistant" className="font-grotesk">
            <Button size="sm" className="font-zona-semibold rounded-[10px] text-xs">
              Znajdź ścieżkę
            </Button>
          </Link>

          <SheetTrigger asChild>
            <button
              className="relative h-12 w-12"
              aria-label="menu"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span
                ref={line1Ref}
                className="absolute h-0.5 w-6 bg-black dark:bg-white"
                style={{
                  left: '50%',
                  top: '35%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <span
                ref={line2Ref}
                className="absolute h-0.5 w-6 bg-black dark:bg-white"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <span
                ref={line3Ref}
                className="absolute h-0.5 w-6 bg-black dark:bg-white"
                style={{
                  left: '50%',
                  top: '65%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </button>
          </SheetTrigger>
        </div>
      </div>

      <SheetContent side="top" className="font-korbin h-full">
        <SheetTitle className="hidden">Vocare</SheetTitle>

        <ul className="mt-10 flex h-full flex-col items-center justify-center space-y-4">
          {filteredLinks.map(({ label, url, highlighted, badge }) => {
            const isActive = pathname === url;

            return (
              <li key={label} className="relative">
                <SheetClose asChild>
                  <Link
                    href={url}
                    className={cn(
                      'relative text-[18px] font-normal uppercase',
                      isActive && 'underline'
                    )}
                  >
                    <span>{label}</span>

                    {highlighted && badge && (
                      <Badge
                        variant="outline"
                        className="pointer-events-none absolute -top-5 -right-10 scale-75 sm:-right-8"
                      >
                        {badge}
                      </Badge>
                    )}
                  </Link>
                </SheetClose>
              </li>
            );
          })}

          {!pathname.includes('blog') && (
            <li>
              <SheetClose asChild>
                <Link href="/blog" className="text-[18px] font-normal uppercase">
                  Blog
                </Link>
              </SheetClose>
            </li>
          )}

          {!isAuthenticated && (
            <>
              <li>
                <SheetClose asChild>
                  <Link href="/pricing" className="text-[18px] font-normal uppercase">
                    Pricing
                  </Link>
                </SheetClose>
              </li>
              <li>
                <SheetClose asChild>
                  <Link href="/sign-in" className="text-[18px] font-normal uppercase">
                    Sign In
                  </Link>
                </SheetClose>
              </li>
            </>
          )}

          {isAuthenticated && <TokenCounter />}
        </ul>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
