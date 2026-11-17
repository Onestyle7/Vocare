'use client';

import { Check, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { cn, getCookie } from '@/lib/utils';
import { COOKIE_CONSENT_KEY } from '@/lib/utils/consent';
import { trackEvent } from '@/lib/utils/tracking';

import { PROMO_CONTENT, type PromoPlacement, type PromoVariant } from '../constants/promo';

const DISMISS_KEY = 'vocare-promo-dismissed-at';
const DISMISS_EVENT = 'vocare-promo-dismiss';
const DISMISS_DAYS = 7;

const BRAND_GRADIENT =
  'bg-[linear-gradient(90deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)]';

const isDismissed = () => {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY));
    return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Storage blocked (private mode): the promo simply stays visible.
    return false;
  }
};

const subscribeToDismiss = (onChange: () => void) => {
  window.addEventListener(DISMISS_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(DISMISS_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
};

/** Closing either placement hides both, here and in other tabs, for a week. */
function usePromoDismissed() {
  const dismissed = useSyncExternalStore(subscribeToDismiss, isDismissed, () => false);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage blocked: hide for this page view only.
    }
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }, []);

  return [dismissed, dismiss] as const;
}

const trackPromo = (
  action: 'click' | 'dismiss',
  variant: PromoVariant,
  placement: PromoPlacement
) => {
  trackEvent(action === 'click' ? 'PromoClick' : 'PromoDismiss', { variant, placement });
};

function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Zamknij ofertę"
      className={cn(
        'absolute flex size-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:outline-none',
        className
      )}
    >
      <X className="size-4" />
    </button>
  );
}

/**
 * Promo card that sits next to an article and follows the reader down the page.
 * Rendered on the server, so its links are crawlable. Hide it below `xl` with
 * `className` and pair it with `PromoBar` there.
 */
