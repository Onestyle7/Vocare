import { useEffect, useState } from 'react';

// Detects when the viewport is at or below a mobile breakpoint.
// Starts as false on the client too, so the first render matches SSR; the effect syncs the real value.
export const useIsMobile = (query: string = '(max-width: 1024px)') => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return isMobile;
};
