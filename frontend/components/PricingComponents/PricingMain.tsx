'use client';

import { shape1 } from '@/app/constants';
import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import Section from '@/components/SupportComponents/Section';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { ScrollParallax } from 'react-just-parallax';
import Copy from '../SupportComponents/Copy';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

// WAŻNE: Podmień te Price ID na prawdziwe ze Stripe Dashboard!
// Test Mode Price IDs - przykłady (MUSISZ ZMIENIĆ NA SWOJE!)
const pricingPlans = [
  {
    name: 'Starter',
    description: 'Perfect for getting started with our platform',
    price: 29,
    tokens: 1000 as number | string,
    priceId: 'price_1S8kOELs2ndSVWb2t6bhwwwC', // <- PODMIEŃ NA SWÓJ PRICE ID!
    features: [
      '1,000 tokens included',
      'Basic access to AI models',
      'Up to 5 requests per day',
      'Standard response time',
    ],
    popular: false,
  },
  {
    name: 'Growth',
    description: 'The best choice for scaling your projects',
    price: 32,
    tokens: 5000 as number | string,
    priceId: 'price_1S8kP9Ls2ndSVWb27z6i7v5v', // <- PODMIEŃ NA SWÓJ PRICE ID!
    features: [
      '5,000 tokens included',
      'Full access to all AI models',
      'Unlimited daily requests',
      'Priority response time',
      'Export results in multiple formats',
    ],
    popular: true,
  },
  {
    name: 'Unlimited',
    description: 'Unlimited tokens and premium experience for personal use',
    price: 48,
    tokens: 'Unlimited' as number | string,
    priceId: 'price_1S8kPQLs2ndSVWb2LnWNxBjo', // <- PODMIEŃ NA SWÓJ PRICE ID!
    features: [
      'Unlimited tokens for one user',
      'Access to all advanced AI models',
      'Dedicated premium support',
      'Fastest response time',
      'Personalized onboarding assistance',
    ],
    popular: false,
  },
];