export function PromoSidebar({
  variant,
  className,
}: {
  variant: PromoVariant;
  className?: string;
}) {
  const [dismissed, dismiss] = usePromoDismissed();
  const promo = PROMO_CONTENT[variant];

  if (dismissed) return null;

  return (
    <aside
      aria-label="Oferta Vocare"
      className={cn(
        'font-poppins sticky top-24 self-start overflow-hidden rounded-3xl border border-white/10 bg-[#16171B] p-6 text-[#F1F4FF]',
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[#915EFF]/30 blur-3xl"
      />
      <CloseButton
        className="top-3 right-3"
        onClick={() => {
          trackPromo('dismiss', variant, 'sidebar');
          dismiss();
        }}
      />
      <div className="relative space-y-4">
        <p
          className={cn(
            'bg-clip-text pr-6 text-xs font-medium tracking-wide text-transparent uppercase',
            BRAND_GRADIENT
          )}
        >
          {promo.eyebrow}
        </p>
        <p className="text-xl leading-snug font-medium">{promo.title}</p>
        <p className="text-sm font-light text-white/70">{promo.text}</p>
        <ul className="space-y-2 text-sm font-light">
          {promo.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#9D9BFF]" />
              {bullet}
            </li>
          ))}
        </ul>
        <Link
          href={promo.ctaHref}
          onClick={() => trackPromo('click', variant, 'sidebar')}
          className={cn(
            'flex w-full items-center justify-center gap-1 rounded-[14px] px-4 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
            BRAND_GRADIENT
          )}
        >
          {promo.ctaLabel}
          <ChevronRight className="size-4" />
        </Link>
        <p className="text-xs font-light text-white/50">{promo.note}</p>
        <Link
          href={promo.moreHref}
          className="inline-block text-sm text-white/80 underline underline-offset-4 hover:text-white"
        >
          {promo.moreLabel}
        </Link>
      </div>
    </aside>
  );
}

/**
 * Promo placed in the flow of the page, between the intro and the first
 * section of an article. Used on small screens instead of `PromoBar`, which
 * would cover the text the visitor came to read.
 */
export function PromoInline({ variant, className }: { variant: PromoVariant; className?: string }) {
  const [dismissed, dismiss] = usePromoDismissed();
  const promo = PROMO_CONTENT[variant];

  if (dismissed) return null;

  return (
    <aside
      aria-label="Oferta Vocare"
      className={cn(
        'font-poppins relative overflow-hidden rounded-2xl border border-white/10 bg-[#16171B] p-5 pr-11 text-[#F1F4FF]',
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-[#915EFF]/30 blur-3xl"
      />
      <CloseButton
        className="top-2 right-2"
        onClick={() => {
          trackPromo('dismiss', variant, 'inline');
          dismiss();
        }}
      />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="min-w-[13rem] flex-1 space-y-1.5">
          <p
            className={cn(
              'bg-clip-text text-xs font-medium tracking-wide text-transparent uppercase',
              BRAND_GRADIENT
            )}
          >
            {promo.eyebrow}
          </p>
          <p className="text-lg leading-snug font-medium">{promo.title}</p>
          <p className="text-sm font-light text-white/70">{promo.text}</p>
        </div>
        <div className="w-full space-y-2 sm:w-auto sm:max-w-64">
          <Link
            href={promo.ctaHref}
            onClick={() => trackPromo('click', variant, 'inline')}
            className={cn(
              'flex w-full items-center justify-center gap-1 rounded-[14px] px-5 py-3 text-sm font-medium whitespace-nowrap text-black transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
              BRAND_GRADIENT
            )}
          >
            {promo.ctaLabel}
            <ChevronRight className="size-4" />
          </Link>
          <p className="text-xs font-light text-white/50">{promo.note}</p>
        </div>
      </div>
    </aside>
  );
}

/**
 * The bar waits until the reader has engaged with the page (scrolled past the
 * intro or stayed a while) and until the cookie banner is answered, because
 * that banner occupies the same bottom edge of the screen.
 */
function useBarReady(scrollThreshold: number, delayMs: number) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    let delayPassed = false;
    const check = () => {
      const engaged = window.scrollY > scrollThreshold || delayPassed;
      if (engaged && getCookie(COOKIE_CONSENT_KEY)) setReady(true);
    };
    const timer = window.setTimeout(() => {
      delayPassed = true;
      check();
    }, delayMs);

    window.addEventListener('scroll', check, { passive: true });
    // Answering the cookie banner is a click, not a scroll.
    window.addEventListener('click', check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', check);
      window.removeEventListener('click', check);
    };
  }, [ready, scrollThreshold, delayMs]);

  return ready;
}

/** Slim promo pinned to the bottom of the viewport. Slides in once the reader is engaged. */
export function PromoBar({
  variant,
  className,
  scrollThreshold = 500,
  delayMs = 15000,
}: {
  variant: PromoVariant;
  className?: string;
  scrollThreshold?: number;
  delayMs?: number;
}) {
  const [dismissed, dismiss] = usePromoDismissed();
  const ready = useBarReady(scrollThreshold, delayMs);
  const promo = PROMO_CONTENT[variant];
  const visible = ready && !dismissed;

  if (dismissed) return null;

  return (
    <aside
      aria-label="Oferta Vocare"
      inert={!visible}
      className={cn(
        'font-poppins fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl transition-all duration-500 ease-out motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[150%] opacity-0',
        className
      )}
    >
      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-[#16171B]/95 p-4 pr-11 text-[#F1F4FF] shadow-[0_8px_40px_rgba(145,94,255,0.25)] backdrop-blur">
        <CloseButton
          className="top-2 right-2"
          onClick={() => {
            trackPromo('dismiss', variant, 'bar');
            dismiss();
          }}
        />
        <div className="min-w-[13rem] flex-1 space-y-1">
          <p
            className={cn(
              'hidden bg-clip-text text-xs font-medium tracking-wide text-transparent uppercase sm:block',
              BRAND_GRADIENT
            )}
          >
            {promo.eyebrow}
          </p>
          <p className="text-sm leading-snug font-medium sm:text-base">{promo.title}</p>
          <p className="text-xs font-light text-white/50">{promo.note}</p>
        </div>
        <div className="flex w-full items-center gap-4 sm:w-auto">
          <Link
            href={promo.moreHref}
            className="hidden text-sm whitespace-nowrap text-white/80 underline underline-offset-4 hover:text-white md:inline"
          >
            {promo.moreLabel}
          </Link>
          <Link
            href={promo.ctaHref}
            onClick={() => trackPromo('click', variant, 'bar')}
            className={cn(
              'flex w-full items-center justify-center gap-1 rounded-[14px] px-5 py-3 text-sm font-medium whitespace-nowrap text-black transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:w-auto',
              BRAND_GRADIENT
            )}
          >
            {promo.ctaLabel}
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
