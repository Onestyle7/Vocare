'use client';

import { useEffect } from 'react';

import { trackEvent } from '@/lib/utils/tracking';

/** Rendered only on /pricing, because the landing page embeds the same pricing cards. */
export function PricingViewTracker() {
  useEffect(() => {
    trackEvent('ViewContent');
  }, []);

  return null;
}
