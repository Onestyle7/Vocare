// components/SmoothScrollProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { SmoothScroll } from '@/lib/utils/smooth-scroll';

const SmoothScrollContext = createContext<SmoothScroll | null>(null);

export const useSmoothScrollContext = () => {
  const context = useContext(SmoothScrollContext);
  return context;
};

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [smoothScroll, setSmoothScroll] = useState<SmoothScroll | null>(null);

  useEffect(() => {
    const instance = new SmoothScroll();
    setSmoothScroll(instance);

    return () => {
      instance.destroy();
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={smoothScroll}>{children}</SmoothScrollContext.Provider>
  );
}
