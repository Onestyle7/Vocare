'use client';
import { useEffect } from 'react';

export function useLockScrollOnLg() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apply = () => {
      const isLarge = window.matchMedia('(min-width: 1024px)').matches;
      const html = document.documentElement;
      const body = document.body;
      html.style.overflow = isLarge ? 'hidden' : '';
      body.style.overflow = isLarge ? 'hidden' : '';
    };

    apply();
    window.addEventListener('resize', apply);
    return () => {
      const html = document.documentElement;
      const body = document.body;
      html.style.overflow = '';
      body.style.overflow = '';
      window.removeEventListener('resize', apply);
    };
  }, []);
}
