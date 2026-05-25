import { useTransition } from 'react';
import { toast } from 'sonner';

import { StepStatus, UpdateStepPositionsPayload } from '../dal/api';
import {
  deleteRoadmapPhaseCommand,
  deleteRoadmapStepCommand,
  updateRoadmapPhaseNameCommand,
  updateRoadmapStepCommand,
  updateRoadmapStepPositionsCommand,
  updateRoadmapStepStatusCommand,
} from '../dal/commands';

export function useRoadmapDetailsActions(roadmapId: string) {
  const [isPending, startTransition] = useTransition();

  const handleDeleteStep = (stepId: string) => {
    startTransition(async () => {
      const [error] = await deleteRoadmapStepCommand(roadmapId, stepId);
      if (error) {
        toast.error('Nie udało się usunąć kroku');
      } else {
        toast.success('Krok został usunięty');
      }
    });
  };

  const handleUpdatePositions = (payload: UpdateStepPositionsPayload) => {
    startTransition(async () => {
      const [error] = await updateRoadmapStepPositionsCommand(roadmapId, payload);
      if (error) {
        toast.error('Nie udało się zapisać pozycji');
      }
    });
  };

  const handleUpdateStatus = (stepId: string, status: StepStatus) => {
    startTransition(async () => {
      const [error] = await updateRoadmapStepStatusCommand(roadmapId, stepId, status);
      if (error) {
        toast.error('Nie udało się zaktualizować statusu');
      }
    });
  };

  const handleUpdatePhaseName = (phaseId: string, newName: string) => {
    startTransition(async () => {
      const [error] = await updateRoadmapPhaseNameCommand(roadmapId, phaseId, newName);
      if (error) {
        toast.error('Nie udało się zapisać nazwy fazy');
      } else {
        toast.success('Nazwa fazy została zaktualizowana');
      }
    });
  };

  const handleDeletePhase = (phaseId: string) => {
    startTransition(async () => {
      const [error] = await deleteRoadmapPhaseCommand(roadmapId, phaseId);
      if (error) {
        toast.error('Nie udało się usunąć fazy');
      } else {
        toast.success('Faza została usunięta');
      }
    });
  };

  const handleUpdateStep = (stepId: string, payload: UpdateStepRequestDto) => {
    startTransition(async () => {
      const [error] = await updateRoadmapStepCommand(roadmapId, stepId, payload);
      if (error) {
        toast.error('Nie udało się zaktualizować kroku');
      } else {
        toast.success('Krok został zaktualizowany');
      }
    });
  };

  return {
    handleUpdatePositions,
    handleUpdateStatus,
    handleDeleteStep,
    handleUpdatePhaseName,
    handleDeletePhase,
    handleUpdateStep,
    isPending,
  };
}
