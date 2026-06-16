import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { useUnauthorizedToast } from '@/lib/hooks/useUnauthorizedToast';
import { GenerateRoadmapPayload } from '@/lib/types/roadmap';

import { archiveRoadmapCommand, generateRoadmapCommand } from '../dal/commands';
import { RoadmapDomainError } from '../dal/services';

export function useRoadmapDashboardActions() {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<RoadmapDomainError | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { unauthorizedToast } = useUnauthorizedToast();

  const handleError = (error: RoadmapDomainError) => {
    if (error.type === 'Unauthorized') {
      unauthorizedToast();
    } else {
      toast.error('Nie udało się utworzyć roadmapy', {
        description: error.message || 'Wystąpił nieoczekiwany błąd serwera.',
      });
    }

    setActionError(error);
  };

  const handleGenerateRoadmap = (payload: GenerateRoadmapPayload, onSuccess?: () => void) => {
    startTransition(async () => {
      setActionError(null);
      const [error] = await generateRoadmapCommand(payload);

      if (error) {
        handleError(error);
      } else {
        toast.success('Rozpoczęto generowanie roadmapy w tle');
        if (onSuccess) onSuccess();
      }
    });
  };

  const handleArchiveRoadmap = (roadmapId: string, onSuccess?: () => void) => {
    setDeletingId(roadmapId);
    startTransition(async () => {
      setActionError(null);
      const [error] = await archiveRoadmapCommand(roadmapId);

      if (error) {
        handleError(error);
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
    isPending,
    actionError,
    deletingId,
  };
}
