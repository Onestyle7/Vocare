'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getCookie, setCookie } from '@/lib/utils';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getCookie('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie('cookie_consent', 'granted', 365);
    setShowBanner(false);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      });
    }
  };

  const handleDecline = () => {
    setCookie('cookie_consent', 'denied', 365);
    setShowBanner(false);

    // Explicitly update just in case
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="bg-background/75 font-poppins fixed right-0 bottom-0 left-0 z-[9999] border-t p-4 shadow-lg backdrop-blur sm:p-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-muted-foreground flex-1 text-sm">
          <p className="text-foreground mb-1 font-semibold">Cenimy Twoją prywatność</p>
          Używamy plików cookie niezbędnych do poprawnego działania strony oraz opcjonalnych danych
          analitycznych. Klikając „Akceptuję wszystkie”, wyrażasz zgodę na używanie ciasteczek
          pomagających w analizie ruchu i rozwoju platformy. Jeśli wolisz je odrzucić, wybierz
          „Tylko niezbędne”. Swoją decyzję możesz zmienić w dowolnym momencie w ustawieniach
          profilu.
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={handleAccept}>
            Akceptuję wszystkie
          </Button>
          <Button variant="outline" onClick={handleDecline}>
            Tylko niezbędne
          </Button>
        </div>
      </div>
    </div>
  );
}
