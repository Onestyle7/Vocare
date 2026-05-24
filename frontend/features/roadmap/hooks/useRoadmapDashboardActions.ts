import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { GenerateRoadmapPayload } from '@/lib/types/roadmap';

import { archiveRoadmapCommand, generateRoadmapCommand } from '../dal/commands';
import { RoadmapDomainError } from '../dal/services';

export function useRoadmapDashboardActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<RoadmapDomainError | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleGenerateRoadmap = (payload: GenerateRoadmapPayload, onSuccess?: () => void) => {
    startTransition(async () => {
      setActionError(null);
      const [error, response] = await generateRoadmapCommand(payload);

      if (error) {
        toast.error('Nie udało się utworzyć roadmapy', {
          description: error.message || 'Wystąpił nieoczekiwany błąd serwera.',
        });
        setActionError(error);
      } else {
        toast.success('Roadmapa została utworzona');
        if (onSuccess) onSuccess();
        if (response) router.push(`/roadmap/${response.id}`);
      }
    });
  };

  const handleArchiveRoadmap = (roadmapId: string, onSuccess?: () => void) => {
    setDeletingId(roadmapId);
    startTransition(async () => {
      setActionError(null);
      const [error] = await archiveRoadmapCommand(roadmapId);

      if (error) {
        toast.error('Nie udało się usunąć roadmapy', {
          description: error.message || 'Wystąpił nieoczekiwany błąd serwera.',
        });
        setActionError(error);
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
