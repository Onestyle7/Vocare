'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { UserProfile } from '@/app/types/profile';
import { toast } from 'sonner';
import { AiCareerResponse } from '@/lib/recommendations';
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
} from "../ui/alert-dialog";
import Image from 'next/image';
import { star_generate } from '@/app/constants';

export default function AssistantPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<AiCareerResponse | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

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
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    } else {
      setError('Brak danych profilu. Wróć do formularza.');
    }
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!profile) return;

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
        try {
          const lastRecommendationResponse = await axios.get<AiCareerResponse>(
            'https://localhost:5001/api/AI/last-recommendation',
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('Ostatnie rekomendacje:', lastRecommendationResponse.data);
          setRecommendations(lastRecommendationResponse.data);
          setLoading(false);
          return;
        } catch (lastError: any) {
          if (lastError.response?.status !== 404) {
            console.error('Błąd podczas pobierania ostatnich rekomendacji:', lastError);
            setError(
              lastError.response?.data?.detail || 'Błąd podczas pobierania ostatnich rekomendacji.'
            );
            setLoading(false);
            return;
          }
        }

        const response = await axios.get<AiCareerResponse>(
          'https://localhost:5001/api/AI/recommendations',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('Nowe rekomendacje:', response.data);
        setRecommendations(response.data);
      } catch (err: any) {
        console.error('Błąd podczas pobierania rekomendacji:', err);
        setError(err.response?.data?.detail || 'Błąd podczas generowania rekomendacji');
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchRecommendations();
    }
  }, [profile]);

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
        'https://localhost:5001/api/AI/recommendations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setRecommendations(response.data);
      toast.success('Wygenerowano nowe rekomendacje');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Nie udało się wygenerować nowych rekomendacji.'
      );
      toast.error('Błąd', {
        description: 'Nie udało się wygenerować nowych rekomendacji.',
      });
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
      <div className="mb-1 flex flex-col overflow-hidden rounded-[28px] h-screen items-center justify-center -mt-20 max-w-7xl mx-auto max-xl:mx-4">
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
    <div className="font-poppins mx-auto max-w-7xl p-4 md:p-8">
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
                  {recommendations.recommendation.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
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

      {/* Career paths sections */}
      {recommendations.careerPaths.map((path, index) => (
        <CareerPathSection key={index} path={path} index={index} />
      ))}

      {/* Button for generating new recommendations */}
      <div className="mt-8 mx-20 flex justify-center">
        <CustomButton
          onClick={() => setIsConfirmDialogOpen(true)}
          disabled={isLoading}
          className="px-6 py-2 cursor-pointer"
        >
          {isLoading ? 'Generating...' : 'Generate new recommendation'}
        </CustomButton>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="max-w-md mx-auto font-poppins">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Generate new recommendation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will take <b className='text-[#915EFF]'>50 credits</b> from Your account
              <div className="mt-2 font-extralight">
                Current balance: <span className='font-bold'>200</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center gap-4 sm:justify-center">
            <AlertDialogCancel className="border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerateNewRecommendations}
              className="bg-[#915EFF] hover:bg-[#7b4ee0] text-white"
            >
              Generate
              <Image src={star_generate} alt='star' width={16} height={16}/>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}