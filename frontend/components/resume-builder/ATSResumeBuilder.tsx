'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  buildResumeHtml,
  calculateMatch,
  sanitizeHtml,
  validateResume,
  type Section,
  type ExperienceSection,
  type EducationSection,
  type LanguagesSection,
  type Profile,
} from '@/lib/resume/ats';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_PADDING_MM = 16;

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const apply = (command: string, valueParam?: string) => {
    document.execCommand(command, false, valueParam);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleBlur = () => {
    if (!editorRef.current) return;
    const sanitized = sanitizeHtml(editorRef.current.innerHTML);
    editorRef.current.innerHTML = sanitized;
    onChange(sanitized);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => apply('bold')}
          className="rounded border border-gray-200 px-2 py-1 text-xs"
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => apply('italic')}
          className="rounded border border-gray-200 px-2 py-1 text-xs"
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => apply('underline')}
          className="rounded border border-gray-200 px-2 py-1 text-xs"
        >
          Underline
        </button>
        <button
          type="button"
          onClick={() => apply('insertUnorderedList')}
          className="rounded border border-gray-200 px-2 py-1 text-xs"
        >
          Bullet list
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Wklej link (https://...)');
            if (url) apply('createLink', url);
          }}
          className="rounded border border-gray-200 px-2 py-1 text-xs"
        >
          Link
        </button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[120px] rounded border border-gray-200 p-3 text-sm"
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange((event.target as HTMLDivElement).innerHTML)}
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
};

const formatDate = (value: string) => value;

const initialProfile: Profile = {
  firstName: '',
  lastName: '',
  phone: '',
  city: '',
  email: '',
};

const initialSections: Record<string, Section> = {
  summary: {
    id: 'summary',
    type: 'summary',
    title: 'Podsumowanie',
    content: '',
  },
  experience: {
    id: 'experience',
    type: 'experience',
    title: 'Doświadczenie',
    items: [],
  },
  education: {
    id: 'education',
    type: 'education',
    title: 'Edukacja',
    items: [],
  },
  languages: {
    id: 'languages',
    type: 'languages',
    title: 'Języki',
    items: [],
  },
};

