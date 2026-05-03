'use client';

import { gsap } from 'gsap';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

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
      type="button"
      variant="ghost"
      aria-label={isCollapsed ? 'Rozwiń sekcję' : 'Zwiń sekcję'}
      className="border-light-sweep flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-0 text-white/80 shadow-none backdrop-blur-sm transition-[background-color,color,transform] hover:bg-white/[0.05] hover:text-white"
      onClick={toggleCollapse}
    >
      <div className="relative h-5 w-5">
        <div
          ref={arrowDownRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: isCollapsed ? 1 : 0,
            transform: isCollapsed ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <ArrowDown size={18} />
        </div>
        <div
          ref={arrowUpRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: isCollapsed ? 0 : 1,
            transform: isCollapsed ? 'translateY(-20px)' : 'translateY(0)',
          }}
        >
          <ArrowUp size={18} />
        </div>
      </div>
    </Button>
  );
}
