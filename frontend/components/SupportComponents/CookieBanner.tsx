'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getCookie } from '@/lib/utils';
import {
  ADS_CONSENT_KEY,
  clearRefusedTrackerData,
  COOKIE_CONSENT_KEY,
  updateAdsConsent,
  updateAnalyticsConsent,
} from '@/lib/utils/consent';
import { recordCookieConsentChoice } from '@/lib/utils/consent-record';

interface ConsentSwitchProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ConsentSwitch({ id, label, description, checked, onCheckedChange }: ConsentSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label htmlFor={id} className="cursor-pointer">
        <span className="text-foreground font-medium">{label}</span> – {description}
      </label>
    </div>
  );
}

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    // The banner is on every page, so this is where leftovers of a refused tool get cleaned up
    clearRefusedTrackerData();

    const analyticsChoice = getCookie(COOKIE_CONSENT_KEY);
    // Visitors who only answered the earlier, analytics-only banner are asked again
    if (!analyticsChoice || !getCookie(ADS_CONSENT_KEY)) {
      setAnalytics(analyticsChoice === 'granted');
      setShowBanner(true);
    }
  }, []);

  const saveChoice = (analyticsGranted: boolean, adsGranted: boolean) => {
    updateAnalyticsConsent(analyticsGranted);
    updateAdsConsent(adsGranted);
    recordCookieConsentChoice('Banner');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-background/75 font-poppins fixed right-0 bottom-0 left-0 z-[9999] border-t px-4 py-3 shadow-lg backdrop-blur sm:p-6">
      <div className="container mx-auto flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row">
          {/* Smaller type on phones keeps the banner compact. The text itself is the same on every
              screen: it is what visitors consent to (COOKIE_CONSENT_TEXT_VERSION), so a shorter
              phone version would have to be versioned and must still name the pixels. */}
          <div className="text-muted-foreground flex-1 text-xs sm:text-sm">
            <p className="text-foreground mb-1 text-sm font-semibold">Cenimy Twoją prywatność</p>
            Używamy plików cookie niezbędnych do działania strony. Za Twoją zgodą używamy też
            cookies analitycznych (Google Analytics), które pomagają nam rozwijać Vocare, oraz
            reklamowych (piksele TikToka i Mety), które przekazują tym serwisom informacje o Twojej
            wizycie, żebyśmy mogli mierzyć skuteczność reklam i docierać z nimi do zainteresowanych
            osób. Wybór zmienisz w każdej chwili w{' '}
            <Link href="/preferences" className="text-foreground underline">
              Preferencjach prywatności
            </Link>
            , a szczegóły znajdziesz w{' '}
            <Link href="/privacy-policy" className="text-foreground underline">
              Polityce prywatności
            </Link>
            .
          </div>
          {/* Two rows on phones instead of three: accepting and refusing stay side by side and
              equally prominent, the settings below them */}
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row">
            <Button variant="outline" onClick={() => saveChoice(true, true)}>
              Akceptuję wszystkie
            </Button>
            <Button variant="outline" onClick={() => saveChoice(false, false)}>
              Tylko niezbędne
            </Button>
            <Button
              variant="outline"
              className="col-span-2"
              aria-expanded={showSettings}
              onClick={() => setShowSettings((open) => !open)}
            >
              Ustawienia
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className="text-muted-foreground flex flex-col gap-4 border-t pt-4 text-sm md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3">
              <ConsentSwitch
                id="cookie-banner-analytics"
                label="Analityczne"
                description="Google Analytics, statystyki ruchu w serwisie"
                checked={analytics}
                onCheckedChange={setAnalytics}
              />
              <ConsentSwitch
                id="cookie-banner-ads"
                label="Reklamowe"
                description="piksele TikToka i Mety, pomiar skuteczności reklam"
                checked={ads}
                onCheckedChange={setAds}
              />
            </div>
            <Button variant="outline" onClick={() => saveChoice(analytics, ads)}>
              Zapisz wybór
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
