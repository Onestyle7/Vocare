import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { createCvCommand, deleteCvCommand, GenerateCvFromProfileCommand } from '../dal/commands';

export type GenerateResumeResult = 'success' | 'insufficient-tokens' | 'limit-reached' | 'error';

export function useResumeDashboardActions() {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleCreateResume = () => {
    setIsCreating(true);
    startTransition(async () => {
      const [error, data] = await createCvCommand({ name: 'New Resume', createFromProfile: false });
      if (error) {
        toast.error('Nie udało się utworzyć CV');
        setIsCreating(false);
      } else if (data) {
        toast.success('Utworzono nowe CV');
        router.push(`/resume/${data.id}`);
      }
    });
  };

  const handleDeleteResume = (cvId: string) => {
    setDeletingId(cvId);
    startTransition(async () => {
      const [error] = await deleteCvCommand(cvId);
      if (error) {
        toast.error('Nie udało się usunąć CV');
      } else {
        toast.success('CV zostało usunięte');
      }
      setDeletingId(null);
    });
  };

  const handleGenerateResume = async ({
    targetPosition,
    jobDescription,
  }: {
    targetPosition: string;
    jobDescription: string;
  }): Promise<GenerateResumeResult> => {
    const position = targetPosition.trim();
    const description = jobDescription.trim();

    setIsGenerating(true);

    try {
      const [error, data] = await GenerateCvFromProfileCommand({
        name: position,
        jobDescription: [`Stanowisko ${position}`, '', description].join('\n'),
      });

      if (error) {
        router.refresh();

        if (error.type === 'InsufficientTokens') return 'insufficient-tokens';
        if (error.type === 'CvLimitReached') return 'limit-reached';
        return 'error';
      }

      if (data) {
        toast.success('Wygenerowano CV');
        router.push(`/resume/${data.id}`);
        return 'success';
      }

      router.refresh();
      return 'error';
    } catch {
      router.refresh();
      return 'error';
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    handleCreateResume,
    handleGenerateResume,
    handleDeleteResume,
    isPending,
    deletingId,
    isCreating,
    isGenerating,
  };
}