const AtsResumeBuilder = () => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [sectionsOrder, setSectionsOrder] = useState<string[]>([
    'summary',
    'experience',
    'education',
    'languages',
  ]);
  const [sectionsById, setSectionsById] = useState<Record<string, Section>>(initialSections);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  const [jobText, setJobText] = useState('');
  const [jobMatch, setJobMatch] = useState({ score: 0, missing: [] as string[] });
  const [cvScale, setCvScale] = useState(0.85);
  const [cvPosition, setCvPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pages, setPages] = useState<string[][]>([]);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  const orderedSections = useMemo(
    () => sectionsOrder.map((id) => sectionsById[id]).filter(Boolean),
    [sectionsOrder, sectionsById]
  );

  const header = useMemo(
    () => `${profile.firstName} ${profile.lastName}`.trim(),
    [profile.firstName, profile.lastName]
  );

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const container = measureRef.current;
    const ratioProbe = container.querySelector('[data-mm-probe]') as HTMLElement | null;
    const headerEl = container.querySelector('[data-header]') as HTMLElement | null;
    if (!ratioProbe) return;
    const mmRatio = ratioProbe.getBoundingClientRect().width / 100;
    const pageHeight = PAGE_HEIGHT_MM * mmRatio;
    const padding = PAGE_PADDING_MM * mmRatio;
    const contentHeight = pageHeight - padding * 2;
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;

    const nextPages: string[][] = [];
    let currentPage: string[] = [];
    let remaining = contentHeight - headerHeight;

    orderedSections.forEach((section) => {
      const sectionEl = container.querySelector(
        `[data-section-id="${section.id}"]`
      ) as HTMLElement | null;
      const height = sectionEl?.offsetHeight ?? 0;

      if (height > remaining && currentPage.length > 0) {
        nextPages.push(currentPage);
        currentPage = [];
        remaining = contentHeight;
      }

      currentPage.push(section.id);
      remaining -= height;
    });

    if (currentPage.length) {
      nextPages.push(currentPage);
    }

    setPages(nextPages.length ? nextPages : [[]]);
  }, [orderedSections, header]);

  const handleZoom = (delta: number) => {
    setCvScale((prev) => Math.min(1.2, Math.max(0.6, prev + delta)));
  };

  const resetView = () => {
    setCvScale(0.85);
    setCvPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX - cvPosition.x, y: event.clientY - cvPosition.y });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    setCvPosition({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const applyMatch = () => {
    const result = calculateMatch(jobText, orderedSections);
    setJobMatch({ score: result.score, missing: result.missing.slice(0, 12) });
  };

  const atsValidation = validateResume(profile);

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    const headerHtml = '';
    const pagesHtml = previewRef.current.innerHTML;
    const html = buildResumeHtml({ headerHtml, pagesHtml });
    const printWindow = window.open('', 'cv-print');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const updateSectionTitle = (id: string, title: string) => {
    setSectionsById((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        title,
      } as Section,
    }));
  };

  const updateProfile = (patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  const addCustomSection = () => {
    const id = makeId();
    setSectionsById((prev) => ({
      ...prev,
      [id]: {
        id,
        type: 'custom',
        title: 'Nowa sekcja',
        content: '',
      },
    }));
    setSectionsOrder((prev) => [...prev, id]);
  };

  const removeCustomSection = (id: string) => {
    if (['summary', 'experience', 'education', 'languages'].includes(id)) return;
    setSectionsById((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setSectionsOrder((prev) => prev.filter((sectionId) => sectionId !== id));
  };

  const addExperience = () => {
    setSectionsById((prev) => {
      const section = prev.experience as ExperienceSection;
      return {
        ...prev,
        experience: {
          ...section,
          items: [
            ...section.items,
            {
              id: makeId(),
              company: '',
              role: '',
              startDate: '',
              endDate: '',
              description: '',
            },
          ],
        },
      };
    });
  };

  const updateExperience = (itemId: string, patch: Partial<ExperienceSection['items'][number]>) => {
    setSectionsById((prev) => {
      const section = prev.experience as ExperienceSection;
      return {
        ...prev,
        experience: {
          ...section,
          items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
        },
      };
    });
  };

  const removeExperience = (itemId: string) => {
    setSectionsById((prev) => {
      const section = prev.experience as ExperienceSection;
      return {
        ...prev,
        experience: {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        },
      };
    });
  };

  const addEducation = () => {
    setSectionsById((prev) => {
      const section = prev.education as EducationSection;
      return {
        ...prev,
        education: {
          ...section,
          items: [
            ...section.items,
            {
              id: makeId(),
              school: '',
              degree: '',
              startDate: '',
              endDate: '',
              description: '',
            },
          ],
        },
      };
    });
  };

  const updateEducation = (itemId: string, patch: Partial<EducationSection['items'][number]>) => {
    setSectionsById((prev) => {
      const section = prev.education as EducationSection;
      return {
        ...prev,
        education: {
          ...section,
          items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
        },
      };
    });
  };

  const removeEducation = (itemId: string) => {
    setSectionsById((prev) => {
      const section = prev.education as EducationSection;
      return {
        ...prev,
        education: {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        },
      };
    });
  };

  const addLanguage = () => {
    setSectionsById((prev) => {
      const section = prev.languages as LanguagesSection;
      return {
        ...prev,
        languages: {
          ...section,
          items: [
            ...section.items,
            {
              id: makeId(),
              name: '',
              level: 'B1',
            },
          ],
        },
      };
    });
  };

  const updateLanguage = (itemId: string, patch: Partial<LanguagesSection['items'][number]>) => {
    setSectionsById((prev) => {
      const section = prev.languages as LanguagesSection;
      return {
        ...prev,
        languages: {
          ...section,
          items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
        },
      };
    });
  };

  const removeLanguage = (itemId: string) => {
    setSectionsById((prev) => {
      const section = prev.languages as LanguagesSection;
      return {
        ...prev,
        languages: {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        },
      };
    });
  };

  const handleSectionDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleSectionDrop = (targetId: string) => {
    if (!draggedSection || draggedSection === targetId) {
      setDraggedSection(null);
      return;
    }
    const currentOrder = [...sectionsOrder];
    const draggedIndex = currentOrder.indexOf(draggedSection);
    const targetIndex = currentOrder.indexOf(targetId);
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedSection);
    setSectionsOrder(currentOrder);
    setDraggedSection(null);
  };

  const renderSection = (section: Section, headingLevel: 'h2' | 'h3' = 'h2') => {
    const HeadingTag = headingLevel;

    if (section.type === 'summary' || section.type === 'custom') {
      return (
        <section data-section-id={section.id} className="space-y-2">
          <HeadingTag className="text-base font-semibold uppercase tracking-[0.08em] text-gray-900">
            {section.title}
          </HeadingTag>
          <div
            className="prose prose-sm max-w-none text-sm text-gray-900"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </section>
      );
    }

    if (section.type === 'experience') {
      const typedSection = section as ExperienceSection;
      return (
        <section data-section-id={section.id} className="space-y-3">
          <HeadingTag className="text-base font-semibold uppercase tracking-[0.08em] text-gray-900">
            {section.title}
          </HeadingTag>
          <div className="space-y-4">
            {typedSection.items.map((item) => (
              <div key={item.id} className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {item.role || 'Stanowisko'} — {item.company || 'Firma'}
                </h3>
                <p className="text-xs text-gray-600">
                  {formatDate(item.startDate)} - {formatDate(item.endDate) || 'obecnie'}
                </p>
                <div
                  className="prose prose-sm max-w-none text-sm text-gray-900"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section.type === 'education') {
      const typedSection = section as EducationSection;
      return (
        <section data-section-id={section.id} className="space-y-3">
          <HeadingTag className="text-base font-semibold uppercase tracking-[0.08em] text-gray-900">
            {section.title}
          </HeadingTag>
          <div className="space-y-4">
            {typedSection.items.map((item) => (
              <div key={item.id} className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {item.school || 'Uczelnia'} — {item.degree || 'Kierunek'}
                </h3>
                <p className="text-xs text-gray-600">
                  {formatDate(item.startDate)} - {formatDate(item.endDate) || 'obecnie'}
                </p>
                <div
                  className="prose prose-sm max-w-none text-sm text-gray-900"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
            ))}
          </div>
        </section>
      );
    }

    const typedSection = section as LanguagesSection;
    return (
      <section data-section-id={section.id} className="space-y-3">
        <HeadingTag className="text-base font-semibold uppercase tracking-[0.08em] text-gray-900">
          {section.title}
        </HeadingTag>
        <ul className="space-y-1 text-sm text-gray-900">
          {typedSection.items.map((item) => (
            <li key={item.id}>
              {item.name} — {item.level}
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="font-poppins">
      <div className="grid h-[calc(100vh-80px)] grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">ATS-first kreator CV</h1>
            <p className="text-xs text-gray-500">
              Jedna kolumna, czytelny tekst, wspólny HTML dla podglądu i PDF.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <section className="space-y-3 rounded border border-gray-100 bg-gray-50 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-700">
                Dane kontaktowe
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-gray-500">
                  Imię
                  <input
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    value={profile.firstName}
                    onChange={(event) => updateProfile({ firstName: event.target.value })}
                  />
                </label>
                <label className="space-y-1 text-xs text-gray-500">
                  Nazwisko
                  <input
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    value={profile.lastName}
                    onChange={(event) => updateProfile({ lastName: event.target.value })}
                  />
                </label>
                <label className="space-y-1 text-xs text-gray-500">
                  Telefon
                  <input
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    value={profile.phone}
                    onChange={(event) => updateProfile({ phone: event.target.value })}
                  />
                </label>
                <label className="space-y-1 text-xs text-gray-500">
                  Miasto
                  <input
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    value={profile.city}
                    onChange={(event) => updateProfile({ city: event.target.value })}
                  />
                </label>
                <label className="space-y-1 text-xs text-gray-500 sm:col-span-2">
                  E-mail
                  <input
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    value={profile.email}
                    onChange={(event) => updateProfile({ email: event.target.value })}
                  />
                </label>
              </div>
            </section>

            <section className="mt-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-700">
                Kolejność sekcji
              </h2>
              <div className="space-y-2">
                {sectionsOrder.map((sectionId) => (
                  <div
                    key={sectionId}
                    draggable
                    onDragStart={() => handleSectionDragStart(sectionId)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleSectionDrop(sectionId)}
                    className="flex items-center justify-between rounded border border-gray-200 bg-white p-3 text-sm"
                  >
                    <span className="font-medium">
                      {sectionsById[sectionId]?.title ?? 'Sekcja'}
                    </span>
                    <span className="text-xs text-gray-400">drag</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addCustomSection}
                className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-900"
              >
                Dodaj sekcję własną
              </button>
            </section>

            <section className="mt-6 space-y-5">
              {orderedSections.map((section) => {
                if (section.type === 'summary') {
                  return (
                    <div key={section.id} className="rounded border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <input
                          className="w-full border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-[0.08em]"
                          value={section.title}
                          onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                        />
                      </div>
                      <div className="mt-3">
                        <RichTextEditor
                          value={section.content}
                          onChange={(content) =>
                            setSectionsById((prev) => ({
                              ...prev,
                              summary: {
                                ...(prev.summary as Section),
                                content,
                              } as Section,
                            }))
                          }
                        />
                      </div>
                    </div>
                  );
                }

                if (section.type === 'experience') {
                  const typedSection = section as ExperienceSection;
                  return (
                    <div key={section.id} className="rounded border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <input
                          className="w-full border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-[0.08em]"
                          value={section.title}
                          onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                        />
                        <button
                          type="button"
                          onClick={addExperience}
                          className="ml-3 rounded border border-gray-200 px-2 py-1 text-xs"
                        >
                          + pozycja
                        </button>
                      </div>
                      <div className="mt-4 space-y-4">
                        {typedSection.items.map((item) => (
                          <div key={item.id} className="rounded border border-gray-100 p-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <input
                                className="rounded border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Firma"
                                value={item.company}
                                onChange={(event) =>
                                  updateExperience(item.id, {
                                    company: event.target.value,
                                  })
                                }
                              />
                              <input
                                className="rounded border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Stanowisko"
                                value={item.role}
                                onChange={(event) =>
                                  updateExperience(item.id, {
                                    role: event.target.value,
                                  })
                                }
                              />
                              <input
                                className="rounded border border-gray-200 px-3 py-2 text-sm"
                                placeholder="MM.RRRR"
                                value={item.startDate}
                                onChange={(event) =>
                                  updateExperience(item.id, {
                                    startDate: event.target.value,
                                  })
                                }
                              />
                              <input
                                className="rounded border border-gray-200 px-3 py-2 text-sm"
                                placeholder="MM.RRRR"
                                value={item.endDate}
                                onChange={(event) =>
                                  updateExperience(item.id, {
                                    endDate: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="mt-3">
                              <RichTextEditor
                                value={item.description}
                                onChange={(content) =>
                                  updateExperience(item.id, {
                                    description: content,
                                  })
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExperience(item.id)}
                              className="mt-3 text-xs text-red-500"
                            >
                              Usuń pozycję
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (section.type === 'education') {
                  const typedSection = section as EducationSection;
                  return (
                    <div key={section.id} className="rounded border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <input
                          className="w-full border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-[0.08em]"
                          value={section.title}
                          onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                        />
                        <button
                          type="button"
                          onClick={addEducation}
                          className="ml-3 rounded border border-gray-200 px-2 py-1 text-xs"
                        >
                          + pozycja
                        </button>
                      </div>
                      <div className="mt-4 space-y-4">
                        {typedSection.items.map((item) => (
                          <div key={item.id} className="rounded border border-gray-100 p-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <input
                                className="rounded border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Uczelnia"
                                value={item.school}
                                onChange={(event) =>
                                  updateEducation(item.id, {
                                    school: event.target.value,
                                  })
                                }
                              />
                              <input
                                className="rounded border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Kierunek"
                                value={item.degree}
                                onChange={(event) =>
                                  updateEducation(item.id, {
                                    degree: event.target.value,
                                  })
                                }
                              />
                              <input
                                className="rounded border border-gray-200 px-3 py-2 text-sm"
                                placeholder="MM.RRRR"
                                value={item.startDate}
                                onChange={(event) =>
                                  updateEducation(item.id, {
                                    startDate: event.target.value,
                                  })
                                }
                              />
                              <input
                                className="rounded border border-gray-200 px-3 py-2 text-sm"
                                placeholder="MM.RRRR"
                                value={item.endDate}
                                onChange={(event) =>
                                  updateEducation(item.id, {
                                    endDate: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="mt-3">
                              <RichTextEditor
                                value={item.description}
                                onChange={(content) =>
                                  updateEducation(item.id, {
                                    description: content,
                                  })
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEducation(item.id)}
                              className="mt-3 text-xs text-red-500"
                            >
                              Usuń pozycję
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (section.type === 'languages') {
                  const typedSection = section as LanguagesSection;
                  return (
                    <div key={section.id} className="rounded border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <input
                          className="w-full border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-[0.08em]"
                          value={section.title}
                          onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                        />
                        <button
                          type="button"
                          onClick={addLanguage}
                          className="ml-3 rounded border border-gray-200 px-2 py-1 text-xs"
                        >
                          + język
                        </button>
                      </div>
                      <div className="mt-4 space-y-3">
                        {typedSection.items.map((item) => (
                          <div key={item.id} className="grid gap-3 sm:grid-cols-2">
                            <input
                              className="rounded border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Język"
                              value={item.name}
                              onChange={(event) =>
                                updateLanguage(item.id, {
                                  name: event.target.value,
                                })
                              }
                            />
                            <input
                              className="rounded border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Poziom"
                              value={item.level}
                              onChange={(event) =>
                                updateLanguage(item.id, {
                                  level: event.target.value,
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeLanguage(item.id)}
                              className="text-xs text-red-500"
                            >
                              Usuń
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={section.id} className="rounded border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <input
                        className="w-full border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-[0.08em]"
                        value={section.title}
                        onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomSection(section.id)}
                        className="ml-3 text-xs text-red-500"
                      >
                        Usuń sekcję
                      </button>
                    </div>
                    <div className="mt-3">
                      <RichTextEditor
                        value={section.content}
                        onChange={(content) =>
                          setSectionsById((prev) => ({
                            ...prev,
                            [section.id]: {
                              ...section,
                              content,
                            } as Section,
                          }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Podgląd A4</h2>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleZoom(-0.05)}
                  className="rounded border border-gray-200 px-2 py-1 text-xs"
                >
                  -
                </button>
                <span className="text-xs text-gray-500">{Math.round(cvScale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => handleZoom(0.05)}
                  className="rounded border border-gray-200 px-2 py-1 text-xs"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="rounded border border-gray-200 px-2 py-1 text-xs"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="rounded border border-gray-200 px-2 py-1 text-xs"
                >
                  PDF
                </button>
              </div>
            </div>
            <div
              className="relative h-[calc(100vh-260px)] overflow-hidden bg-gray-50"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className={`absolute left-1/2 top-6 flex flex-col items-center gap-6 ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{
                  transform: `translate(-50%, 0) translate(${cvPosition.x}px, ${cvPosition.y}px) scale(${cvScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <div ref={previewRef} className="flex flex-col gap-6">
                  {pages.map((pageSections, index) => (
                    <div
                      key={`page-${index}`}
                      className="rounded border border-gray-200 bg-white shadow"
                      style={{ width: `${PAGE_WIDTH_MM}mm`, height: `${PAGE_HEIGHT_MM}mm` }}
                    >
                      <div
                        className="flex h-full flex-col"
                        style={{ padding: `${PAGE_PADDING_MM}mm` }}
                      >
                        {index === 0 && (
                          <div data-header className="space-y-1 text-gray-900">
                            <h1 className="text-xl font-semibold">{header || 'Twoje imię'}</h1>
                            <p className="text-xs">
                              {[profile.phone, profile.city, profile.email]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                        )}
                        <div className="mt-4 flex flex-col gap-4">
                          {pageSections.map((sectionId) => {
                            const section = sectionsById[sectionId];
                            return section ? (
                              <React.Fragment key={section.id}>
                                {renderSection(section)}
                              </React.Fragment>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div ref={measureRef} className="pointer-events-none absolute -left-[9999px]">
                <div data-mm-probe style={{ width: '100mm', height: '0px' }} />
                <div
                  className="w-[210mm]"
                  style={{ padding: `${PAGE_PADDING_MM}mm` }}
                >
                  <div data-header className="space-y-1 text-gray-900">
                    <h1 className="text-xl font-semibold">{header || 'Twoje imię'}</h1>
                    <p className="text-xs">
                      {[profile.phone, profile.city, profile.email].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col gap-4">
                    {orderedSections.map((section) => (
                      <React.Fragment key={section.id}>{renderSection(section)}</React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-700">
              AI Suite & Dopasowanie
            </h2>
            <label className="mt-3 block text-xs text-gray-500">
              Treść oferty (wklej tutaj)
            </label>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded border border-gray-200 p-3 text-sm"
              value={jobText}
              onChange={(event) => setJobText(event.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyMatch}
                className="rounded border border-gray-200 px-3 py-2 text-xs"
              >
                Policz dopasowanie
              </button>
              <span className="text-xs text-gray-500">
                Wynik: <strong>{jobMatch.score}%</strong>
              </span>
            </div>
            {jobMatch.missing.length > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                Brakujące słowa kluczowe: {jobMatch.missing.join(', ')}
              </div>
            )}
            <div className="mt-4 rounded border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
              <div>
                ATS Ready: <strong>{atsValidation.ready ? 'TAK' : 'NIE'}</strong>
              </div>
              {atsValidation.issues.length > 0 && (
                <ul className="mt-2 list-disc pl-4">
                  {atsValidation.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtsResumeBuilder;
