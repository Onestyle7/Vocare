import { useTransition } from 'react';
import { toast } from 'sonner';

import { CvDto, UpdateCvDto } from '../dal/api';
import { createCvCommand, deleteCvCommand, updateCvCommand } from '../dal/commands';

export function useResumeDetailsActions() {
  const [isPending, startTransition] = useTransition();

  const handleAutosave = (payload: UpdateCvDto) => {
    startTransition(async () => {
      await updateCvCommand(payload);
    });
  };

  const handleManualSave = async (payload: UpdateCvDto) => {
    const [error] = await updateCvCommand(payload);
    if (error) {
      toast.error('Nie udało się zapisać CV');
      throw new Error(error.message);
    } else {
      toast.success('CV zostało zapisane');
    }
  };

  const handleLoadFromProfile = async (
    cvId: string,
    resumeName: string,
    targetPosition?: string
  ): Promise<{ targetPosition?: string; cvData: CvDto }> => {
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const [createError, generated] = await createCvCommand({
            name: 'Generated CV',
            targetPosition: targetPosition,
            createFromProfile: true,
          });

          if (createError || !generated) {
            toast.error('Nie udało się wygenerować profilu');
            return reject(createError);
          }

          const [updateError] = await updateCvCommand({
            id: cvId,
            name: resumeName,
            targetPosition: generated.targetPosition,
            cvData: generated.cvData,
          });

          if (updateError) {
            toast.error('Błąd podczas aplikowania wygenerowanego CV');
            return reject(updateError);
          }

          await deleteCvCommand(generated.id);

          toast.success('Pomyślnie załadowano dane z profilu');
          resolve({ targetPosition: generated.targetPosition, cvData: generated.cvData });
        } catch (err) {
          toast.error('Wystąpił nieoczekiwany błąd podczas ładowania');
          reject(err);
        }
      });
    });
  };

  return {
    handleAutosave,
    handleManualSave,
    handleLoadFromProfile,
    isPending,
  };
}
