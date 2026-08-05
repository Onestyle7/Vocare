import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ServiceCostActionResult } from '@/features/billing/types';

import { useRoadmapDashboardActions } from '../hooks/useRoadmapDashboardActions';

const mocks = vi.hoisted(() => ({
  generateRoadmapCommand: vi.fn(),
  archiveRoadmapCommand: vi.fn(),
  unauthorizedToast: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('../dal/commands', () => ({
  generateRoadmapCommand: mocks.generateRoadmapCommand,
  archiveRoadmapCommand: mocks.archiveRoadmapCommand,
}));

vi.mock('@/lib/hooks/useUnauthorizedToast', () => ({
  useUnauthorizedToast: () => ({ unauthorizedToast: mocks.unauthorizedToast }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

const payload = {
  careerPathId: 'career-path-1',
  timeHorizonMonths: 9,
};

const executeGeneration = async (
  commandResult: [Record<string, unknown> | null, Record<string, unknown> | null]
) => {
  mocks.generateRoadmapCommand.mockResolvedValue(commandResult);
  const { result } = renderHook(() => useRoadmapDashboardActions());
  let actionResult: ServiceCostActionResult | undefined;

  await act(async () => {
    actionResult = await result.current.handleGenerateRoadmap(payload);
  });

  return { actionResult, hook: result.current };
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useRoadmapDashboardActions generation result', () => {
  it('returns success and announces accepted background generation', async () => {
    const { actionResult } = await executeGeneration([
      null,
      { roadmapId: 'roadmap-1', generationStatus: 'Pending' },
    ]);

    expect(actionResult).toBe('success');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Rozpoczęto generowanie roadmapy w tle');
  });

  it('passes insufficient tokens to the shared confirmation dialog', async () => {
    const { actionResult, hook } = await executeGeneration([
      { type: 'InsufficientTokens', message: 'Za mało tokenów' },
      null,
    ]);

    expect(actionResult).toBe('insufficient-tokens');
    expect(hook.actionError?.type).toBe('InsufficientTokens');
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it.each(['RoadmapLimitReached', 'DuplicateRoadmap', 'NotFound', 'InvalidOperation'] as const)(
    'closes via handled-error after showing the typed %s error',
    async (type) => {
      const { actionResult } = await executeGeneration([
        { type, message: `Handled ${type}` },
        null,
      ]);

      expect(actionResult).toBe('handled-error');
      expect(mocks.toastError).toHaveBeenCalledWith('Nie udało się utworzyć roadmapy', {
        description: `Handled ${type}`,
      });
    }
  );

  it('leaves an uncertain generic outcome for the safe dialog error state', async () => {
    const { actionResult } = await executeGeneration([
      { type: 'GenericApiError', message: 'Unknown outcome' },
      null,
    ]);

    expect(actionResult).toBe('error');
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('treats a successful response without roadmapId as an uncertain outcome', async () => {
    const { actionResult, hook } = await executeGeneration([null, {}]);

    expect(actionResult).toBe('error');
    expect(hook.actionError?.type).toBe('GenericApiError');
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('handles authorization and closes the confirmation dialog', async () => {
    const { actionResult } = await executeGeneration([
      { type: 'Unauthorized', message: 'Session expired' },
      null,
    ]);

    expect(actionResult).toBe('handled-error');
    expect(mocks.unauthorizedToast).toHaveBeenCalledTimes(1);
  });
});
