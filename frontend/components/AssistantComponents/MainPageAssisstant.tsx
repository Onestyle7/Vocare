'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { UserProfile } from '@/lib/types/profile';
import { toast } from 'sonner';
import GenerateRecommendation from './GenerateRecommendationFail';
import { Separator } from '../ui/separator';
import { gsap } from 'gsap';
import CollapsibleButton from './CollapsibleButton';
import CareerPathSection from './CareerPathSection';
import CustomButton from '../ui/CustomButton';
import { GridBackgroundDemo } from '../MarketComponents/GridBackgroundDemo';
import { TerminalDemo } from '../MarketComponents/LoadingTerminal';
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
import Image from 'next/image';
import { star_generate } from '@/app/constants';
import { useTokenBalanceContext } from '@/lib/contexts/TokenBalanceContext';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { AiCareerResponse, CareerPath } from '@/lib/types/recommendation';
import Section from '../SupportComponents/Section';

export default function AssistantPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<AiCareerResponse | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { tokenBalance, isLoading: isBalanceLoading, refresh } = useTokenBalanceContext();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const [showFixedButton, setShowFixedButton] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY.current) {
        setShowFixedButton(true);
      }

      if (currentScrollY > lastScrollY.current) {
        setShowFixedButton(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (contentRef.current && contentWrapperRef.current && recommendations) {
      if (!isCollapsed) {
        gsap.set(contentWrapperRef.current, { height: 'auto' });
        const height = contentWrapperRef.current.offsetHeight;
        gsap.set(contentWrapperRef.current, { height: height });
      } else {
        gsap.set(contentWrapperRef.current, { height: 0 });
      }
    }
  }, [recommendations, isCollapsed]);

  const toggleCollapse = () => {
    if (!contentRef.current || !contentWrapperRef.current) return;

    if (isCollapsed) {
      gsap.set(contentWrapperRef.current, { height: 'auto', visibility: 'visible' });
      const height = contentWrapperRef.current.offsetHeight;
      gsap.fromTo(
        contentWrapperRef.current,
        { height: 0, opacity: 0 },
        {
          height: height,
          opacity: 1,
          duration: 0.5,
          ease: 'power4.out',
          onComplete: () => {
            if (contentWrapperRef.current) {
              gsap.set(contentWrapperRef.current, { height: 'auto' });
            }
          },
        }
      );
    } else {
      const height = contentWrapperRef.current.offsetHeight;
      gsap.fromTo(
        contentWrapperRef.current,
        { height: height, opacity: 1 },
        {
          height: 0,
          opacity: 0,
          duration: 0.5,
          ease: 'power4.in',
          onComplete: () => {
            if (contentWrapperRef.current) {
              gsap.set(contentWrapperRef.current, { visibility: 'hidden' });
            }
          },
        }
      );
    }

    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const loadProfileAndRecommendations = async () => {
      setLoading(true);
      setError(null);

      // 1. Sprawdź profil
      const storedProfile = localStorage.getItem('userProfile');
      if (!storedProfile) {
        setError('Brak danych profilu. Wróć do formularza.');
        setLoading(false);
        return;
      }

      const parsedProfile = JSON.parse(storedProfile);
      setProfile(parsedProfile);

      // 2. Sprawdź token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required', {
          description: 'Please sign in to continue.',
        });
        setLoading(false);
        return;
      }

      // 3. Pobierz rekomendacje
      try {
        // Najpierw spróbuj pobrać ostatnie rekomendacje
        try {
          const lastRecommendationResponse = await axios.get<AiCareerResponse>(
            'https://vocare-production-e568.up.railway.app/api/AI/last-recommendation',
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('Last recommendations:', lastRecommendationResponse.data);
          setRecommendations(lastRecommendationResponse.data);
          setLoading(false);
          return;
        } catch (lastError: unknown) {
          if (lastError instanceof AxiosError && 
              lastError.response?.status !== 404 && 
              lastError.response?.status !== 500) {
            console.error('Something went wrong while getting last recommendations:', lastError);
            setError(
              lastError.response?.data?.detail ||
                'Something went wrong while getting last recommendations.'
            );
            setLoading(false);
            return;
          }
          console.log('No last recommendations found or server error, generating new ones...');
        }

        // Jeśli brak ostatnich rekomendacji, wygeneruj nowe
        const response = await axios.get<AiCareerResponse>(
          'https://vocare-production-e568.up.railway.app/api/AI/recommendations',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('New recommendations:', response.data);
        setRecommendations(response.data);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          console.error('Detailed error:', err);
          console.error('Response status:', err.response?.status);
          console.error('Response data:', err.response?.data);

          if (
            err.response?.status === 500 &&
            typeof err.response.data === 'string' &&
            err.response.data.includes('User billing information')
          ) {
            setError('billing_info_missing');
            toast.error('Brak informacji rozliczeniowych', {
              description: 'Uzupełnij dane rozliczeniowe w ustawieniach konta.',
            });
          } else {
            setError(err.response?.data?.detail || 'Błąd podczas generowania rekomendacji');
          }
        } else {
          console.error('Unknown error:', err);
          setError('Unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndRecommendations();
  }, []);

  const handleGenerateNewRecommendations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required', {
        description: 'Please sign in to continue.',
      });
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get<AiCareerResponse>(
        'https://vocare-production-e568.up.railway.app/api/AI/recommendations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setRecommendations(response.data);
      toast.success('New recommendations have been generated');
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.detail || 'Something went wrong while generating new recommendations'
        );
        toast.error('Błąd', {
          description: 'Something went wrong while generating new recommendations',
        });
      } else {
        setError('Unexpected error');
        toast.error('Unexpected error', {
          description: 'An unknown error occurred while generating recommendations',
        });
        console.error('Unexpected error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="p-8 text-center">Brak danych profilu. Wróć do formularza.</div>;
  }

  if (error) {
    return <GenerateRecommendation />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto -mt-20 mb-1 flex h-screen max-w-7xl flex-col items-center justify-center overflow-hidden rounded-[28px] max-xl:mx-4">
        <GridBackgroundDemo />
        <TerminalDemo />
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <GenerateRecommendation />;
      </div>
    );
  }

  return (
    <Section
      className="relative -mt-[5.25rem] pt-[3.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="profile"
    >
      <div className="mt-8 xl:mx-10 xl:mt-16 xl:border-t xl:border-r xl:border-l">
        <div className="font-poppins mx-auto flex max-w-7xl flex-col items-center justify-center p-4 md:p-8">
          <h2 className="mb-4 ml-4 text-2xl font-bold text-[#915EFF]">Carrer Recommendation</h2>
          <div>
            {/* Main recommendation section */}
            <div className="mb-1 flex flex-col overflow-hidden rounded-[28px] border shadow-sm md:flex-row">
              <div className="flex items-center justify-center bg-[#915EFF] p-4 md:w-1/6 md:p-8">
                <span className="text-4xl font-bold text-white md:text-6xl" id="num">
                  1
                </span>
              </div>
              <div className="p-4 md:w-5/6 md:p-6">
                <div className="flex flex-row items-center justify-between">
                  <h2 className="mb-3 text-xl font-semibold">Main Recommendation</h2>
                  <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
                </div>

                <h3 className="text-lg font-medium text-[#915EFF]">
                  {recommendations.recommendation.primaryPath}
                </h3>

                <p className="text-gray-500">{recommendations.recommendation.justification}</p>

                <div
                  ref={contentWrapperRef}
                  className="overflow-hidden"
                  style={{
                    height: isCollapsed ? 0 : 'auto',
                    opacity: isCollapsed ? 0 : 1,
                    visibility: isCollapsed ? 'hidden' : 'visible',
                  }}
                >
                  <div ref={contentRef} className="space-y-3">
                    <div className="mt-4">
                      <h4 className="font-medium">Kolejne kroki:</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {recommendations.recommendation.nextSteps.map(
                          (step: string, index: number) => (
                            <li key={index}>{step}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <Separator />
                    <div className="mt-4">
                      <h4 className="font-medium">Cel długoterminowy:</h4>
                      <p className="mt-1">{recommendations.recommendation.longTermGoal}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Career paths sections */}
          {recommendations.careerPaths.map((path: CareerPath, index: number) => (
            <CareerPathSection key={index} path={path} index={index} />
          ))}

          <div
            className={`${
              showFixedButton
                ? 'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 translate-y-0 opacity-100'
                : 'fixed bottom-0 left-1/2 z-50 -translate-x-1/2 translate-y-full opacity-0'
            } flex w-1/2 items-center justify-center transition-all duration-500 ease-in-out`}
          >
            <CustomButton
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={isLoading}
              className="cursor-pointer px-6 py-2"
            >
              {isLoading ? 'Generating...' : 'Generate new recommendation'}
            </CustomButton>
          </div>

          <div className="mt-16 flex w-full justify-center">
            <CustomButton
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={isLoading}
              className="cursor-pointer px-6 py-2"
            >
              {isLoading ? 'Generating...' : 'Generate new recommendation'}
            </CustomButton>
          </div>

          <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <AlertDialogContent className="font-poppins mx-auto max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center text-xl font-bold">
                  Generate new recommendation?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  This will take <b className="text-[#915EFF]">50 credits</b> from Your account.
                </AlertDialogDescription>

                <div className="mt-2 text-center text-sm font-extralight">
                  Current balance:{' '}
                  <span className="font-bold">{isBalanceLoading ? '...' : tokenBalance}</span>
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="flex justify-center gap-4 sm:justify-center">
                <AlertDialogCancel className="border-gray-200">Cancel</AlertDialogCancel>

                {!isBalanceLoading && typeof tokenBalance === 'number' && tokenBalance < 5 ? (
                  <Link href="/pricing">
                    <AlertDialogAction
                      className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                      onClick={() => setIsConfirmDialogOpen(false)}
                    >
                      Get tokens
                      <Image src={star_generate} alt="star" width={16} height={16} />
                    </AlertDialogAction>
                  </Link>
                ) : (
                  <AlertDialogAction
                    onClick={async () => {
                      await handleGenerateNewRecommendations();
                      refresh();
                    }}
                    className="bg-[#915EFF] text-white hover:bg-[#7b4ee0]"
                  >
                    Generate
                    <Image src={star_generate} alt="star" width={16} height={16} />
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Section>
  );
}
