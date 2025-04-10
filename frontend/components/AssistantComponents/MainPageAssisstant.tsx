'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserProfile } from '@/app/types/profile';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AiCareerResponse } from '@/lib/recommendations';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GenerateRecommendation from './GenerateRecommendationFail';

export default function AssistantPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<AiCareerResponse | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Ładowanie rekomendacji...</p>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Brak rekomendacji.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      {/* Main recommendation section */}
      <div className="flex flex-col md:flex-row mb-8 border rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-center bg-blue-100 p-4 md:p-8 md:w-1/6">
          <span className="text-4xl md:text-6xl font-bold text-blue-600">1</span>
        </div>
        <div className="p-4 md:p-6 md:w-5/6">
          <h2 className="text-xl font-semibold mb-3">Główna rekomendacja</h2>
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-blue-700">
              {recommendations.recommendation.primaryPath}
            </h3>
            <p className="text-gray-700">{recommendations.recommendation.justification}</p>
            
            <div className="mt-4">
              <h4 className="font-medium">Kolejne kroki:</h4>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {recommendations.recommendation.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium">Cel długoterminowy:</h4>
              <p className="mt-1">{recommendations.recommendation.longTermGoal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Career paths sections */}
      {recommendations.careerPaths.map((path, index) => (
        <div key={index} className="flex flex-col md:flex-row mb-8 border rounded-lg overflow-hidden shadow-sm">
          <div className={`flex items-center justify-center p-4 md:p-8 md:w-1/6 
            ${index === 0 ? 'bg-green-100' : index === 1 ? 'bg-yellow-100' : 'bg-purple-100'}`}>
            <span className={`text-4xl md:text-6xl font-bold 
              ${index === 0 
                ? 'text-green-600' 
                : index === 1 
                  ? 'text-yellow-600' 
                  : 'text-purple-600'}`}>
              {index + 2}
            </span>
          </div>
          <div className="p-4 md:p-6 md:w-5/6">
            <h2 className="text-xl font-semibold mb-3">Proponowana ścieżka kariery</h2>
            <div>
              <h3 className="text-lg font-medium">{path.careerName}</h3>
              <p className="mt-2 text-gray-700">{path.description}</p>
              <p className="mt-2">
                <strong>Prawdopodobieństwo sukcesu:</strong> {path.probability}%
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Wymagane umiejętności:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {path.requiredSkills.map((skill, skillIndex) => (
                      <li key={skillIndex}>{skill}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Rekomendowane kursy:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {path.recommendedCourses.map((course, courseIndex) => (
                      <li key={courseIndex}>{course}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Analiza rynku:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {path.marketAnalysis.map((analysis, analysisIndex) => (
                    <li key={analysisIndex}>{analysis}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Analiza SWOT:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <strong className="text-green-700">Mocne strony:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-black">
                      {path.swot.strengths.map((strength, strengthIndex) => (
                        <li key={strengthIndex}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <strong className="text-red-700">Słabe strony:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-black">
                      {path.swot.weaknesses.map((weakness, weaknessIndex) => (
                        <li key={weaknessIndex}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <strong className="text-blue-700">Szanse:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-black">
                      {path.swot.opportunities.map((opportunity, oppIndex) => (
                        <li key={oppIndex}>{opportunity}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <strong className="text-orange-700">Zagrożenia:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-black">
                      {path.swot.threats.map((threat, threatIndex) => (
                        <li key={threatIndex}>{threat}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Button for generating new recommendations */}
      <div className="flex justify-center mt-8">
        <Button
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
          className="px-6 py-2"
        >
          {isLoading ? 'Generowanie...' : 'Wygeneruj nowe rekomendacje'}
        </Button>
      </div>
    </div>
  );
}