'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { gsap } from 'gsap';

interface CollapsibleButtonProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function CollapsibleButton({ isCollapsed, toggleCollapse }: CollapsibleButtonProps) {
  const arrowUpRef = useRef<HTMLDivElement>(null);
  const arrowDownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animacja przycisków przy zmianie stanu
    if (isCollapsed && arrowDownRef.current && arrowUpRef.current) {
      gsap.to(arrowDownRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(arrowUpRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else if (!isCollapsed && arrowUpRef.current && arrowDownRef.current) {
      gsap.to(arrowUpRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(arrowDownRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [isCollapsed]); // Dodajemy isCollapsed jako zależność

  return (
    <Button
      variant="outline"
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#915EFF]/50 p-0"
      onClick={toggleCollapse}
    >
      <div className="relative h-6 w-6">
        <div
          ref={arrowDownRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: isCollapsed ? 1 : 0,
            transform: isCollapsed ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <ArrowDown size={24} />
        </div>
        <div
          ref={arrowUpRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: isCollapsed ? 0 : 1,
            transform: isCollapsed ? 'translateY(-20px)' : 'translateY(0)',
          }}
        >
          <ArrowUp size={24} />
        </div>
      </div>
    </Button>
  );
}
