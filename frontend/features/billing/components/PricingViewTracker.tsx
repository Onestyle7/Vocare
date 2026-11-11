'use client';

import { useEffect } from 'react';

import { trackConversion } from '@/lib/utils/tracking';

/** Rendered only on /pricing, because the landing page embeds the same pricing cards. */
export function PricingViewTracker() {
  useEffect(() => {
    trackConversion('ViewContent');
  }, []);

  return null;
}
