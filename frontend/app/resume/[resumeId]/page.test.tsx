// @vitest-environment node

import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CvDetailsDto } from '@/lib/types/cv';

const queryMocks = vi.hoisted(() => ({
  getCvDetailsQuery: vi.fn(),
  getCvLimitsQuery: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/features/auth/utils/login-redirect', () => ({
  forceLoginRedirect: vi.fn(),
}));

vi.mock('@/features/resume/components/ResumeComponent', () => ({
  default: () => null,
}));

vi.mock('@/features/resume/dal/queries', () => queryMocks);

import ResumeDetailPage from './page';

const cv: CvDetailsDto = {
  id: 'cv-123',
  name: 'CV',
  cvData: {
    work: [],
    education: [],
    certificates: [],
    projects: [],
    social: [],
    skills: [],
    languages: [],
    hobbies: [],
  },
  isDefault: false,
  createdAt: '2026-08-14T10:00:00Z',
  lastModifiedAt: '2026-08-14T10:00:00Z',
  version: 1,
};

const getCreatorElement = (page: ReactElement) => {
  const content = (page as ReactElement<{ children: ReactElement }>).props.children;
  return (content as ReactElement<{ children: ReactElement }>).props.children;
};

beforeEach(() => {
  queryMocks.getCvDetailsQuery.mockReset();
  queryMocks.getCvLimitsQuery.mockReset();
  queryMocks.getCvLimitsQuery.mockResolvedValue([
    null,
    { canCreateNew: true, currentCount: 1, maxLimit: 5 },
  ]);
});

describe('ResumeDetailPage', () => {
  it('keeps a stable editor key when autosave increments the CV version', async () => {
    queryMocks.getCvDetailsQuery
      .mockResolvedValueOnce([null, cv])
      .mockResolvedValueOnce([null, { ...cv, version: 2 }]);

    const firstRender = await ResumeDetailPage({
      params: Promise.resolve({ resumeId: cv.id }),
    });
    const secondRender = await ResumeDetailPage({
      params: Promise.resolve({ resumeId: cv.id }),
    });

    expect(getCreatorElement(firstRender).key).toBe(cv.id);
    expect(getCreatorElement(secondRender).key).toBe(cv.id);
  });
});
