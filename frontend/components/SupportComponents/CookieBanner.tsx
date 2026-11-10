'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getCookie } from '@/lib/utils';
import { COOKIE_CONSENT_KEY, updateAnalyticsConsent } from '@/lib/utils/consent';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getCookie(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    updateAnalyticsConsent('granted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    updateAnalyticsConsent('denied');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-background/75 font-poppins fixed right-0 bottom-0 left-0 z-[9999] border-t px-4 py-3 shadow-lg backdrop-blur sm:p-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row">
        <div className="text-muted-foreground flex-1 text-xs sm:text-sm">
          <p className="text-foreground mb-1 text-sm font-semibold">Cenimy Twoją prywatność</p>
          Używamy plików cookie niezbędnych do poprawnego działania strony oraz opcjonalnych danych
          analitycznych.{' '}
          {/* The full explanation took ~45% of a phone screen, so small screens get
              the short version. Both choices and where to change them stay visible. */}
          <span className="hidden sm:inline">
            Klikając „Akceptuję wszystkie”, wyrażasz zgodę na używanie ciasteczek pomagających w
            analizie ruchu i rozwoju platformy. Jeśli wolisz je odrzucić, wybierz „Tylko
            niezbędne”.{' '}
          </span>
          Swoją decyzję możesz zmienić w dowolnym momencie w ustawieniach profilu.
        </div>
        <div className="flex w-full shrink-0 flex-row gap-2 sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleAccept}>
            Akceptuję wszystkie
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleDecline}>
            Tylko niezbędne
          </Button>
        </div>
      </div>
    </div>
  );
}
