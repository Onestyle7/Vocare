'use client';

import React, { useRef, useEffect } from 'react';
import { logo, NavLinks } from '@/app/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { gsap } from 'gsap';
import ThemeSwitch from '../SupportComponents/ThemeSwitch';
import { TokenCounter } from '../PricingComponents/TokenCounter';
import Image from 'next/image';
import { Badge } from '../ui/badge';

interface MobileNavProps {
  isAuthenticated: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ isAuthenticated }) => {
  const pathname = usePathname();
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);

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
      <Link href="/" className="ml-4 flex w-full text-2xl">
        <Image src={logo} alt="Vocare" width={128} height={128} className="invert dark:invert-0" />
      </Link>
      <SheetTrigger asChild>
        <button className="relative p-8" aria-label="menu" onClick={() => setIsOpen(!isOpen)}>
          <span
            ref={line1Ref}
            className="absolute h-0.5 w-8 bg-black dark:bg-white"
            style={{ left: '50%', top: '35%', transform: 'translate(-50%, -50%)' }}
          />
          <span
            ref={line2Ref}
            className="absolute h-0.5 w-8 bg-black dark:bg-white"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          />
          <span
            ref={line3Ref}
            className="absolute h-0.5 w-8 bg-black dark:bg-white"
            style={{ left: '50%', bottom: '30%', transform: 'translate(-50%, -50%)' }}
          />
        </button>
      </SheetTrigger>
      <SheetContent side="top" className="h-full">
        <SheetTitle className="hidden">Vocare</SheetTitle>
        

<ul className="mt-10 flex h-full flex-col items-center justify-center space-y-4">
  {filteredLinks.map(({ label, url, disabled }) => (
    <li key={label}>
      {disabled ? (
        <div
          className="relative text-[18px] font-normal uppercase opacity-50 cursor-not-allowed"
          title="Coming soon"
        >
          {label}
          <Badge variant="outline" className="absolute sm:-right-10 -top-2 -right-12 scale-75">
            soon
          </Badge>
        </div>
      ) : (
        <SheetClose asChild>
          <Link
            href={url}
            className={cn(
              'text-[18px] font-normal uppercase',
              pathname === url && 'underline'
            )}
          >
            {label}
          </Link>
        </SheetClose>
      )}
    </li>
  ))}
  {!isAuthenticated && (
    <SheetClose asChild>
      <Link href="/sign-in" className="text-[18px] font-normal uppercase">
        Sign In
      </Link>
    </SheetClose>
  )}
  {isAuthenticated && <TokenCounter />}
  <ThemeSwitch />
</ul>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