const PricingMain = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const router = useRouter();

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Funkcja pomocnicza do sprawdzenia statusu tokenów
  const checkTokenBalance = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://vocare-staging-e568.up.railway.app'}/api/Billing/get-token-balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Current token balance:', data.tokenBalance);
        // Możesz wyświetlić to gdzieś w UI
      }
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
    }
  };

  // Funkcja do sprawdzania statusu subskrypcji
  const checkSubscriptionStatus = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://vocare-staging-e568.up.railway.app'}/api/Billing/subscription-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.subscriptionStatus);
        console.log('Subscription status:', data);
      } else if (response.status === 404) {
        // User nie ma jeszcze billing info - to OK
        setSubscriptionStatus('None');
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      setSubscriptionStatus('None');
    }
  };

  // Funkcja do otwierania Customer Portal
  const openCustomerPortal = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in first');
      return;
    }

    setIsPortalLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://vocare-staging-e568.up.railway.app'}/api/Billing/customer-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          toast.error('No subscription found', {
            description: 'You need to purchase a plan first before managing it.',
          });
        } else {
          throw new Error(errorData.error || 'Failed to open customer portal');
        }
        return;
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('No portal URL received');
      }

      toast.success('Opening subscription manager...');

      // Przekieruj do Stripe Customer Portal
      setTimeout(() => {
        window.location.href = data.url;
      }, 500);
    } catch (error) {
      console.error('Portal error:', error);

      if (error instanceof Error) {
        if (error.message.includes('unauthorized') || error.message.includes('401')) {
          toast.error('Session expired', {
            description: 'Please sign in again.',
            action: {
              label: 'Sign In',
              onClick: () => {
                localStorage.removeItem('token');
                router.push('/sign-in');
              },
            },
          });
        } else {
          toast.error('Failed to open subscription manager', {
            description: error.message || 'Please try again.',
          });
        }
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Funkcja do obsługi zakupu
  const handlePurchase = async (priceId: string, planName: string) => {
    console.log('🛒 Purchase initiated:', { priceId, planName });

    // Sprawdź czy Price ID nie jest placeholder
    if (priceId.includes('xxx') || priceId.includes('yyy') || priceId.includes('zzz')) {
      toast.error('Configuration needed', {
        description: 'Price IDs need to be configured in Stripe Dashboard first!',
      });
      console.error('❌ Price ID is still a placeholder! Replace it with real Stripe Price ID');
      return;
    }

    // Sprawdź czy użytkownik jest zalogowany
    if (!isAuthenticated) {
      toast.error('Please sign in first', {
        description: 'You need to be logged in to purchase tokens.',
        action: {
          label: 'Sign In',
          onClick: () => router.push('/sign-in'),
        },
      });
      return;
    }

    setIsLoading(true);
    setSelectedPriceId(priceId);

    try {
      const token = localStorage.getItem('token');

      // Wywołanie do backendu aby utworzyć sesję Stripe Checkout
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://vocare-staging-e568.up.railway.app'}/api/Billing/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priceId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('No checkout URL received');
      }

      // Zapisz informację o rozpoczętej płatności (opcjonalne)
      sessionStorage.setItem(
        'pendingPurchase',
        JSON.stringify({
          priceId,
          planName,
          timestamp: new Date().toISOString(),
        })
      );

      // Przekieruj do Stripe Checkout
      toast.success('Redirecting to payment...', {
        description: `You're purchasing the ${planName} plan`,
      });

      // Małe opóźnienie dla lepszego UX
      setTimeout(() => {
        window.location.href = data.url;
      }, 500);
    } catch (error) {
      console.error('Payment error:', error);

      // Obsługa różnych typów błędów
      if (error instanceof Error) {
        if (error.message.includes('unauthorized') || error.message.includes('401')) {
          toast.error('Session expired', {
            description: 'Please sign in again to continue.',
            action: {
              label: 'Sign In',
              onClick: () => {
                localStorage.removeItem('token');
                router.push('/sign-in');
              },
            },
          });
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Connection error', {
            description: 'Unable to connect to the payment server. Please try again.',
          });
        } else {
          toast.error('Payment initialization failed', {
            description: error.message || 'Something went wrong. Please try again.',
          });
        }
      } else {
        toast.error('Unexpected error', {
          description: 'Please try again or contact support.',
        });
      }
    } finally {
      setIsLoading(false);
      setSelectedPriceId(null);
    }
  };

  // Wywołaj funkcje po zalogowaniu
  useEffect(() => {
    if (isAuthenticated) {
      checkTokenBalance();
      checkSubscriptionStatus();
    }
  }, [isAuthenticated]);

  return (
    <Section
      className="relative -mt-[5.25rem] pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="pricing"
    >
      <div className="main-font-color relative flex flex-col items-center justify-center max-lg:overflow-x-hidden xl:mx-10 xl:border">
        <GridBackgroundDemo />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center">
          <Copy>
            <h1 className="font-poppins text-color mt-10 text-center text-4xl font-bold md:text-[4rem] xl:leading-[0.8]">
              Tailored to
              <br />
              your needs
            </h1>
          </Copy>

          {/* Sekcja statusu użytkownika */}
          {!isAuthenticated ? (
            <div className="mt-4 mb-6 rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please{' '}
                <button
                  onClick={() => router.push('/sign-in')}
                  className="font-semibold underline hover:no-underline"
                >
                  sign in
                </button>{' '}
                to purchase tokens
              </p>
            </div>
          ) : (
            <div className="mt-4 mb-6 flex flex-col items-center gap-4">
              {/* Info o statusie subskrypcji */}
              {subscriptionStatus && subscriptionStatus !== 'None' && (
                <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Current subscription:{' '}
                    <span className="font-semibold">{subscriptionStatus}</span>
                  </p>
                </div>
              )}

              {/* Przycisk zarządzania subskrypcją */}
              {subscriptionStatus && subscriptionStatus !== 'None' && (
                <Button
                  onClick={openCustomerPortal}
                  disabled={isPortalLoading}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  {isPortalLoading ? (
                    <>
                      <Image
                        src="/svg/loader.svg"
                        alt="loader"
                        width={16}
                        height={16}
                        className="animate-spin"
                      />
                      Opening...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Manage Subscription
                    </>
                  )}
                </Button>
              )}

              {/* Info o braku subskrypcji */}
              {subscriptionStatus === 'None' && (
                <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Purchase any plan to manage your subscription later
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="font-poppins mt-10 mb-10 grid gap-8 px-4 md:grid-cols-3 md:px-6 xl:mt-18">
            <ScrollParallax isAbsolutelyPositioned zIndex={20}>
              <div className="absolute top-1/7 -left-4 z-20 xl:top-0">
                <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
              </div>
              <div className="absolute bottom-20 left-0 z-20 xl:bottom-0">
                <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
              </div>
              <div className="absolute top-1/2 -right-4 z-20">
                <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
              </div>
            </ScrollParallax>

            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`z-30 flex flex-col justify-between rounded-lg border bg-[#f3f3f3] p-6 dark:border-[0.5px] dark:bg-[#0f1010] ${
                  plan.popular ? 'border-primary ring-primary/20 ring-2' : 'border-gray-200'
                } ${index === 1 ? 'md:origin-bottom md:scale-y-105 md:transform' : ''}`}
              >
                <div>
                  {plan.popular && (
                    <div className="bg-primary text-primary-foreground mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold">
                      Most popular
                    </div>
                  )}
                  <h3 className="mb-2 text-2xl font-semibold">{plan.name}</h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">{plan.description}</p>
                  <div className="mb-6 text-4xl font-bold">
                    ${plan.price}
                    <span className="text-xl font-normal text-gray-600 dark:text-gray-400">
                      /{typeof plan.tokens === 'number' ? `${plan.tokens} tokens` : plan.tokens}
                    </span>
                  </div>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
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
                  className="group mt-auto h-10 w-full rounded-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handlePurchase(plan.priceId, plan.name)}
                  disabled={isLoading && selectedPriceId === plan.priceId}
                >
                  {isLoading && selectedPriceId === plan.priceId ? (
                    <>
                      <Image
                        src="/svg/loader.svg"
                        alt="loader"
                        width={20}
                        height={20}
                        className="mr-2 animate-spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      Buy {plan.name}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default PricingMain;
