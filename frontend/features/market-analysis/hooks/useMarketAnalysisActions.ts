import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { useUnauthorizedToast } from '@/lib/hooks/useUnauthorizedToast';

import { generateMarketAnalysisCommand } from '../dal/commands';
import { MarketAnalysisDomainError } from '../dal/services';

export function useMarketAnalysisActions() {
  const [isPending, startTransition] = useTransition();
  const [generateError, setGenerateError] = useState<MarketAnalysisDomainError | null>(null);
  const { unauthorizedToast } = useUnauthorizedToast();
  const router = useRouter();

  const handleGenerateNewAnalysis = () => {
    startTransition(async () => {
      setGenerateError(null);
      const [actionError] = await generateMarketAnalysisCommand();

      if (actionError) {
        if (actionError.type === 'Unauthorized') {
          unauthorizedToast();
        } else if (actionError.type === 'InsufficientTokens') {
          toast.error('Brak informacji rozliczeniowych', {
            description: 'Uzupełnij dane rozliczeniowe lub dokup tokeny.',
          });
        } else if (actionError.type === 'MissingCareerPaths') {
          toast.error('Brak ścieżek kariery', {
            description: actionError.message,
            action: {
              label: 'Generuj',
              onClick: async () => router.push('/dashboard/assistant'),
            },
          });
        } else {
          toast.error('Błąd', {
            description: actionError.message || 'Wystąpił nieoczekiwany błąd przy generowaniu.',
          });
        }
        setGenerateError(actionError);
      } else {
        toast.success('Nowa analiza rynku została wygenerowana pomyślnie');
      }
    });
  };

  return {
    handleGenerateNewAnalysis,
    isPending,
    generateError,
  };
}
