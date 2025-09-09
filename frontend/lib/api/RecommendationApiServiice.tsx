import axios, { AxiosError } from 'axios';
import { AiCareerResponse } from '@/lib/types/recommendation';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/Ai`;

export class RecommendationsApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Pobierz ostatnią rekomendację użytkownika
   */
  async getLastRecommendation(): Promise<AiCareerResponse> {
    try {
      const response = await axios.get<AiCareerResponse>(`${API_BASE_URL}/last-recommendation`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new RecommendationApiError(
          error.response?.data?.detail || 'Failed to fetch last recommendation',
          error.response?.status || 500,
          'LAST_RECOMMENDATION_ERROR'
        );
      }
      throw error;
    }
  }

  /**
   * Wygeneruj nową rekomendację
   */
  async generateNewRecommendation(): Promise<AiCareerResponse> {
    try {
      const response = await axios.get<AiCareerResponse>(`${API_BASE_URL}/recommendations`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        let errorCode = 'GENERATION_ERROR';

        // Sprawdź specyficzne błędy
        if (
          error.response?.status === 500 &&
          typeof error.response.data === 'string' &&
          error.response.data.includes('User billing information')
        ) {
          errorCode = 'BILLING_INFO_MISSING';
        }

        throw new RecommendationApiError(
          error.response?.data?.detail || 'Failed to generate new recommendation',
          error.response?.status || 500,
          errorCode
        );
      }
      throw error;
    }
  }

  /**
   * Pobierz rekomendacje z fallbackiem - najpierw spróbuj ostatnią, potem wygeneruj nową
   */
  async getRecommendationsWithFallback(): Promise<AiCareerResponse> {
    try {
      // Najpierw spróbuj pobrać ostatnią rekomendację
      return await this.getLastRecommendation();
    } catch (error) {
      if (error instanceof RecommendationApiError) {
        // Jeśli błąd to 404 lub 500, spróbuj wygenerować nową
        if (error.status === 404 || error.status === 500) {
          console.log('No last recommendations found or server error, generating new ones...');
          return await this.generateNewRecommendation();
        }
      }
      // Jeśli to inny błąd, przekaż go dalej
      throw error;
    }
  }
}

export class RecommendationApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = 'RecommendationApiError';
  }
}

// Hook do użycia w komponentach React
export const useRecommendationsApi = () => {
  const apiService = new RecommendationsApiService();

  return {
    getLastRecommendation: () => apiService.getLastRecommendation(),
    generateNewRecommendation: () => apiService.generateNewRecommendation(),
    getRecommendationsWithFallback: () => apiService.getRecommendationsWithFallback(),
  };
};

// Przykład użycia w komponencie:
/*
import { useRecommendationsApi, RecommendationApiError } from './recommendationsApi';

export default function MyComponent() {
  const [recommendations, setRecommendations] = useState<AiCareerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const api = useRecommendationsApi();

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.getRecommendationsWithFallback();
      setRecommendations(data);
    } catch (err) {
      if (err instanceof RecommendationApiError) {
        if (err.code === 'BILLING_INFO_MISSING') {
          setError('billing_info_missing');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateNew = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.generateNewRecommendation();
      setRecommendations(data);
    } catch (err) {
      if (err instanceof RecommendationApiError) {
        setError(err.message);
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Twój JSX
  );
}
*/
