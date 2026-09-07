import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ResumeComponent from '../components/ResumeComponent';

const autosaveCapture = vi.hoisted(() => ({ value: null as unknown }));

vi.mock('next/image', () => ({
  default: () => <span data-testid="mock-image" />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/components/ui/hover-card', () => ({
  HoverCard: ({ children }: { children: ReactNode }) => <>{children}</>,
  HoverCardContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  HoverCardTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
}));

vi.mock('@/lib/hooks/useAutosave', () => ({
  useAutosave: ({ value }: { value: unknown }) => {
    autosaveCapture.value = value;
    return {
      status: 'idle',
      trigger: vi.fn(),
      pause: vi.fn(),
      flush: vi.fn(),
      resume: vi.fn(),
      reset: vi.fn(),
    };
  },
}));

vi.mock('@/lib/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../hooks/useResumeDetailsActions', () => ({
  useResumeDetailsActions: () => ({
    handleAutosave: vi.fn(),
    handleGetCvLimits: vi.fn(),
    handleLoadFromProfile: vi.fn(),
    handleCreateTailoredCopy: vi.fn(),
    handleReplaceWithTailoredCv: vi.fn(),
  }),
}));

vi.mock('../components/CvAnalysisDrawer', () => ({
  CvAnalysisDrawer: () => null,
}));

vi.mock('../components/DatePickerWithCurrent', () => ({
  DatePickerWithCurrent: () => null,
}));

vi.mock('../components/ResumeAnalysisPromoButton', () => ({
  ResumeAnalysisPromoButton: () => null,
}));

vi.mock('../components/TailorCvFromEditorDialog', () => ({
  default: () => null,
}));

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const sectionOrder = [
  'profile',
  'education',
  'experience',
  'projects',
  'certificates',
  'skills',
  'languages',
  'hobbies',
  'privacy',
];

const experiences = [
  {
    id: 'experience-first',
    company: 'Pierwsza firma',
    position: 'Pierwsze stanowisko',
    startDate: '2022-01',
    endDate: '2023-01',
    responsibilities: ['Pierwszy zakres obowiązków'],
    isCurrent: false,
    useBulletList: true,
  },
  {
    id: 'experience-second',
    company: 'Druga firma',
    position: 'Drugie stanowisko',
    startDate: '2023-02',
    endDate: '',
    responsibilities: ['Drugi zakres obowiązków'],
    isCurrent: true,
    useBulletList: true,
  },
];

beforeEach(() => {
  autosaveCapture.value = null;
  localStorage.clear();
  localStorage.setItem('experiences', JSON.stringify(experiences));
  localStorage.setItem(
    'education',
    JSON.stringify([
      {
        id: 'education-first',
        school: 'Politechnika',
        degree: 'Master',
        field: 'Informatyka',
        startDate: '2018-10',
        endDate: '2020-06',
        isCurrent: false,
        description: '',
      },
    ])
  );
  localStorage.setItem(
    'projects',
    JSON.stringify([
      { id: 'project-first', title: 'Projekt Alpha', url: '', description: 'Opis projektu' },
    ])
  );
  localStorage.setItem(
    'certificates',
    JSON.stringify([
      { id: 'certificate-first', name: 'Certyfikat Alpha', date: '', hasDate: false },
    ])
  );
  localStorage.setItem('skills', JSON.stringify([{ id: 'skill-first', name: 'TypeScript' }]));
  localStorage.setItem(
    'languages',
    JSON.stringify([{ id: 'language-first', name: 'Angielski', level: 'Advanced' }])
  );
  localStorage.setItem('hobbies', JSON.stringify([{ id: 'hobby-first', name: 'Fotografia' }]));
  localStorage.setItem('sectionOrder', JSON.stringify(sectionOrder));

  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1)
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('ResumeComponent item reordering', () => {
  it('moves an experience with the keyboard and preserves the section order', async () => {
    render(<ResumeComponent />);

    [
      'Pierwsze stanowisko',
      'Informatyka',
      'Projekt Alpha',
      'Certyfikat Alpha',
      'TypeScript',
      'Angielski',
      'Fotografia',
    ].forEach((label) => {
      expect(screen.getByRole('button', { name: `Zmień kolejność: ${label}` })).toBeTruthy();
    });

    (['experience', 'education', 'projects'] as const).forEach((sectionId) => {
      const card = document.querySelector(`[data-reorder-section="${sectionId}"]`);
      const rail = card?.querySelector('[data-item-action-rail="true"]');
      const railChildren = Array.from(rail?.children ?? []);

      expect(railChildren).toHaveLength(2);
      expect(railChildren[0]?.getAttribute('data-item-drag-handle')).toBe('true');
      expect(railChildren[1]?.getAttribute('data-item-delete-button')).toBe('true');
    });

    (['certificates', 'skills', 'languages', 'hobbies'] as const).forEach((sectionId) => {
      const card = document.querySelector(`[data-reorder-section="${sectionId}"]`);

      expect(card?.querySelector('[data-item-action-rail="true"]')).toBeNull();
      expect(card?.querySelector('[data-item-drag-handle="true"]')).toBeTruthy();
      expect(card?.querySelector('[data-item-delete-button="true"]')).toBeTruthy();
    });

    expect(
      screen
        .getAllByPlaceholderText('Obowiązki - każdy w osobnej linii')
        .map((element) => (element as HTMLTextAreaElement).rows)
    ).toEqual([4, 4]);
    expect(
      (
        screen.getByPlaceholderText(
          'Osiągnięcia, kursy/zajęcia, średnia ocen, ważne projekty.'
        ) as HTMLTextAreaElement
      ).rows
    ).toBe(4);

    (['languages', 'certificates'] as const).forEach((sectionId) => {
      const card = document.querySelector(`[data-reorder-section="${sectionId}"]`);
      expect(card?.firstElementChild?.classList.contains('items-center')).toBe(true);
    });

    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Zmień kolejność: Pierwsze stanowisko' }),
      { key: 'ArrowDown' }
    );

    await waitFor(() => {
      const savedExperiences = JSON.parse(localStorage.getItem('experiences') ?? '[]') as Array<{
        id: string;
      }>;
      expect(savedExperiences.map(({ id }) => id)).toEqual([
        'experience-second',
        'experience-first',
      ]);
    });

    expect(
      screen.getAllByPlaceholderText('Firma').map((input) => (input as HTMLInputElement).value)
    ).toEqual(['Druga firma', 'Pierwsza firma']);

    const previewExperienceIds = Array.from(
      document.querySelectorAll('.cv-section[data-block-id="experience"] .exp-item[data-item-id]')
    ).map((item) => item.getAttribute('data-item-id'));
    expect(previewExperienceIds).toEqual(['experience-second', 'experience-first']);

    const autosaveValue = autosaveCapture.value as {
      cvData: { work: Array<{ company?: string }> };
    };
    expect(autosaveValue.cvData.work.map(({ company }) => company)).toEqual([
      'Druga firma',
      'Pierwsza firma',
    ]);

    expect(JSON.parse(localStorage.getItem('sectionOrder') ?? '[]')).toEqual(sectionOrder);
  });
});
