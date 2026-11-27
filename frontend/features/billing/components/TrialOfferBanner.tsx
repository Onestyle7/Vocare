'use client';

import { Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { cn, getCookie } from '@/lib/utils';
import { COOKIE_CONSENT_KEY } from '@/lib/utils/consent';
import { trackEvent } from '@/lib/utils/tracking';

import { pricingPlans } from '../constants';
import { isSnoozed, nextSnooze, parseSnooze, TRIAL_OFFER_SNOOZE_KEY } from '../trialOfferSnooze';
import type { SubscriptionStatuses } from '../types';

export const TRIAL_OFFER_DELAY_MS = 20_000;

const SNOOZE_EVENT = 'vocare-trial-offer-snooze';

const readSnooze = () => {
  try {
    return parseSnooze(window.localStorage.getItem(TRIAL_OFFER_SNOOZE_KEY));
  } catch {
    // Storage blocked (private mode): the offer is never snoozed across page loads.
    return null;
  }
};

const subscribeToSnooze = (onChange: () => void) => {
  window.addEventListener(SNOOZE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SNOOZE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
};

/** Snooze state shared across tabs. Hidden during SSR so the banner never flashes. */
function useTrialOfferSnooze() {
  const snoozed = useSyncExternalStore(
    subscribeToSnooze,
    () => isSnoozed(readSnooze(), Date.now()),
    () => true
  );
  // Blocked storage: keep the dismissal for this page view.
  const [dismissedNow, setDismissedNow] = useState(false);

  const snooze = useCallback(() => {
    setDismissedNow(true);
    try {
      window.localStorage.setItem(
        TRIAL_OFFER_SNOOZE_KEY,
        JSON.stringify(nextSnooze(readSnooze(), Date.now()))
      );
    } catch {
      // Storage blocked: hidden for this page view only.
    }
    window.dispatchEvent(new Event(SNOOZE_EVENT));
  }, []);

  return [snoozed || dismissedNow, snooze] as const;
}

/** True once the delay has passed and the cookie banner (same bottom edge) is answered. */
function useDelayElapsed(delayMs: number, enabled: boolean) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled || ready) return;

    let delayPassed = false;
    const check = () => {
      if (delayPassed && getCookie(COOKIE_CONSENT_KEY)) setReady(true);
    };
    const timer = window.setTimeout(() => {
      delayPassed = true;
      check();
    }, delayMs);
    // Answering the cookie banner is a click.
    window.addEventListener('click', check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('click', check);
    };
  }, [delayMs, enabled, ready]);

  return ready;
}

const premiumPlan = pricingPlans.find((plan) => plan.type === 'subscription');

/**
 * Invites a signed-in user without a subscription to start the Premium trial. Appears
 * a while after entering the app; every dismissal (or click) snoozes it for longer.
 */
export function TrialOfferBanner({
  trialDays,
  subscriptionStatus,
  delayMs = TRIAL_OFFER_DELAY_MS,
}: {
  // null = not eligible (trial disabled or the account already had a subscription)
  trialDays: number | null;
  subscriptionStatus: SubscriptionStatuses;
  delayMs?: number;
}) {
  const eligible = subscriptionStatus === 'None' && trialDays !== null && trialDays > 0;
  const [snoozed, snooze] = useTrialOfferSnooze();
  const ready = useDelayElapsed(delayMs, eligible && !snoozed);
  const visible = eligible && ready && !snoozed;
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!visible || viewTracked.current) return;
    viewTracked.current = true;
    trackEvent('TrialOfferView');
  }, [visible]);

  if (!eligible || snoozed) return null;

  const priceAfterTrial = premiumPlan
    ? `${premiumPlan.price} zł${premiumPlan.priceLabel.replace('/ ', '/')}`
    : null;

  return (
    <aside
      aria-label="Oferta okresu próbnego Premium"
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        'font-poppins fixed inset-x-4 bottom-4 z-40 transition-all duration-500 ease-out motion-reduce:transition-none sm:right-6 sm:bottom-6 sm:left-auto sm:w-96',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[150%] opacity-0'
      )}
    >
      <div className="bg-card text-card-foreground border-border relative overflow-hidden rounded-2xl border p-5 pr-11 shadow-[0_8px_40px_rgba(145,94,255,0.25)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-[#915EFF]/20 blur-3xl"
        />
        <button
          type="button"
          onClick={() => {
            trackEvent('TrialOfferDismiss');
            snooze();
          }}
          aria-label="Zamknij ofertę"
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-2 right-2 flex size-7 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
        <div className="relative space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-normal text-[#915EFF] uppercase">
            <Sparkles className="size-3.5" />
            Premium za 0 zł
          </p>
          <p className="text-base leading-snug font-medium">
            Wypróbuj Premium przez {trialDays} dni za darmo
          </p>
          <p className="text-muted-foreground text-sm">
            Nielimitowane rekomendacje kariery, analizy rynku i dopasowanie CV do ofert pracy.
          </p>
          <Link
            href="/pricing"
            onClick={() => {
              trackEvent('TrialOfferClick');
              snooze();
            }}
            className="flex w-full items-center justify-center rounded-xl bg-[#915EFF] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Testuj {trialDays} dni za darmo
          </Link>
          {priceAfterTrial && (
            <p className="text-muted-foreground text-xs">
              0 zł przez {trialDays} dni,{' '}
              <strong className="text-foreground font-medium">
                potem {priceAfterTrial}, odnawiane automatycznie.
              </strong>{' '}
              Anuluj w każdej chwili.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
