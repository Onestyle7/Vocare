import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';

import { generateRecommendations, getRecommendationError, fetchLastRecommendation } from '../api/recommendations';
import { AiCareerResponse } from '../types/recommendation';

const hasToken = () => typeof window !== 'undefined' && !!localStorage.getItem('token');

const shouldRetryWithNewGeneration = (error: unknown) => {
  return error instanceof AxiosError && (error.response?.status === 404 || error.response?.status === 500);
};

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<AiCareerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | 'billing_info_missing' | null>(null);

  const loadRecommendations = useCallback(async () => {
    if (!hasToken()) {
      setError('unauthorized');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      try {
        const latest = await fetchLastRecommendation();
        setRecommendations(latest);
        return latest;
      } catch (latestError) {
        if (!shouldRetryWithNewGeneration(latestError)) {
          throw latestError;
        }
      }

      const generated = await generateRecommendations();
      setRecommendations(generated);
      return generated;
    } catch (err) {
      setError(getRecommendationError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateNewRecommendations = useCallback(async () => {
    if (!hasToken()) {
      setError('unauthorized');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const generated = await generateRecommendations();
      setRecommendations(generated);
      return generated;
    } catch (err) {
      setError(getRecommendationError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    loadRecommendations,
    generateNewRecommendations,
  };
};
