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
import { GradientButton } from '../ui/ButtonGenerate';
import CustomButton from '../ui/CustomButton';

export default function AssistantPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<AiCareerResponse | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!profile) {
    return <div className="p-8 text-center">Brak danych profilu. Wróć do formularza.</div>;
  }

  if (error) {
    return <GenerateRecommendation />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Ładowanie rekomendacji...</p>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Brak rekomendacji.</p>
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
          onClick={async () => {
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
            } catch (err: any) {
              setError(
                err.response?.data?.detail || 'Nie udało się wygenerować nowych rekomendacji.'
              );
            } finally {
              setLoading(false);
            }
          }}
          disabled={isLoading}
          className="px-6 py-2 cursor-pointer"
        >
          {isLoading ? 'Generowanie...' : 'Wygeneruj nowe rekomendacje'}
        </CustomButton>
      </div>
    </div>
  );
}
