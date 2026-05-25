import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { createCvCommand, deleteCvCommand } from '../dal/commands';

export function useResumeDashboardActions() {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
        router.push(`/dashboard/resume/${data.id}`);
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

  return {
    handleCreateResume,
    handleDeleteResume,
    isPending,
    deletingId,
    isCreating,
  };
}
