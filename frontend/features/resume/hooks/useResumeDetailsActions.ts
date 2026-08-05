import { useTransition } from 'react';
import { toast } from 'sonner';

import { CvDetailsDto, CvDto, CvLimits, UpdateCvDto } from '../dal/api';
import {
  createCvCommand,
  deleteCvCommand,
  getCvDetailsCommand,
  getCvLimitsCommand,
  tailorCvCommand,
  updateCvCommand,
} from '../dal/commands';

type CreateTailoredCopyResult =
  | { status: 'success'; cv: CvDetailsDto }
  | { status: 'limit-reached' }
  | { status: 'insufficient-tokens'; cleanupFailed: boolean }
  | { status: 'error'; cleanupFailed: boolean };

type ReplaceWithTailoredCvResult =
  | { status: 'success'; cv: CvDetailsDto; metadataSaved: boolean }
  | { status: 'insufficient-tokens'; latestCv: CvDetailsDto | null }
  | { status: 'error'; latestCv: CvDetailsDto | null };

const jobDescriptionWithPosition = (targetPosition: string, jobDescription: string) =>
  [`Stanowisko ${targetPosition.trim()}`, '', jobDescription.trim()].join('\n');

const loadLatestCv = async (cvId: string): Promise<CvDetailsDto | null> => {
  try {
    const [error, cv] = await getCvDetailsCommand(cvId);
    return error ? null : cv;
  } catch {
    return null;
  }
};

export function useResumeDetailsActions() {
  const [isPending, startTransition] = useTransition();

  const handleAutosave = async (payload: UpdateCvDto) => {
    const [error] = await updateCvCommand(payload);
    if (error) {
      throw new Error(error.message);
    }
  };

  const handleGetCvLimits = async (): Promise<CvLimits | null> => {
    try {
      const [error, limits] = await getCvLimitsCommand();
      return error ? null : limits;
    } catch {
      return null;
    }
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

  const handleCreateTailoredCopy = async ({
    sourceCv,
    targetPosition,
    jobDescription,
  }: {
    sourceCv: CvDto;
    targetPosition: string;
    jobDescription: string;
  }): Promise<CreateTailoredCopyResult> => {
    const createResult = await createCvCommand({
      name: targetPosition.trim(),
      targetPosition: targetPosition.trim(),
      createFromProfile: false,
      initialData: sourceCv,
    }).catch(() => null);

    if (!createResult) {
      return { status: 'error', cleanupFailed: false };
    }

    const [createError, copy] = createResult;

    if (createError?.type === 'CvLimitReached') {
      return { status: 'limit-reached' };
    }

    if (createError || !copy) {
      return { status: 'error', cleanupFailed: false };
    }

    const tailorResult = await tailorCvCommand({
      cvId: copy.id,
      jobDescription: jobDescriptionWithPosition(targetPosition, jobDescription),
    }).catch(() => null);

    const [tailorError, tailoredCv] = tailorResult ?? [null, null];

    if (!tailorResult || tailorError || !tailoredCv) {
      const cleanupResult = await deleteCvCommand(copy.id).catch(() => null);
      const cleanupFailed = !cleanupResult || Boolean(cleanupResult[0]);

      if (tailorError?.type === 'InsufficientTokens') {
        return { status: 'insufficient-tokens', cleanupFailed };
      }

      return {
        status: 'error',
        cleanupFailed,
      };
    }

    return { status: 'success', cv: tailoredCv };
  };

  const handleReplaceWithTailoredCv = async ({
    cvId,
    resumeName,
    targetPosition,
    jobDescription,
  }: {
    cvId: string;
    resumeName: string;
    targetPosition: string;
    jobDescription: string;
  }): Promise<ReplaceWithTailoredCvResult> => {
    const tailorResult = await tailorCvCommand({
      cvId,
      jobDescription: jobDescriptionWithPosition(targetPosition, jobDescription),
    }).catch(() => null);

    const [tailorError, tailoredCv] = tailorResult ?? [null, null];

    if (tailorError?.type === 'InsufficientTokens') {
      return { status: 'insufficient-tokens', latestCv: await loadLatestCv(cvId) };
    }

    if (!tailorResult || tailorError || !tailoredCv) {
      return { status: 'error', latestCv: await loadLatestCv(cvId) };
    }

    const updateResult = await updateCvCommand({
      id: cvId,
      name: resumeName,
      targetPosition: targetPosition.trim(),
      cvData: tailoredCv.cvData,
      notes: tailoredCv.notes,
    }).catch(() => null);

    const [updateError, updatedCv] = updateResult ?? [null, null];

    if (!updateResult || updateError || !updatedCv) {
      return {
        status: 'success',
        cv: { ...tailoredCv, targetPosition: targetPosition.trim() },
        metadataSaved: false,
      };
    }

    return { status: 'success', cv: updatedCv, metadataSaved: true };
  };

  return {
    handleAutosave,
    handleGetCvLimits,
    handleManualSave,
    handleLoadFromProfile,
    handleCreateTailoredCopy,
    handleReplaceWithTailoredCv,
    isPending,
  };
}
