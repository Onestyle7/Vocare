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
import { ArrowRight, Zap, Newspaper } from 'lucide-react';

// WAŻNE: Podmień te Price ID na prawdziwe ze Stripe Dashboard!
const pricingPlans = [
  {
    name: 'Starter',
    description: 'Perfect for getting started with our platform',
    price: 29,
    tokens: 1000 as number | string,
    priceId: 'price_1S8kOELs2ndSVWb2t6bhwwwC', // <- Token pack price ID
    type: 'tokens' as 'tokens' | 'subscription',
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
    priceId: 'price_1S8kP9Ls2ndSVWb27z6i7v5v', // <- Token pack price ID
    type: 'tokens' as 'tokens' | 'subscription',
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
    name: 'Unlimited subscription',
    description: 'Monthly subscription with unlimited access',
    price: 39,
    tokens: 'Unlimited' as number | string,
    priceId: 'price_1S9q33Ls2ndSVWb2KeB4Y3AD', // <- Subscription price ID (UTWÓRZ NOWY!)
    type: 'subscription' as 'tokens' | 'subscription',
    features: [
      'Unlimited tokens every month',
      'Access to all advanced AI models',
      'Dedicated premium support',
      'Fastest response time',
      'Personalized onboarding assistance',
      'Cancel anytime',
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

  // 🐛 DEBUG: Stan dla button generowania newsów
  const [isGeneratingNews, setIsGeneratingNews] = useState(false);

  const router = useRouter();

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // 🐛 DEBUG: Funkcja do generowania newsów
  const handleGenerateNews = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in first', {
        description: 'You need to be logged in to generate news.',
      });
      return;
    }

    setIsGeneratingNews(true);

    try {
      const token = localStorage.getItem('token');

      console.log('🚀 Calling generate-now endpoint...');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://vocare-staging-e568.up.railway.app'}/api/MarketNews/generate-now`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate news`);
      }

      const data = await response.json();
      console.log('✅ Success response:', data);

      toast.success('News generated successfully! 🎉', {
        description: `New article created with ID: ${data.newsId?.substring(0, 8)}...`,
        duration: 5000,
        action: {
          label: 'View News',
          onClick: () => {
            // Możesz dodać redirect do strony newsów jeśli masz
            console.log('Redirecting to news page...');
            // router.push('/news');
          },
        },
      });
    } catch (error) {
      console.error('💥 Generate news error:', error);

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
        } else if (error.message.includes('429')) {
          toast.error('Rate limit exceeded', {
            description: 'Please wait a moment before generating another news.',
          });
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Connection error', {
            description: 'Unable to connect to the server. Please try again.',
          });
        } else {
          toast.error('Failed to generate news', {
            description: error.message || 'Something went wrong. Check console for details.',
          });
        }
      } else {
        toast.error('Unexpected error', {
          description: 'Please try again or contact support.',
        });
      }
    } finally {
      setIsGeneratingNews(false);
    }
  };

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
          toast.error('No billing information found', {
            description: 'You need to make a purchase first to access billing portal.',
          });
        } else if (response.status === 400 && errorData.error?.includes('customer')) {
          toast.error('Billing setup needed', {
            description: 'Please make a purchase first to set up your billing account.',
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

      toast.success('Opening billing portal...');

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
          toast.error('Failed to open billing portal', {
            description: error.message || 'Please try again.',
          });
        }
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Funkcja do obsługi zakupu - NOWA LOGIKA!
  const handlePurchase = async (
    priceId: string,
    planName: string,
    planType: 'tokens' | 'subscription'
  ) => {
    console.log('🛒 Purchase initiated:', { priceId, planName, planType });

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
        description: `You need to be logged in to purchase ${planType === 'subscription' ? 'a subscription' : 'tokens'}.`,
        action: {
          label: 'Sign In',
          onClick: () => router.push('/sign-in'),
        },
      });
      return;
    }

    // Sprawdź czy ma już aktywną subskrypcję
    if (planType === 'subscription' && subscriptionStatus === 'Active') {
      toast.error('Already subscribed', {
        description:
          'You already have an active subscription. Use "Manage Billing" to change plans.',
        action: {
          label: 'Manage Billing',
          onClick: () => openCustomerPortal(),
        },
      });
      return;
    }

    setIsLoading(true);
    setSelectedPriceId(priceId);

    try {
      const token = localStorage.getItem('token');

      // ✅ WYBIERZ WŁAŚCIWY ENDPOINT w zależności od typu
      const endpoint =
        planType === 'subscription'
          ? '/api/Billing/create-subscription-checkout'
          : '/api/Billing/create-token-checkout';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://vocare-staging-e568.up.railway.app'}${endpoint}`,
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

      // Zapisz informację o rozpoczętej płatności
      sessionStorage.setItem(
        'pendingPurchase',
        JSON.stringify({
          priceId,
          planName,
          planType,
          timestamp: new Date().toISOString(),
        })
      );

      // Różne komunikaty dla tokenów vs subskrypcji
      toast.success('Redirecting to payment...', {
        description:
          planType === 'subscription'
            ? `Setting up ${planName} subscription`
            : `Purchasing ${planName} tokens`,
      });

      setTimeout(() => {
        window.location.href = data.url;
      }, 500);
    } catch (error) {
      console.error('Payment error:', error);

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

        {/* 🐛 DEBUG: Button do generowania newsów - w prawym górnym rogu */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={handleGenerateNews}
            disabled={isGeneratingNews}
            className="border-2 border-orange-400 bg-gradient-to-r from-orange-500 to-red-600 px-3 py-2 text-sm text-white shadow-lg hover:from-orange-600 hover:to-red-700"
            size="sm"
          >
            {isGeneratingNews ? (
              <>
                <Image
                  src="/svg/loader.svg"
                  alt="loader"
                  width={14}
                  height={14}
                  className="mr-2 animate-spin"
                />
                Generating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                🐛 Generate News
              </>
            )}
          </Button>
        </div>

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
                to purchase tokens or subscribe
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

              {/* Przycisk Customer Portal */}
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
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    Manage Billing
                  </>
                )}
              </Button>

              {/* Info pomocnicza */}
              <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Manage your payment methods, view invoices, and billing history
                </p>
              </div>
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

                  {/* Badge dla subskrypcji */}
                  {plan.type === 'subscription' && (
                    <div className="mb-4 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Monthly Subscription
                    </div>
                  )}

                  <h3 className="mb-2 text-2xl font-semibold">{plan.name}</h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">{plan.description}</p>
                  <div className="mb-6 text-4xl font-bold">
                    ${plan.price}
                    <span className="text-xl font-normal text-gray-600 dark:text-gray-400">
                      {plan.type === 'subscription'
                        ? '/month'
                        : `/${typeof plan.tokens === 'number' ? `${plan.tokens} tokens` : plan.tokens}`}
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
                  onClick={() => handlePurchase(plan.priceId, plan.name, plan.type)}
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
                      {plan.type === 'subscription' ? 'Subscribe to' : 'Buy'} {plan.name}
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
