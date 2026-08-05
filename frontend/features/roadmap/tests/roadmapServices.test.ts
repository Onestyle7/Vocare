import { err, ok } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateRoadmapService } from '../dal/services';

const apiMocks = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('../dal/api', () => ({
  roadmapApiClient: {
    post: apiMocks.post,
  },
}));

const payload = {
  careerPathId: 'career-path-1',
  timeHorizonMonths: 9,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('generateRoadmapService', () => {
  it('keeps the accepted roadmapId contract returned by the backend', async () => {
    apiMocks.post.mockResolvedValue(
      ok({
        success: true,
        data: { roadmapId: 'roadmap-1', generationStatus: 'Pending' },
        status: 202,
        headers: new Headers(),
      })
    );

    const result = await generateRoadmapService(payload);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({ roadmapId: 'roadmap-1', generationStatus: 'Pending' });
    }
  });

  it.each([
    ['INSUFFICIENT_TOKENS', 'InsufficientTokens'],
    ['ROADMAP_LIMIT_REACHED', 'RoadmapLimitReached'],
    ['DUPLICATE_ROADMAP', 'DuplicateRoadmap'],
  ] as const)('maps %s to the typed %s error', async (errorCode, expectedType) => {
    apiMocks.post.mockResolvedValue(
      err({
        type: errorCode === 'DUPLICATE_ROADMAP' ? 'ConflictError' : 'UnprocessableEntityError',
        message: 'Request rejected',
        details: { errorCode },
      })
    );

    const result = await generateRoadmapService(payload);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe(expectedType);
    }
  });

  it('keeps an unknown backend failure generic', async () => {
    apiMocks.post.mockResolvedValue(
      err({
        type: 'InternalServerError',
        message: 'Unknown outcome',
      })
    );

    const result = await generateRoadmapService(payload);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('GenericApiError');
    }
  });
});
