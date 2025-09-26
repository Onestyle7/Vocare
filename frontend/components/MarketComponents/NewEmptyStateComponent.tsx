'use client';

import { useEffect, useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import CustomButton from '../ui/CustomButton';
import SpotlightCard from '../SpotlightCard/SpotlightCard';
import AnimatedContent from '../AnimatedContent/AnimatedContent';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { upper_arrow, star_generate } from '@/app/constants';
import Section from '../SupportComponents/Section';
import { toast } from 'sonner';

interface EmptyStateProps {
  onGenerateAnalysis: () => Promise<void>;
  isLoading: boolean;
  tokenBalance: number | null | string;
  isBalanceLoading: boolean;
  subscriptionStatus: string | null;
  hasActiveSubscription: boolean;
  refresh: () => void;
}

const NewEmptyStateComponent = ({
  onGenerateAnalysis,
  isLoading,
  tokenBalance,
  isBalanceLoading,
  subscriptionStatus,
  hasActiveSubscription,
  refresh,
}: EmptyStateProps) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const requiredTokens = 5;

  const numericTokenBalance = useMemo(
    () => (typeof tokenBalance === 'number' ? tokenBalance : null),
    [tokenBalance]
  );
  const canGenerateWithTokens = useMemo(() => {
    if (numericTokenBalance === null) return false;
    return numericTokenBalance >= requiredTokens;
  }, [numericTokenBalance]);
  const shouldShowPricingCta =
    !hasActiveSubscription &&
    !isBalanceLoading &&
    numericTokenBalance !== null &&
    numericTokenBalance < requiredTokens;
  const disableGenerateAction =
    isLoading || (!hasActiveSubscription && (isBalanceLoading || !canGenerateWithTokens));

  useEffect(() => {
    const checkRecommendations = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        await axios.get(`${API_URL}/api/AI/last-recommendation`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setHasRecommendations(true);
      } catch (err) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 404) {
          setHasRecommendations(false);
        }
      }
    };

    checkRecommendations();
  }, [API_URL]);

  const handleOpenGenerateDialog = () => {
    if (hasActiveSubscription) {
      toast.success('Subscription access active', {
        description: 'Unlimited market analyses are included in your plan.',
        id: 'subscription-access-market',
      });
      setIsConfirmDialogOpen(true);
      return;
    }

    if (isBalanceLoading) {
      toast.info('Checking your credits...', {
        id: 'balance-check',
        duration: 2000,
      });
      setIsConfirmDialogOpen(true);
      return;
    }

    if (numericTokenBalance === null) {
      toast.error('Unable to verify credits', {
        description: 'Please refresh the balance and try again.',
      });
      refresh();
      return;
    }

    if (!canGenerateWithTokens) {
      toast.warning('Not enough credits', {
        description: `You need ${requiredTokens} credits to generate a new analysis.`,
        action: {
          label: 'View plans',
          onClick: () => router.push('/pricing'),
        },
      });
      return;
    }

    setIsConfirmDialogOpen(true);
  };

  const buttonContent = hasRecommendations ? (
    <CustomButton
      onClick={handleOpenGenerateDialog}
      disabled={isLoading}
      className="group font-poppins flex h-[56px] cursor-pointer items-center justify-center rounded-full bg-[#915EFF] px-6 text-[clamp(1rem,1vw,1.5rem)] font-medium text-white hover:bg-[#7b4ee0] xl:w-[280px]"
    >
      <span>{isLoading ? 'Generating...' : 'Generate analysis'}</span>
      <ArrowRight className="ml-4 scale-90 transition-transform duration-300 group-hover:translate-x-2" />
    </CustomButton>
  ) : (
    <CustomButton
      url="/assistant"
      className="group font-poppins flex h-[56px] cursor-pointer items-center justify-center rounded-full bg-[#915EFF] px-6 text-[clamp(1rem,1vw,1.5rem)] font-medium text-white hover:bg-[#7b4ee0] xl:w-[280px]"
    >
      <span>AI Career Adivsor</span>
      <ArrowRight className="ml-4 scale-90 transition-transform duration-300 group-hover:translate-x-2" />
    </CustomButton>
  );

  return (
    <Section
      className="relative -mt-[5.25rem] pt-[7.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="pricing"
    >
      <div className="mx-10 flex flex-col items-center space-y-10 lg:border-t">
        {/* Header */}
        <div className="mt-10 flex flex-col items-center justify-center">
          <h1 className="font-poppins text-3xl font-bold max-md:text-center">
            How to use AI Market analiser?
          </h1>
          <p className="font-poppins text-md mt-4 text-gray-500">It&apos;s that simple.</p>
        </div>

        {/* Cards */}
        <div className="flex flex-col max-lg:space-y-3 lg:flex-row lg:space-x-4">
          <AnimatedContent
            distance={150}
            direction="horizontal"
            reverse={false}
            duration={1.2}
            initialOpacity={0.2}
            animateOpacity
            scale={1}
            threshold={0.2}
            delay={0.3}
          >
            <SpotlightCard className="bg-muted h-[300px] w-[350px]">
              <div className="font-poppins flex h-full flex-col items-center justify-center">
                <div className="w-full items-center justify-start">
                  <p className="text-muted-foreground text-xl">1.</p>
                </div>
                <div className="mt-4 h-full w-full items-center justify-start">
                  <p className="text-muted-foreground text-lg">
                    Start by updating <b>Your profile</b>. Simply use the <i>profile</i> button
                  </p>
                </div>
                <div className="w-full">
                  <Link
                    href="/profile"
                    className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
                  >
                    Navigate to profile
                    <Image
                      src={upper_arrow}
                      alt="arrow"
                      width={24}
                      height={24}
                      className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                    />
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>

          <AnimatedContent
            distance={150}
            direction="horizontal"
            reverse={false}
            duration={1.2}
            initialOpacity={0.2}
            animateOpacity
            scale={1}
            threshold={0.2}
            delay={0.6}
          >
            <SpotlightCard className="bg-muted h-[300px] w-[350px]">
              <div className="font-poppins flex h-full flex-col items-center justify-center">
                <div className="w-full items-center justify-start">
                  <p className="text-muted-foreground text-xl">2.</p>
                </div>
                <div className="mt-4 h-full w-full items-center justify-start">
                  <p className="text-muted-foreground text-lg">
                    After updating Your profile, you&apos;ll gain access to every <br />{' '}
                    <b>AI tool</b> that Vocare offers.
                  </p>
                </div>
                <div className="w-full">
                  <Link
                    href="/profile"
                    className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
                  >
                    Learn how we protect data
                    <Image
                      src={upper_arrow}
                      alt="arrow"
                      width={24}
                      height={24}
                      className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                    />
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>

          <AnimatedContent
            distance={150}
            direction="horizontal"
            reverse={false}
            duration={1.2}
            initialOpacity={0.2}
            animateOpacity
            scale={1}
            threshold={0.2}
            delay={0.9}
          >
            <SpotlightCard className="bg-muted h-[300px] w-[350px]">
              <div className="font-poppins flex h-full flex-col items-center justify-center">
                <div className="w-full items-center justify-start">
                  <p className="text-muted-foreground text-xl">3.</p>
                </div>
                <div className="mt-4 h-full w-full items-center justify-start">
                  <p className="text-muted-foreground text-lg">
                    Use <b>AI Career Advisor</b> and generate market analysis based on the
                    recommended career paths.
                  </p>
                </div>
                <div className="w-full">
                  <Link
                    href="/profile"
                    className="text-md text-muted-foreground group flex flex-row items-center transition-all duration-300"
                  >
                    Navigate to AI Career Advisor
                    <Image
                      src={upper_arrow}
                      alt="arrow"
                      width={24}
                      height={24}
                      className="ml-1 scale-90 opacity-50 transition-transform duration-300 group-hover:translate-x-2 dark:invert"
                    />
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>
        </div>

        {/* Sekcja z przyciskiem pod kartami */}
        <div className="mt-8 flex w-full max-w-4xl flex-col items-center justify-center space-y-6">
          <div>{buttonContent}</div>
        </div>

        {/* Dialog potwierdzenia */}
        {hasRecommendations && (
          <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogContent className="font-poppins mx-auto max-w-md font-korbin">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center text-xl font-bold">
                  Generate market analysis?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  {hasActiveSubscription ? (
                    <span>
                      Included in your{' '}
                      <span className="text-[#915EFF] font-semibold">
                        {subscriptionStatus ?? 'Active'}
                      </span>{' '}
                      subscription. Tokens stay untouched.
                    </span>
                  ) : (
                    <span>
                      This will take <b className="text-[#915EFF]">{requiredTokens} credits</b> from your
                      account.
                    </span>
                  )}
                </AlertDialogDescription>

                <div className="mt-2 space-y-1 text-center text-sm">
                  <div>
                    Subscription status:{' '}
                    <span
                      className={`font-semibold ${
                        hasActiveSubscription ? 'text-emerald-400' : 'text-[#915EFF]'
                      }`}
                    >
                      {subscriptionStatus ? subscriptionStatus : 'None'}
                    </span>
                  </div>
                  <div>
                    Current balance:{' '}
                    <span className="font-bold">{isBalanceLoading ? '...' : tokenBalance}</span>
                  </div>
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="flex justify-center gap-4 sm:justify-center">
                <AlertDialogCancel
                  className="border-muted-foreground/20"
                  onClick={() => setIsConfirmDialogOpen(false)}
                >
                  Cancel
                </AlertDialogCancel>

                {shouldShowPricingCta ? (
                  <AlertDialogAction
                    className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                    onClick={() => {
                      toast.info("Let's pick a plan tailored to you.");
                      setIsConfirmDialogOpen(false);
                      router.push('/pricing');
                    }}
                  >
                    Get tokens
                    <Image src={star_generate} alt="star" width={16} height={16} />
                  </AlertDialogAction>
                ) : (
                  <AlertDialogAction
                    onClick={async () => {
                      await onGenerateAnalysis();
                      refresh();
                      setIsConfirmDialogOpen(false);
                    }}
                    className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                    disabled={disableGenerateAction}
                  >
                    {isLoading ? 'Generating...' : 'Generate'}
                    <Image src={star_generate} alt="star" width={16} height={16} />
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Section>
  );
};

export default NewEmptyStateComponent;
