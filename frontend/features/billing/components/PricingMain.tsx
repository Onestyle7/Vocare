'use client';

import { Undo2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { ScrollParallax } from 'react-just-parallax';
import { toast } from 'sonner';

import Section from '@/components/SupportComponents/Section';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/features/auth/components/AuthProvider';
import {
  circle_pricing,
  curve_pricing,
  shape1,
  square_pricing,
  trapez_pricing,
} from '@/features/marketing/constants/countries';
import { cn } from '@/lib/utils';

import Copy from '../../../components/SupportComponents/Copy';
import { pricingPlans } from '../constants';
import { BillingType } from '../dal/api';
import { useTokenBalanceContext } from './SubscriptionTokenProvider';

const PricingMain = () => {
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [individualDialogOpen, setIndividualDialogOpen] = useState(false);

  const { isAuthenticated } = useAuthContext();
  const { hasActiveSubscription, tokenBalance } = useTokenBalanceContext();

  const router = useRouter();
  const individualPlan = pricingPlans.find((plan) => plan.type === 'individual');

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

  const handlePurchase = async (priceId: string, BillingType: BillingType) => {
    // Walidacje
    if (BillingType === 'subscription' && subscriptionStatus === 'Active') {
      toast.error('Already subscribed', {
        description:
          'You already have an active subscription. Use "Manage Billing" to change plans.',
        action: { label: 'Manage Billing', onClick: () => openCustomerPortal() },
      });
      return;
    }

    setSelectedPriceId(priceId);

    try {
      const token = localStorage.getItem('token');
      const endpoint =
        BillingType === 'subscription'
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
      setSelectedPriceId(null);
    }
  };

  const handleIndividualProceed = () => {
    if (!individualPlan) return;
    setIndividualDialogOpen(false);
    void handlePurchase(individualPlan.priceId, individualPlan.name, individualPlan.type);
  };

  return (
    <>
      <Section
        className="relative -mt-21 pt-30"
        crosses
        crossesOffset="lg:translate-y-[7.5rem]"
        customPaddings
        id="pricing"
      >
        <div className="main-font-color relative flex flex-col items-center justify-center max-lg:overflow-x-hidden xl:mx-10 xl:border">
          <div
            className={cn(
              'absolute inset-0',
              'bg-size-[90px_90px]',
              'bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
              'dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
              'mask-[radial-gradient(ellipse_at_center,white_0%,transparent_60%)]',
              '[-webkit-mask-image:radial-gradient(ellipse_at_center,white_0%,transparent_60%)]',
              'mask-size-[200%_200%]',
              'mask-center',
              'mask-no-repeat'
            )}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white mask-[radial-gradient(ellipse_at_bottom,transparent_40%,black_70%)] dark:bg-[#0f1014]"></div>
          <div className="font-korbin relative mx-auto flex max-w-7xl flex-col items-center justify-center">
            <div className="relative flex flex-col items-center justify-center sm:mt-8">
              <Copy>
                <h1 className="text-color text-center text-3xl font-bold md:text-[3rem] xl:leading-[0.8]">
                  <span>Dopasowany pod </span>
                  <span className="relative inline-block pb-4 md:pb-6">
                    Ciebie
                    <Image
                      src={curve_pricing}
                      alt="line"
                      width={224}
                      height={124}
                      className="pointer-events-none absolute bottom-2 left-1/2 h-auto w-[85%] max-w-[320px] -translate-x-1/2 md:max-w-90"
                    />
                  </span>
                </h1>
              </Copy>
              <p className="text-md mt-4 w-3/4 text-center font-light text-gray-300 sm:mt-2 sm:text-lg">
                Darmowy start. Bez karty płatniczej.
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
              <div className="font-grotesk grid items-end gap-8 md:grid-cols-3">
                <ScrollParallax isAbsolutelyPositioned zIndex={20}>
                  <div className="absolute top-1/5 -left-4 z-20 sm:top-1/7 xl:top-0">
                    <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
                  </div>
                  <div className="absolute top-1/2 -right-4 z-20">
                    <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
                  </div>
                </ScrollParallax>

                {/* Personal */}
                <div className="relative z-30 flex h-full flex-col justify-between rounded-3xl border bg-[linear-gradient(to_top_right,rgba(9,13,22,1)_20%,rgba(9,13,22,0.2)_100%)] p-6 backdrop-blur-md sm:h-[87%] dark:border-gray-500/40">
                  <div
                    aria-hidden
                    className="to-transpearent pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-white/25 via-white/10 dark:from-white/10 dark:via-white/5"
                  />
                  <div className="relative">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
                      <Image src={circle_pricing} alt="square" width={32} height={32} />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Osobiste
                    </h3>
                    <p className="font-grotesk mb-4 text-gray-700 dark:text-gray-300">
                      Idealne do znalezienia swojej ścieżki zawodowej.
                    </p>
                    <div className="font-grotesk mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                      {pricingPlans[0].price}
                      <sup className="align-super text-sm">zł</sup>
                      <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                        /500 tokenów
                      </span>
                    </div>
                    <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                      {[
                        '500 tokenów w pakiecie',
                        'Indywidualne doradztwo kariery',
                        'Spersonalizowane propozycje ścieżek kariery',
                        'Analizy rynku pracy',
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
                    disabled={selectedPriceId === pricingPlans[0].priceId}
                  >
                    {selectedPriceId === pricingPlans[0].priceId ? 'Processing...' : `Wybierz plan`}
                  </Button>
                </div>

                {/* Growth (Most popular) */}
                <div className="relative rounded-[28px] bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] px-1 pt-16 pb-1">
                  <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                    <Undo2 className="h-5 w-5 -rotate-90 text-white" />
                    <span className="text-lg font-semibold text-white">Best Deal</span>
                  </div>
                  <div className="relative z-30 flex flex-col justify-between rounded-3xl border p-6 backdrop-blur-md dark:border-gray-500/40 dark:bg-[#090d16]">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-white/25 via-white/10 to-transparent dark:from-white/10 dark:via-white/5"
                    />
                    <div className="relative">
                      <div className="relative flex w-full flex-row items-start justify-between">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
                          <Image src={square_pricing} alt="square" width={32} height={32} />
                        </div>
                        <div className="font-grotesk flex h-8 w-fit items-center justify-center rounded-full bg-[#818fff] px-4 py-2 text-xs font-semibold text-white">
                          <p>Oszczędź 35%</p>
                        </div>
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Rozwój
                      </h3>
                      <p className="mb-4 text-gray-700 dark:text-gray-300">
                        Najlepszy wybór do rozwoju Twojej kariery.
                      </p>
                      <div className="font-grotesk mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                        {pricingPlans[1].price}
                        <sup className="align-super text-sm">zł</sup>
                        <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                          /miesiąc
                        </span>
                      </div>
                      <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                        {[
                          'Nielimitowany dostęp',
                          'Indywidualne doradztwo kariery',
                          'Spersonalizowane propozycje ścieżek kariery',
                          'Analizy rynku pracy dla Twoich kierunków kariery',
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
                      disabled={selectedPriceId === pricingPlans[1].priceId}
                    >
                      {selectedPriceId === pricingPlans[1].priceId
                        ? 'Processing...'
                        : `Zasubskrybuj`}
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
                      <div className="font-grotesk flex h-[32px] w-fit items-center justify-center rounded-full bg-[#818fff] px-4 py-2 text-xs font-semibold text-white">
                        <p>Oszczędź 65%</p>
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Indywidualne
                    </h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                      Twoja kariera prowadzona przez naszych ekspertów.
                    </p>
                    <div className="font-grotesk mb-6 text-4xl font-bold text-gray-900 dark:text-white">
                      {pricingPlans[2].price}
                      <sup className="align-super text-sm">zł</sup>
                      {/* <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
                      /once
                    </span> */}
                    </div>
                    <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
                      {[
                        'Analiza CV przez eksperta kariery',
                        'Optymalizacja CV',
                        '5 spersonalizowanych ścieżek kariery',
                        'Wyniki w ciągu 48 godzin',
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
                    onClick={() => {
                      if (!individualPlan) return;
                      setIndividualDialogOpen(true);
                    }}
                    disabled={!individualPlan || selectedPriceId === individualPlan.priceId}
                  >
                    {individualPlan && selectedPriceId === individualPlan.priceId
                      ? 'Processing...'
                      : `Skontaktuj się`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
      {individualPlan && (
        <AlertDialog open={individualDialogOpen} onOpenChange={setIndividualDialogOpen}>
          <AlertDialogContent className="font-grotesk max-w-md rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Proceed with payment?</AlertDialogTitle>
              <AlertDialogDescription>
                We&apos;ll reach out via <span className="font-bold text-[#818fff]">email</span> to
                the address associated with your payment once it comes through. <br />
                Do you want to continue to the secure checkout now?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-3 sm:flex-row">
              <AlertDialogCancel className="rounded-full px-6">Cancel</AlertDialogCancel>
              <AlertDialogAction className="rounded-full px-6" onClick={handleIndividualProceed}>
                Proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default PricingMain;
