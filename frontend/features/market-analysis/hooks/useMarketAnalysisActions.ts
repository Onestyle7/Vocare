import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import type { ServiceCostActionResult } from '@/features/billing/types';
import { useUnauthorizedToast } from '@/lib/hooks/useUnauthorizedToast';

import { generateMarketAnalysisCommand } from '../dal/commands';
import { MarketAnalysisDomainError } from '../dal/services';

export function useMarketAnalysisActions() {
  const [generateError, setGenerateError] = useState<MarketAnalysisDomainError | null>(null);
  const { unauthorizedToast } = useUnauthorizedToast();
  const router = useRouter();

  const handleGenerateNewAnalysis = async (): Promise<ServiceCostActionResult> => {
    setGenerateError(null);

    try {
      const [actionError] = await generateMarketAnalysisCommand();

      if (actionError) {
        setGenerateError(actionError);

        if (actionError.type === 'Unauthorized') {
          unauthorizedToast();
          return 'handled-error';
        }

        if (actionError.type === 'InsufficientTokens') {
          return 'insufficient-tokens';
        }

        if (actionError.type === 'MissingCareerPaths') {
          toast.error('Brak ścieżek kariery', {
            description: actionError.message,
            action: {
              label: 'Generuj',
              onClick: async () => router.push('/dashboard/assistant'),
            },
          });
          return 'handled-error';
        }

        return 'error';
      }

      toast.success('Nowa analiza rynku została wygenerowana pomyślnie');
      return 'success';
    } catch {
      setGenerateError({
        type: 'GenericApiError',
        message: 'Wystąpił nieoczekiwany błąd przy generowaniu analizy rynku.',
      });
      return 'error';
    }
  };

  return {
    handleGenerateNewAnalysis,
    generateError,
  };
}
