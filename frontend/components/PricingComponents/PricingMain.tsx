'use client';

import {
  circle_pricing,
  curve_pricing,
  shape1,
  square_pricing,
  trapez_pricing,
} from '@/app/constants';
import Section from '@/components/SupportComponents/Section';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollParallax } from 'react-just-parallax';
import Copy from '../SupportComponents/Copy';
import { Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type PlanType = 'tokens' | 'subscription' | 'individual';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://vocare-staging-e568.up.railway.app';

const pricingPlans = [
  {
    name: 'Personal',
    description: 'Perfect for getting started with following your career.',
    price: 9,
    tokens: 500 as number | string,
    priceId: 'price_1S8kOELs2ndSVWb2t6bhwwwC',
    type: 'tokens' as PlanType,
    features: [
      '500 tokens included',
      'Personal career guidance',
      'Personalized career path proposals',
      'Market insights for your careers',
    ],
    popular: false,
  },
  {
    name: 'Growth',
    description: 'The best choice for scaling your projects.',
    price: 32,
    tokens: 5000 as number | string,
    priceId: 'price_1S8kP9Ls2ndSVWb27z6i7v5v',
    type: 'tokens' as PlanType,
    features: [
      'Unlimited access',
      'Personal career guidance',
      'Personalized career path proposals',
      'Market insights for your careers',
    ],
    popular: true,
  },
  {
    name: 'Extras',
    description: 'Unlimited tokens and premium experience for personal use.',
    price: 48,
    tokens: 'Unlimited' as number | string,
    priceId: 'price_1S9q33Ls2ndSVWb2KeB4Y3AD',
    type: 'individual' as PlanType,
    features: [
      'CV review by career expert',
      'Optizimazation for resume',
      '5 personalized career paths',
      'Response within 48 hours',
    ],
    popular: false,
  },
] as const;

const PricingMain = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsAuthenticated(!!token);
  }, []);

  // Helpers
  const checkTokenBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/Billing/get-token-balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Current token balance:', data.tokenBalance);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch token balance:', error);
    }
  }, [isAuthenticated]);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/Billing/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data.subscriptionStatus);
      } else if (res.status === 404) {
        setSubscriptionStatus('None');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch subscription status:', error);
      setSubscriptionStatus('None');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void checkTokenBalance();
      void checkSubscriptionStatus();
    }
  }, [isAuthenticated, checkSubscriptionStatus, checkTokenBalance]);

  const openCustomerPortal = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/Billing/customer-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 404) {
          toast.error('No billing information found', {
            description: 'Make a purchase first to access billing portal.',
          });
        } else if (res.status === 400 && errorData.error?.includes('customer')) {
          toast.error('Billing setup needed', {
            description: 'Please make a purchase first to set up your billing account.',
          });
        } else {
          throw new Error(errorData.error || 'Failed to open customer portal');
        }
        return;
      }

      const data = await res.json();
      if (!data.url) throw new Error('No portal URL received');

      toast.success('Opening billing portal...');
      window.location.href = data.url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';

      if (message.includes('401')) {
        toast.error('Session expired', {
          description: 'Please sign in again.',
          action: { label: 'Sign In', onClick: () => router.push('/sign-in') },
        });
      } else {
        toast.error('Failed to open billing portal', {
          description: message || 'Please try again.',
        });
      }
    }
  };

  const handlePurchase = async (priceId: string, planName: string, planType: PlanType) => {
    // Walidacje
    if (priceId.includes('xxx') || priceId.includes('yyy') || priceId.includes('zzz')) {
      toast.error('Configuration needed', {
        description: 'Replace Price IDs with real Stripe Price IDs!',
      });
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in first', {
        description: `You need to be logged in to purchase ${
          planType === 'subscription' ? 'a subscription' : 'tokens'
        }.`,
        action: { label: 'Sign In', onClick: () => router.push('/sign-in') },
      });
      return;
    }

    if (planType === 'subscription' && subscriptionStatus === 'Active') {
      toast.error('Already subscribed', {
        description:
          'You already have an active subscription. Use "Manage Billing" to change plans.',
        action: { label: 'Manage Billing', onClick: () => openCustomerPortal() },
      });
      return;
    }

    setIsLoading(true);
    setSelectedPriceId(priceId);

    try {
      const token = localStorage.getItem('token');
      const endpoint =
        planType === 'subscription'
          ? '/api/Billing/create-subscription-checkout'
          : '/api/Billing/create-checkout-session';

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await res.json();
      if (!data.url) throw new Error('No checkout URL received');

      // zapamiętaj pending
      sessionStorage.setItem(
        'pendingPurchase',
        JSON.stringify({
          priceId,
          planName,
          planType,
          timestamp: new Date().toISOString(),
        })
      );

      toast.success('Redirecting to payment...', {
        description:
          planType === 'subscription'
            ? `Setting up ${planName} subscription`
            : `Purchasing ${planName} tokens`,
      });

      window.location.href = data.url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';

      if (message.includes('401')) {
        toast.error('Session expired', {
          description: 'Please sign in again to continue.',
          action: { label: 'Sign In', onClick: () => router.push('/sign-in') },
        });
      } else {
        toast.error('Payment initialization failed', {
          description: message || 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
      setSelectedPriceId(null);
    }
  };

  return (
    <Section
      className="relative -mt-[5.25rem] pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="pricing"
    >
      <div className="main-font-color relative flex flex-col items-center justify-center max-lg:overflow-x-hidden xl:mx-10 xl:border">
        <div
          className={cn(
            'absolute inset-0',
            '[background-size:90px_90px]',
            '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
            'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
            '[mask-image:radial-gradient(ellipse_at_center,white_0%,transparent_60%)]',
            '[-webkit-mask-image:radial-gradient(ellipse_at_center,white_0%,transparent_60%)]',
            '[mask-size:200%_200%]',
            '[mask-position:center]',
            '[mask-repeat:no-repeat]'
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_bottom,transparent_40%,black_70%)] dark:bg-[#0f1014]"></div>
        <div className="font-korbin relative mx-auto flex max-w-7xl flex-col items-center justify-center">
          <div className="relative flex flex-col items-center justify-center sm:mt-8">
            <p className="mb-4 font-bold text-gray-400 sm:mb-6">Pricing</p>
            <Copy>
              <h1 className="text-color text-center text-3xl font-bold md:text-[3rem] xl:leading-[0.8]">
                <span>Tailored to </span>
                <span className="relative inline-block pb-4 md:pb-6">
                  your needs
                  <Image
                    src={curve_pricing}
                    alt="line"
                    width={224}
                    height={124}
                    className="pointer-events-none absolute bottom-2 left-1/2 h-auto w-[85%] max-w-[320px] -translate-x-1/2 md:max-w-[360px]"
                  />
                </span>
              </h1>
            </Copy>
            <p className="text-md mt-4 w-3/4 text-center font-light text-gray-300 sm:mt-2 sm:text-lg">
              Free start. Choose a token plan when you’re ready. No longterm contracts. No credit
              card to try.
            </p>
          </div>

          <div className="relative mt-6 mb-10 w-full px-4 md:px-6">
            {/* Subtle purple circular glow under the cards */}
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
            <div className="font-poppins grid items-end gap-8 md:grid-cols-3">
              <ScrollParallax isAbsolutelyPositioned zIndex={20}>
                <div className="absolute top-1/5 -left-4 z-20 sm:top-1/7 xl:top-0">
                  <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
                </div>
                <div className="absolute top-1/2 -right-4 z-20">
                  <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
                </div>
              </ScrollParallax>

              {/* Personal */}
              <div className="relative z-30 flex h-full flex-col justify-between rounded-[24px] border bg-[linear-gradient(to_top_right,rgba(9,13,22,1)_20%,rgba(9,13,22,0.2)_100%)] p-6 backdrop-blur-md sm:h-[87%] dark:border-gray-500/40">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/25 via-white/10 to-transpearent dark:from-white/10 dark:via-white/5"
                />
                <div className="relative">
                  <div className="mb-4 flex h-[40px] w-[40px] items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
                    <Image src={circle_pricing} alt="square" width={32} height={32} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Personal
                  </h3>
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                                        Perfect for finding your career.

                  </p>
                  <div className="font-poppins mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                    45<sup className="text-sm align-super">zł</sup>
                    <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                      /500 tokens
                    </span>
                  </div>
                  <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                    {[
                      '500 tokens included',
                      'Personal career guidance',
                      'Personalized career path proposals',
                      'Market insights for your careers',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg
                          className="mr-2 h-5 w-5 text-[#915EFF]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="mt-auto h-12 w-full rounded-full font-bold"
                  variant="outline"
                  onClick={() =>
                    handlePurchase(
                      pricingPlans[0].priceId,
                      pricingPlans[0].name,
                      pricingPlans[0].type
                    )
                  }
                  disabled={isLoading && selectedPriceId === pricingPlans[0].priceId}
                >
                  {isLoading && selectedPriceId === pricingPlans[0].priceId
                    ? 'Processing...'
                    : `Buy ${pricingPlans[0].name}`}
                </Button>
              </div>

              {/* Growth (Most popular) */}
              <div className="relative rounded-[28px] bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] px-1 pt-16 pb-1">
                <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                  <Undo2 className="h-5 w-5 -rotate-90 text-white" />
                  <span className="text-lg font-semibold text-white">Best Deal</span>
                </div>
                <div className="relative z-30 flex flex-col justify-between rounded-[24px] border p-6 backdrop-blur-md dark:border-gray-500/40 dark:bg-[#090d16]">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/25 via-white/10 to-transparent dark:from-white/10 dark:via-white/5"
                  />
                  <div className="relative">
                    <div className="relative flex w-full flex-row items-start justify-between">
                      <div className="mb-4 flex h-[40px] w-[40px] items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
                        <Image src={square_pricing} alt="square" width={32} height={32} />
                      </div>
                      <div className="font-poppins flex h-[32px] w-fit items-center justify-center rounded-full bg-[#818fff] px-4 py-2 text-xs font-semibold text-white">
                        <p>Save 35%</p>
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Growth
                    </h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                      The best choice for scaling your career.
                    </p>
                    <div className="font-poppins mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                    29<sup className="text-sm align-super">zł</sup>
                    <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                      /month
                    </span>
                  </div>
                    <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                      {[
                        'Unlimited access',
                        'Personal career guidance',
                        'Personalized career path proposals',
                        'Market insights for your careers',
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <svg
                            className="mr-2 h-5 w-5 text-[#915EFF]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="relative mt-auto h-12 w-full rounded-full bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] font-bold text-white"
                    variant="default"
                    onClick={() =>
                      handlePurchase(
                        pricingPlans[1].priceId,
                        pricingPlans[1].name,
                        pricingPlans[1].type
                      )
                    }
                    disabled={isLoading && selectedPriceId === pricingPlans[1].priceId}
                  >
                    {isLoading && selectedPriceId === pricingPlans[1].priceId
                      ? 'Processing...'
                      : `Subscribe ${pricingPlans[1].name}`}
                  </Button>
                </div>
              </div>

              {/* Extras */}
              <div className="relative z-30 flex h-full flex-col justify-between rounded-[24px] border bg-[linear-gradient(to_top_right,rgba(9,13,22,1)_20%,rgba(9,13,22,0.2)_100%)] p-6 backdrop-blur-md sm:h-[87%] dark:border-gray-500/40">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/25 via-white/10 to-transparent dark:from-white/10 dark:via-white/5"
                />
                <div className="relative">
                  <div className="relative flex w-full flex-row items-start justify-between">
                    <div className="mb-4 flex h-[40px] w-[40px] items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
                      <Image
                        src={trapez_pricing}
                        alt="square"
                        width={32}
                        height={32}
                        className="scale-80"
                      />
                    </div>
                    <div className="font-poppins flex h-[32px] w-fit items-center justify-center rounded-full bg-[#818fff] px-4 py-2 text-xs font-semibold text-white">
                      <p>Save 65%</p>
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Individual
                  </h3>
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                    Your career advisored by our experts.
                  </p>
                  <div className="font-poppins mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                    99<sup className="text-sm align-super">zł</sup>
                    {/* <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                      /once
                    </span> */}
                  </div>
                  <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                    {[
                      'CV review by career expert',
                      'Optizimazation for resume',
                      '5 personalized career paths',
                      'Response within 48 hours',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg
                          className="mr-2 h-5 w-5 text-[#915EFF]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="relative mt-auto h-12 w-full rounded-full font-bold"
                  variant="outline"
                  onClick={() =>
                    handlePurchase(
                      pricingPlans[2].priceId,
                      pricingPlans[2].name,
                      pricingPlans[2].type
                    )
                  }
                  disabled={isLoading && selectedPriceId === pricingPlans[2].priceId}
                >
                  {isLoading && selectedPriceId === pricingPlans[2].priceId
                    ? 'Processing...'
                    : `Contact us`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default PricingMain;
