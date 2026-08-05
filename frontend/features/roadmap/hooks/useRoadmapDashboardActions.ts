import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import type { ServiceCostActionResult } from '@/features/billing/types';
import { useUnauthorizedToast } from '@/lib/hooks/useUnauthorizedToast';
import type { GenerateRoadmapPayload } from '@/lib/types/roadmap';

import { archiveRoadmapCommand, generateRoadmapCommand } from '../dal/commands';
import { RoadmapDomainError } from '../dal/services';

export function useRoadmapDashboardActions() {
  const [isTransitionPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionError, setActionError] = useState<RoadmapDomainError | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { unauthorizedToast } = useUnauthorizedToast();

  const handleArchiveError = (error: RoadmapDomainError) => {
    if (error.type === 'Unauthorized') {
      unauthorizedToast();
    } else {
      toast.error('Nie udało się usunąć roadmapy', {
        description: error.message || 'Wystąpił nieoczekiwany błąd serwera.',
      });
    }

    setActionError(error);
  };

  const handleGenerateRoadmap = async (
    payload: GenerateRoadmapPayload
  ): Promise<ServiceCostActionResult> => {
    setActionError(null);
    setIsGenerating(true);

    try {
      const [error, response] = await generateRoadmapCommand(payload);

      if (error) {
        setActionError(error);

        switch (error.type) {
          case 'InsufficientTokens':
            return 'insufficient-tokens';
          case 'Unauthorized':
            unauthorizedToast();
            return 'handled-error';
          case 'RoadmapLimitReached':
          case 'DuplicateRoadmap':
          case 'NotFound':
          case 'InvalidOperation':
            toast.error('Nie udało się utworzyć roadmapy', {
              description: error.message,
            });
            return 'handled-error';
          case 'GenericApiError':
            return 'error';
          default:
            return error.type satisfies never;
        }
      }

      if (!response?.roadmapId) {
        setActionError({
          type: 'GenericApiError',
          message: 'Serwer nie zwrócił identyfikatora uruchomionej roadmapy.',
        });
        return 'error';
      }

      toast.success('Rozpoczęto generowanie roadmapy w tle');
      return 'success';
    } catch {
      setActionError({
        type: 'GenericApiError',
        message: 'Nie udało się potwierdzić wyniku generowania roadmapy.',
      });
      return 'error';
    } finally {
      setIsGenerating(false);
    }
  };

  const handleArchiveRoadmap = (roadmapId: string, onSuccess?: () => void) => {
    setDeletingId(roadmapId);
    startTransition(async () => {
      setActionError(null);
      const [error] = await archiveRoadmapCommand(roadmapId);

      if (error) {
        handleArchiveError(error);
      } else {
        toast.success('Roadmapa została usunięta');
        if (onSuccess) onSuccess();
      }
      setDeletingId(null);
    });
  };

  return {
    handleGenerateRoadmap,
    handleArchiveRoadmap,
    isPending: isTransitionPending || isGenerating,
    isGenerating,
    actionError,
    deletingId,
  };
}
