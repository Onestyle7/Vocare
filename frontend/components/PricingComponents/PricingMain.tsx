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

// Konfiguracja planów z Price ID z Stripe Dashboard
const pricingPlans = [
  {
    name: 'Starter',
    description: 'Perfect for trying out Vocare',
    price: 10,
    tokens: 50,
    priceId: 'price_XXXXX', // TODO: Podmień na rzeczywisty Price ID ze Stripe
    features: ['50 AI tokens', 'Basic support', 'Access to all features', 'No expiration date'],
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Most popular choice for professionals',
    price: 25,
    tokens: 150,
    priceId: 'price_YYYYY', // TODO: Podmień na rzeczywisty Price ID ze Stripe
    features: [
      '150 AI tokens',
      'Priority support',
      'Access to all features',
      'No expiration date',
      'Bonus 20% extra tokens',
    ],
    popular: true,
  },
  {
    name: 'Business',
    description: 'Best value for heavy users',
    price: 50,
    tokens: 350,
    priceId: 'price_ZZZZZ', // TODO: Podmień na rzeczywisty Price ID ze Stripe
    features: [
      '350 AI tokens',
      'Premium support',
      'Access to all features',
      'No expiration date',
      'Bonus 40% extra tokens',
    ],
    popular: false,
  },
];

const PricingMain = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Funkcja do obsługi zakupu
  const handlePurchase = async (priceId: string, planName: string) => {
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

  // Funkcja pomocnicza do sprawdzenia statusu tokenów (opcjonalne)
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

  useEffect(() => {
    checkTokenBalance();
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

          {/* Opcjonalnie: Pokaż status logowania */}
          {!isAuthenticated && (
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
                      /{plan.tokens} tokens
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
