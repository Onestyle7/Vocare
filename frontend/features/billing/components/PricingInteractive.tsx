'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ScrollParallax } from 'react-just-parallax';

import { shape1 } from '@/features/marketing/constants';

import { applyPricingOffers, type PricingOffers } from '../billingUtils';
import { ACTIVE_SUBSCRIPTION_STATUSES, DEFAULT_TRIAL_DAYS, pricingPlans } from '../constants';
import { getSubscriptionStatusAction } from '../dal/commands';
import { useBillingActions } from '../hooks/useBillingActions';
import { PricingCard } from './PricingCard';

interface PricingInteractiveProps {
  showGlow?: boolean;
  showShapes?: boolean;
}

export function PricingInteractive({
  showGlow = true,
  showShapes = true,
}: PricingInteractiveProps) {
  const { handleCheckout, handleCustomerPortal, isPending } = useBillingActions();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  // Niezalogowani widzą domyślny trial – po zalogowaniu API mówi, czy konto się kwalifikuje
  const [offers, setOffers] = useState<PricingOffers>({
    trialDays: DEFAULT_TRIAL_DAYS,
    consentDiscount: null,
  });

  useEffect(() => {
    let isMounted = true;
    getSubscriptionStatusAction().then(([error, data]) => {
      if (!isMounted) return;
      if (error) {
        if (error.type === 'Unauthorized') {
          setIsAuthenticated(false);
          setHasActiveSubscription(false);
        }
        return;
      }
      if (data) {
        setIsAuthenticated(true);
        setHasActiveSubscription(ACTIVE_SUBSCRIPTION_STATUSES.includes(data.subscriptionStatus));
        setOffers({
          trialDays: data.trialDays ?? null,
          consentDiscount: data.consentDiscount ?? null,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative isolate mt-8 mb-10 w-full px-4 md:px-6">
      {showGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            width: 'min(80vw, 960px)',
            height: 'min(70vh, 780px)',
            background:
              'radial-gradient(ellipse at center, rgba(145,94,255,0.28) 0%, rgba(145,94,255,0.16) 45%, rgba(145,94,255,0.06) 65%, transparent 75%)',
            filter: 'blur(32px)',
          }}
        />
      )}
      <div className="font-grotesk relative mx-auto grid w-full max-w-xl grid-rows-[1fr_auto_1fr] items-stretch gap-6 lg:max-w-none lg:grid-cols-3 lg:grid-rows-[max-content_1fr] lg:gap-y-0 xl:gap-x-8">
        {showShapes && (
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <ScrollParallax isAbsolutelyPositioned>
              <div className="absolute top-1/5 -left-4 sm:top-1/7 xl:top-0">
                <Image src={shape1} alt="" width={78} height={78} className="-rotate-20" />
              </div>
              <div className="absolute top-1/2 -right-4">
                <Image src={shape1} alt="" width={78} height={78} className="-rotate-20" />
              </div>
            </ScrollParallax>
          </div>
        )}

        {pricingPlans.map((basePlan) => {
          const plan = applyPricingOffers(basePlan, offers);
          const isCurrentSubscription =
            isAuthenticated && hasActiveSubscription && plan.type === 'subscription';
          const href =
            plan.type === 'free'
              ? isAuthenticated
                ? '/dashboard'
                : '/sign-up'
              : !isAuthenticated
                ? '/sign-in?callbackUrl=%2Fpricing'
                : undefined;

          return (
            <PricingCard
              key={plan.type}
              plan={plan}
              isPending={isPending}
              href={href}
              ctaLabel={
                isCurrentSubscription
                  ? 'Zarządzaj subskrypcją'
                  : isAuthenticated && plan.type === 'free'
                    ? 'Przejdź do pulpitu'
                    : plan.ctaLabel
              }
              onSelect={() => {
                if (isPending || plan.type === 'free') return;
                if (isCurrentSubscription) {
                  handleCustomerPortal();
                } else {
                  handleCheckout(plan.priceId, plan.type);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
