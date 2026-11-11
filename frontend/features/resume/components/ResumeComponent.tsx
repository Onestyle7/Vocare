'use client';

import {
  Award,
  Bold,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  GraduationCap,
  GripVertical,
  Home,
  Italic,
  Languages,
  Mail,
  MapPin,
  MessageCircleQuestion,
  Move,
  PencilLine,
  Phone,
  Save,
  StarsIcon,
  Tag,
  Trash2,
  Underline,
  User,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { download_propfile_cv, offer_type } from '@/features/marketing/constants';
import { useAutosave } from '@/lib/hooks/useAutosave';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { CvDetailsDto, CvDto, CvLimits } from '@/lib/types/cv';
import { getEducationDegreeLabel } from '@/lib/types/profile';
import { makeClientId } from '@/lib/utils/id';
import { FLUENCY_OPTIONS, getFluencyLabel, normalizeFluency } from '@/lib/utils/normalizeFluency';
import { makeSocialLinkId, SOCIAL_LINK_SUGGESTIONS } from '@/lib/utils/socialLinks';
import { trackConversion } from '@/lib/utils/tracking';
import {
  normalizeResponsibilitiesForPayload,
  responsibilityLinesToText,
  textToResponsibilityLines,
} from '@/lib/utils/workResponsibilities';

import { RESUME_PREVIEW_LABELS, type ResumePreviewLanguage } from '../constants';
import { useResumeDetailsActions } from '../hooks/useResumeDetailsActions';
import {
  getParagraphFragments,
  measureParagraphLines,
  paginateSections,
  type SectionChunk,
} from '../utils/cvPagination';
import { claimLegacyHobbiesForCv } from '../utils/legacyHobbies';
import { reorderResumeItemByOffset, reorderResumeItems } from '../utils/reorderResumeItems';
import { CvAnalysisDrawer } from './CvAnalysisDrawer';
import { DatePickerWithCurrent } from './DatePickerWithCurrent';
import { MobileCvEditor, type MobileEditorMode } from './mobile/MobileCvEditor';
import { ResumeAnalysisPromoButton } from './ResumeAnalysisPromoButton';
import type {
  Certificate,
  Education,
  Experience,
  Hobby,
  Language,
  PersonalInfo,
  PrivacyStatement,
  Project,
  Skill,
  SocialLink,
} from './resumeEditorTypes';
import TailorCvFromEditorDialog, {
  TailorCvMode,
  TailorCvSubmitResult,
} from './TailorCvFromEditorDialog';

interface CVCreatorProps {
  initialCv?: CvDetailsDto;
  initialLimits?: CvLimits | null;
}

type FormattingType = 'bold' | 'italic' | 'underline';

type FormattingState = Record<FormattingType, boolean>;

const createDefaultFormattingState = (): FormattingState => ({
  bold: false,
  italic: false,
  underline: false,
});

const EMPTY_FORMATTING_STATE: FormattingState = Object.freeze({
  bold: false,
  italic: false,
  underline: false,
}) as FormattingState;

const DEFAULT_SECTION_ORDER = [
  'profile',
  'experience',
  'projects',
  'education',
  'certificates',
  'skills',
  'languages',
  'hobbies',
  'privacy',
] as const;

type ReorderableItemSection =
  | 'experience'
  | 'projects'
  | 'education'
  | 'certificates'
  | 'skills'
  | 'languages'
  | 'hobbies';

interface DraggedResumeItem {
  sectionId: ReorderableItemSection;
  itemId: string;
}

const PRIVACY_CONSENT_TEMPLATES: Record<ResumePreviewLanguage, string> = {
  pl: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (RODO).',
  en: 'I hereby give consent for my personal data included in this application to be processed for the purposes of the recruitment process under the Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data (GDPR).',
};

const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  country: '',
  socialLinks: [],
  profession: '',
  summary: '',
};

// The privacy clause closes a CV, so it stays last whatever order was saved or dragged.
const pinPrivacyLast = (order: string[]): string[] => [
  ...order.filter((id) => id !== 'privacy'),
  'privacy',
];

const mergeSectionOrder = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_SECTION_ORDER];
  }

  const savedOrder = value.filter(
    (id): id is (typeof DEFAULT_SECTION_ORDER)[number] =>
      typeof id === 'string' &&
      DEFAULT_SECTION_ORDER.includes(id as (typeof DEFAULT_SECTION_ORDER)[number])
  );
  const mergedOrder = [...savedOrder];

  DEFAULT_SECTION_ORDER.forEach((id, index) => {
    if (mergedOrder.includes(id)) {
      return;
    }

    const nextKnownSection = DEFAULT_SECTION_ORDER.slice(index + 1).find((nextId) =>
      mergedOrder.includes(nextId)
    );

    if (!nextKnownSection) {
      mergedOrder.push(id);
      return;
    }

    mergedOrder.splice(mergedOrder.indexOf(nextKnownSection), 0, id);
  });

  return pinPrivacyLast(mergedOrder);
};

const normalizeExternalUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
};

const RichTextToolbar = ({
  onFormat,
  className = '',
  formattingState,
}: {
  onFormat: (type: FormattingType) => void;
  className?: string;
  formattingState: FormattingState;
}) => {
  const baseButtonClass =
    'flex h-8 w-8 items-center justify-center rounded border text-sm transition';
  const activeClass = 'border-[#915EFF] bg-[#915EFF]/10 text-[#915EFF]';
  const inactiveClass = 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        className={`${baseButtonClass} ${formattingState.bold ? activeClass : inactiveClass}`}
        aria-label="Bold"
        aria-pressed={formattingState.bold}
        onClick={() => onFormat('bold')}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`${baseButtonClass} ${formattingState.italic ? activeClass : inactiveClass}`}
        aria-label="Italic"
        aria-pressed={formattingState.italic}
        onClick={() => onFormat('italic')}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`${baseButtonClass} ${formattingState.underline ? activeClass : inactiveClass}`}
        aria-label="Underline"
        aria-pressed={formattingState.underline}
        onClick={() => onFormat('underline')}
      >
        <Underline className="h-4 w-4" />
      </button>
    </div>
  );
};

const ensureExperienceDefaults = (exp: Partial<Experience>): Experience => ({
  id: typeof exp.id === 'string' && exp.id.length > 0 ? exp.id : makeClientId(),
  company: exp.company ?? '',
  position: exp.position ?? '',
  startDate: exp.startDate ?? '',
  endDate: exp.endDate ?? '',
  responsibilities: exp.responsibilities ?? [],
  isCurrent: Boolean(exp.isCurrent),
  useBulletList: Boolean(exp.useBulletList),
});

const ensureEducationDefaults = (edu: Partial<Education>): Education => ({
  id: typeof edu.id === 'string' && edu.id.length > 0 ? edu.id : makeClientId(),
  school: edu.school ?? '',
  degree: edu.degree ?? '',
  field: edu.field ?? '',
  startDate: edu.startDate ?? '',
  endDate: edu.endDate ?? '',
  isCurrent: Boolean(edu.isCurrent),
  description: edu.description ?? '',
});

const ensureProjectDefaults = (project: Partial<Project>): Project => ({
  id: typeof project.id === 'string' && project.id.length > 0 ? project.id : makeClientId(),
  title: project.title ?? '',
  url: project.url ?? '',
  description: project.description ?? '',
});

const ensureCertificateDefaults = (cert: Partial<Certificate>): Certificate => ({
  id: typeof cert.id === 'string' && cert.id.length > 0 ? cert.id : makeClientId(),
  name: cert.name ?? '',
  date: cert.date ?? '',
  hasDate: cert.hasDate ?? Boolean(cert.date),
});

const CVCreator: React.FC<CVCreatorProps> = ({ initialCv, initialLimits = null }) => {
  const router = useRouter();
  const {
    handleAutosave,
    handleGetCvLimits,
    handleLoadFromProfile,
    handleCreateTailoredCopy,
    handleReplaceWithTailoredCv,
  } = useResumeDetailsActions();
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => {
    const saved = localStorage.getItem('personalInfo');
    if (!saved) {
      return DEFAULT_PERSONAL_INFO;
    }

    try {
      const parsed = JSON.parse(saved);

      // Migracja: stare githubUrl → socialLinks
      if ('githubUrl' in parsed && !('socialLinks' in parsed)) {
        parsed.socialLinks = parsed.githubUrl?.trim()
          ? [{ id: makeSocialLinkId(), label: 'GitHub', url: parsed.githubUrl }]
          : [];
        delete parsed.githubUrl;
      }

      return {
        ...DEFAULT_PERSONAL_INFO,
        ...parsed,
      };
    } catch (err) {
      console.warn('Failed to parse stored personal info', err);
      return DEFAULT_PERSONAL_INFO;
    }
  });

  const [isPremium] = useState(false);
  const [cvId, setCvId] = useState<string | null>(initialCv?.id ?? null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isTailorDialogOpen, setIsTailorDialogOpen] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isCheckingCvLimits, setIsCheckingCvLimits] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [cvLimits, setCvLimits] = useState<CvLimits | null>(initialLimits);
  const [highlightedFormSection, setHighlightedFormSection] = useState<string | null>(null);
  const [resumeName] = useState<string>(initialCv?.name ?? 'New Resume');
  const hydratedCvIdRef = useRef<string | null>(null);
  const pendingAutosaveHydrationRef = useRef<'saved' | 'needs-save' | null>(null);
  const editorOperationRef = useRef<'save' | 'profile' | 'tailor' | null>(null);
  const limitsRequestRef = useRef(0);
  const isMobile = useIsMobile();
  const [mobileMode, setMobileMode] = useState<MobileEditorMode>('edit');

  // Pagination (computed from measured pages)
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<SectionChunk[][]>([]);

  const summaryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const experienceTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const educationTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Page spec in mm to match print/PDF exactly
  const PAGE_WIDTH_MM = 210;
  const PAGE_HEIGHT_MM = 297;
  const PAGE_PADDING_MM = 15;

  // Measurement/preview refs
  const mmRatioRef = useRef<number | null>(null); // px per 1mm
  const [mmRatio, setMmRatio] = useState<number | null>(null); // state to trigger recompute
  const measureContainerRef = useRef<HTMLDivElement | null>(null);
  const pagesViewportRef = useRef<HTMLDivElement | null>(null);
  const zoomWrapperRef = useRef<HTMLDivElement | null>(null);

  const [experiences, setExperiences] = useState<Experience[]>(() => {
    const saved = localStorage.getItem('experiences');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ensureExperienceDefaults(item));
    } catch (err) {
      console.warn('Failed to parse stored experiences', err);
      return [];
    }
  });
  const [education, setEducation] = useState<Education[]>(() => {
    const saved = localStorage.getItem('education');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ensureEducationDefaults(item));
    } catch (err) {
      console.warn('Failed to parse stored education entries', err);
      return [];
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('projects');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ensureProjectDefaults(item));
    } catch (err) {
      console.warn('Failed to parse stored projects', err);
      return [];
    }
  });

  const [skills, setSkills] = useState<Skill[]>(() => {
    const saved = localStorage.getItem('skills');
    return saved ? JSON.parse(saved) : [];
  });
  const [hobbies, setHobbies] = useState<Hobby[]>(() => {
    const saved = localStorage.getItem('hobbies');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFullDates, setShowFullDates] = useState(true);
  const [resumePreviewLanguage, setResumePreviewLanguage] = useState<ResumePreviewLanguage>('pl');
  const previewLabels = RESUME_PREVIEW_LABELS[resumePreviewLanguage];
  const [languages, setLanguages] = useState<Language[]>(() => {
    const saved = localStorage.getItem('languages');
    return saved ? JSON.parse(saved) : [];
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('certificates');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ensureCertificateDefaults(item));
    } catch (err) {
      console.warn('Failed to parse stored certificates', err);
      return [];
    }
  });

  const [privacyStatement, setPrivacyStatement] = useState<PrivacyStatement>(() => {
    const saved = localStorage.getItem('privacyStatement');
    return saved ? JSON.parse(saved) : { id: 'privacy', content: '' };
  });

  const [summaryFormatting, setSummaryFormatting] = useState<FormattingState>(
    createDefaultFormattingState()
  );
  const [experienceFormattingState, setExperienceFormattingState] = useState<
    Record<string, FormattingState>
  >({});
  const [educationFormattingState, setEducationFormattingState] = useState<
    Record<string, FormattingState>
  >({});
  const dragIntentSectionRef = useRef<string | null>(null);
  const activeDraggedItemRef = useRef<DraggedResumeItem | null>(null);
  const dragOverItemRef = useRef<DraggedResumeItem | null>(null);
  const pointerScrollContainerRef = useRef<HTMLElement | null>(null);
  const pointerPositionRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const pointerAutoScrollFrameRef = useRef<number | null>(null);
  const sectionHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CV Preview controls
  const getDefaultScale = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 1024px)').matches ? 0.5 : 0.8;
    }
    return 0.8;
  };
  const [cvScale, setCvScale] = useState(getDefaultScale);
  const [cvPosition, setCvPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('sectionOrder');
    if (!saved) {
      return [...DEFAULT_SECTION_ORDER];
    }

    try {
      return mergeSectionOrder(JSON.parse(saved));
    } catch (err) {
      console.warn('Failed to parse stored section order', err);
      return [...DEFAULT_SECTION_ORDER];
    }
  });
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedResumeItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<DraggedResumeItem | null>(null);
  const [keyboardGrabbedItem, setKeyboardGrabbedItem] = useState<DraggedResumeItem | null>(null);

  const updateDragOverItem = (nextItem: DraggedResumeItem | null) => {
    const currentItem = dragOverItemRef.current;
    if (
      currentItem?.sectionId === nextItem?.sectionId &&
      currentItem?.itemId === nextItem?.itemId
    ) {
      return;
    }

    dragOverItemRef.current = nextItem;
    setDragOverItem(nextItem);
  };

  const [isHovered, setIsHovered] = useState(false);

  // Save personalInfo to localStorage
  useEffect(() => {
    localStorage.setItem('personalInfo', JSON.stringify(personalInfo));
  }, [personalInfo]);

  // Save experiences to localStorage
  useEffect(() => {
    localStorage.setItem('experiences', JSON.stringify(experiences));
  }, [experiences]);

  // Save education to localStorage
  useEffect(() => {
    localStorage.setItem('education', JSON.stringify(education));
  }, [education]);

  // Save projects to localStorage
  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  // Save skills to localStorage
  useEffect(() => {
    localStorage.setItem('skills', JSON.stringify(skills));
  }, [skills]);

  // Save languages to localStorage
  useEffect(() => {
    localStorage.setItem('languages', JSON.stringify(languages));
  }, [languages]);

  // Save certificates to localStorage
  useEffect(() => {
    localStorage.setItem('certificates', JSON.stringify(certificates));
  }, [certificates]);

  // Save hobbies to localStorage
  useEffect(() => {
    localStorage.setItem('hobbies', JSON.stringify(hobbies));
  }, [hobbies]);

  // Save privacyStatement to localStorage
  useEffect(() => {
    localStorage.setItem('privacyStatement', JSON.stringify(privacyStatement));
  }, [privacyStatement]);

  // Save sectionOrder to localStorage
  useEffect(() => {
    localStorage.setItem('sectionOrder', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  const updateSummaryFormattingFromSelection = React.useCallback(() => {
    const textarea = summaryTextareaRef.current;
    if (!textarea) return;
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const nextFormatting = computeFormattingState(
      personalInfo.summary || '',
      selectionStart,
      selectionEnd
    );

    setSummaryFormatting((prev) => {
      if (
        prev.bold === nextFormatting.bold &&
        prev.italic === nextFormatting.italic &&
        prev.underline === nextFormatting.underline
      ) {
        return prev;
      }
      return nextFormatting;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalInfo.summary]);

  useEffect(() => {
    requestAnimationFrame(updateSummaryFormattingFromSelection);
  }, [updateSummaryFormattingFromSelection]);

  useEffect(() => {
    setExperienceFormattingState((prev) => {
      const next: Record<string, FormattingState> = {};
      experiences.forEach((exp) => {
        next[exp.id] = prev[exp.id] ?? createDefaultFormattingState();
      });
      return next;
    });
  }, [experiences]);

  useEffect(() => {
    setEducationFormattingState((prev) => {
      const next: Record<string, FormattingState> = {};
      education.forEach((edu) => {
        next[edu.id] = prev[edu.id] ?? createDefaultFormattingState();
      });
      return next;
    });
  }, [education]);

  // Measured pagination will re-compute via dedicated effect below

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .cv-section { break-inside: avoid; page-break-inside: avoid; }
      .cv-page { background: #fff; }
      .cv-text { overflow-wrap: anywhere; word-break: normal; }
      .cv-text * { min-width: 0; }
      @media print {
        body { background: #fff !important; }
        .cv-page { width: 210mm; height: 297mm; page-break-after: always; box-shadow: none !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(
    () => () => {
      if (sectionHighlightTimeoutRef.current) clearTimeout(sectionHighlightTimeoutRef.current);
      if (pointerAutoScrollFrameRef.current !== null) {
        cancelAnimationFrame(pointerAutoScrollFrameRef.current);
      }
    },
    []
  );

  const addLanguage = () => {
    const newLanguage: Language = {
      id: makeClientId(),
      name: '',
      level: 'Beginner',
    };
    setLanguages((prev) => [...prev, newLanguage]);
  };

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    setLanguages((prev) =>
      prev.map((lang) => (lang.id === id ? { ...lang, [field]: value } : lang))
    );
  };

  const removeLanguage = (id: string) => {
    setLanguages((prev) => prev.filter((lang) => lang.id !== id));
  };

  const addCertificate = () => {
    const newCert: Certificate = {
      id: makeClientId(),
      name: '',
      date: '',
      hasDate: true,
    };
    setCertificates((prev) => [...prev, newCert]);
  };

  const updateCertificate = (id: string, field: keyof Certificate, value: string | boolean) => {
    setCertificates((prev) =>
      prev.map((cert) => {
        if (cert.id !== id) return cert;
        if (field === 'hasDate' && typeof value === 'boolean') {
          return { ...cert, hasDate: value };
        }
        return { ...cert, [field]: value } as Certificate;
      })
    );
  };

  const removeCertificate = (id: string) => {
    setCertificates((prev) => prev.filter((cert) => cert.id !== id));
  };

  // Section drag & drop handlers
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
    if (activeDraggedItemRef.current) {
      e.preventDefault();
      e.stopPropagation();
      updateDragOverItem(null);
      return;
    }

    if (dragIntentSectionRef.current !== sectionId) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    dragIntentSectionRef.current = null;
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionId: string) => {
    if (activeDraggedItemRef.current) {
      e.preventDefault();
      e.stopPropagation();
      updateDragOverItem(null);
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionId);
  };

  const handleSectionDragLeave = () => {
    setDragOverSection(null);
  };

  const handleSectionDrop = (e: React.DragEvent, targetSectionId: string) => {
    if (activeDraggedItemRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.preventDefault();

    if (!draggedSection || draggedSection === targetSectionId) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }

    const currentOrder = [...sectionOrder];
    const draggedIndex = currentOrder.indexOf(draggedSection);
    const targetIndex = currentOrder.indexOf(targetSectionId);

    // Remove dragged item and insert at new position
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedSection);

    setSectionOrder(pinPrivacyLast(currentOrder));
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
    dragIntentSectionRef.current = null;
  };

  const reorderItemsInSection = (
    sectionId: ReorderableItemSection,
    draggedItemId: string,
    targetItemId: string
  ) => {
    switch (sectionId) {
      case 'experience':
        setExperiences((items) => reorderResumeItems(items, draggedItemId, targetItemId));
        break;
      case 'projects':
        setProjects((items) => reorderResumeItems(items, draggedItemId, targetItemId));
        break;
      case 'education':
        setEducation((items) => reorderResumeItems(items, draggedItemId, targetItemId));
        break;
      case 'certificates':
        setCertificates((items) => reorderResumeItems(items, draggedItemId, targetItemId));
        break;
      case 'skills':
        setSkills((items) => reorderResumeItems(items, draggedItemId, targetItemId));
        break;
      case 'languages':
        setLanguages((items) => reorderResumeItems(items, draggedItemId, targetItemId));
        break;
      case 'hobbies':
        setHobbies((items) => reorderResumeItems(items, draggedItemId, targetItemId));
        break;
    }
  };

  const moveItemInSection = (sectionId: ReorderableItemSection, itemId: string, offset: -1 | 1) => {
    switch (sectionId) {
      case 'experience':
        setExperiences((items) => reorderResumeItemByOffset(items, itemId, offset));
        break;
      case 'projects':
        setProjects((items) => reorderResumeItemByOffset(items, itemId, offset));
        break;
      case 'education':
        setEducation((items) => reorderResumeItemByOffset(items, itemId, offset));
        break;
      case 'certificates':
        setCertificates((items) => reorderResumeItemByOffset(items, itemId, offset));
        break;
      case 'skills':
        setSkills((items) => reorderResumeItemByOffset(items, itemId, offset));
        break;
      case 'languages':
        setLanguages((items) => reorderResumeItemByOffset(items, itemId, offset));
        break;
      case 'hobbies':
        setHobbies((items) => reorderResumeItemByOffset(items, itemId, offset));
        break;
    }
  };

  const handleItemDragStart = (
    e: React.DragEvent,
    sectionId: ReorderableItemSection,
    itemId: string
  ) => {
    const nextDraggedItem = { sectionId, itemId };
    activeDraggedItemRef.current = nextDraggedItem;
    setDraggedItem(nextDraggedItem);
    setKeyboardGrabbedItem(null);
    updateDragOverItem(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${sectionId}:${itemId}`);
    e.stopPropagation();
  };

  const handleItemDragOver = (
    e: React.DragEvent,
    sectionId: ReorderableItemSection,
    itemId: string
  ) => {
    const activeItem = activeDraggedItemRef.current;
    if (!activeItem) return;

    e.preventDefault();
    e.stopPropagation();

    if (activeItem.sectionId !== sectionId) {
      e.dataTransfer.dropEffect = 'none';
      updateDragOverItem(null);
      return;
    }

    e.dataTransfer.dropEffect = 'move';
    updateDragOverItem({ sectionId, itemId });
  };

  const clearItemDragState = () => {
    activeDraggedItemRef.current = null;
    pointerPositionRef.current = null;
    pointerScrollContainerRef.current = null;
    if (pointerAutoScrollFrameRef.current !== null) {
      cancelAnimationFrame(pointerAutoScrollFrameRef.current);
      pointerAutoScrollFrameRef.current = null;
    }
    setDraggedItem(null);
    updateDragOverItem(null);
  };

  const handleItemDrop = (
    e: React.DragEvent,
    sectionId: ReorderableItemSection,
    targetItemId: string
  ) => {
    const activeItem = activeDraggedItemRef.current;
    if (!activeItem) return;

    e.preventDefault();
    e.stopPropagation();

    if (activeItem.sectionId === sectionId) {
      reorderItemsInSection(sectionId, activeItem.itemId, targetItemId);
    }

    clearItemDragState();
  };

  const handleItemDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    clearItemDragState();
  };

  const getPointerDropTarget = (
    clientX: number,
    clientY: number,
    sectionId: ReorderableItemSection
  ) => {
    const element = document.elementFromPoint(clientX, clientY);
    const target = element?.closest<HTMLElement>('[data-reorder-section][data-reorder-item-id]');

    if (!target || target.dataset.reorderSection !== sectionId) return null;
    return target.dataset.reorderItemId || null;
  };

  const getScrollableAncestor = (element: HTMLElement) => {
    let current = element.parentElement;

    while (current && current !== document.body) {
      const overflowY = window.getComputedStyle(current).overflowY;
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        current.scrollHeight > current.clientHeight
      ) {
        return current;
      }
      current = current.parentElement;
    }

    return document.scrollingElement as HTMLElement | null;
  };

  const runPointerAutoScroll = (): void => {
    const activeItem = activeDraggedItemRef.current;
    const pointerPosition = pointerPositionRef.current;

    if (!activeItem || !pointerPosition) {
      pointerAutoScrollFrameRef.current = null;
      return;
    }

    const scrollContainer = pointerScrollContainerRef.current;
    const usesViewport =
      !scrollContainer ||
      scrollContainer === document.scrollingElement ||
      scrollContainer === document.documentElement ||
      scrollContainer === document.body;
    const containerRect = usesViewport ? null : scrollContainer.getBoundingClientRect();
    const topEdge = containerRect ? Math.max(0, containerRect.top) : 0;
    const bottomEdge = containerRect
      ? Math.min(window.innerHeight, containerRect.bottom)
      : window.innerHeight;
    const edgeSize = Math.min(72, Math.max(32, (bottomEdge - topEdge) / 4));
    let scrollDelta = 0;

    if (pointerPosition.clientY < topEdge + edgeSize) {
      const intensity = Math.min(1, (topEdge + edgeSize - pointerPosition.clientY) / edgeSize);
      scrollDelta = -Math.max(2, Math.round(18 * intensity));
    } else if (pointerPosition.clientY > bottomEdge - edgeSize) {
      const intensity = Math.min(1, (pointerPosition.clientY - (bottomEdge - edgeSize)) / edgeSize);
      scrollDelta = Math.max(2, Math.round(18 * intensity));
    }

    if (scrollDelta !== 0) {
      if (scrollContainer) {
        scrollContainer.scrollTop += scrollDelta;
      } else {
        window.scrollBy({ top: scrollDelta });
      }

      const targetItemId = getPointerDropTarget(
        pointerPosition.clientX,
        pointerPosition.clientY,
        activeItem.sectionId
      );
      updateDragOverItem(
        targetItemId ? { sectionId: activeItem.sectionId, itemId: targetItemId } : null
      );
    }

    pointerAutoScrollFrameRef.current = requestAnimationFrame(runPointerAutoScroll);
  };

  const handleItemPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    sectionId: ReorderableItemSection,
    itemId: string
  ) => {
    if (e.pointerType === 'mouse') return;

    e.preventDefault();
    const nextDraggedItem = { sectionId, itemId };
    activeDraggedItemRef.current = nextDraggedItem;
    setDraggedItem(nextDraggedItem);
    setKeyboardGrabbedItem(null);
    updateDragOverItem(null);
    pointerPositionRef.current = { clientX: e.clientX, clientY: e.clientY };
    pointerScrollContainerRef.current = getScrollableAncestor(e.currentTarget);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointerAutoScrollFrameRef.current === null) {
      pointerAutoScrollFrameRef.current = requestAnimationFrame(runPointerAutoScroll);
    }
  };

  const handleItemPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') return;

    const activeItem = activeDraggedItemRef.current;
    if (!activeItem) return;

    e.preventDefault();
    pointerPositionRef.current = { clientX: e.clientX, clientY: e.clientY };
    const targetItemId = getPointerDropTarget(e.clientX, e.clientY, activeItem.sectionId);
    updateDragOverItem(
      targetItemId ? { sectionId: activeItem.sectionId, itemId: targetItemId } : null
    );
  };

  const handleItemPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') return;

    const activeItem = activeDraggedItemRef.current;
    if (!activeItem) return;

    e.preventDefault();
    const targetItemId = getPointerDropTarget(e.clientX, e.clientY, activeItem.sectionId);
    if (targetItemId) {
      reorderItemsInSection(activeItem.sectionId, activeItem.itemId, targetItemId);
    }

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    clearItemDragState();
  };

  const handleItemPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    clearItemDragState();
  };

  const isDraggedItem = (sectionId: ReorderableItemSection, itemId: string) =>
    draggedItem?.sectionId === sectionId && draggedItem.itemId === itemId;

  const isItemDragTarget = (sectionId: ReorderableItemSection, itemId: string) =>
    dragOverItem?.sectionId === sectionId &&
    dragOverItem.itemId === itemId &&
    !isDraggedItem(sectionId, itemId);

  const getReorderableItemClassName = (
    sectionId: ReorderableItemSection,
    itemId: string,
    baseClassName: string
  ) =>
    `${baseClassName} transition-all ${
      isItemDragTarget(sectionId, itemId) ? '!bg-violet-50 ring-2 ring-[#915EFF]' : ''
    } ${isDraggedItem(sectionId, itemId) ? 'opacity-50' : ''}`;

  const getItemDropProps = (sectionId: ReorderableItemSection, itemId: string) => ({
    'data-reorder-section': sectionId,
    'data-reorder-item-id': itemId,
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => handleItemDragOver(e, sectionId, itemId),
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        const currentTarget = dragOverItemRef.current;
        if (currentTarget?.sectionId === sectionId && currentTarget.itemId === itemId) {
          updateDragOverItem(null);
        }
      }
    },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => handleItemDrop(e, sectionId, itemId),
  });

  const renderItemDragHandle = (
    sectionId: ReorderableItemSection,
    itemId: string,
    label: string,
    className = 'mr-2 h-10 w-6 self-start'
  ) => {
    const isKeyboardGrabbed =
      keyboardGrabbedItem?.sectionId === sectionId && keyboardGrabbedItem.itemId === itemId;

    return (
      <button
        type="button"
        className={`${className} inline-flex shrink-0 cursor-grab touch-none items-center justify-center border-0 bg-transparent p-0 text-gray-400 transition-colors select-none hover:text-[#915EFF] active:cursor-grabbing`}
        data-item-drag-handle="true"
        draggable
        aria-label={`${isKeyboardGrabbed ? 'Upuść' : 'Zmień kolejność'}: ${label}`}
        aria-pressed={isKeyboardGrabbed}
        aria-keyshortcuts="ArrowUp ArrowDown"
        title="Przeciągnij lub użyj strzałek, aby zmienić kolejność"
        onDragStart={(e) => handleItemDragStart(e, sectionId, itemId)}
        onDragEnd={handleItemDragEnd}
        onPointerDown={(e) => handleItemPointerDown(e, sectionId, itemId)}
        onPointerMove={handleItemPointerMove}
        onPointerUp={handleItemPointerUp}
        onPointerCancel={handleItemPointerCancel}
        onClick={(e) => {
          if (e.detail !== 0) return;
          setKeyboardGrabbedItem((current) =>
            current?.sectionId === sectionId && current.itemId === itemId
              ? null
              : { sectionId, itemId }
          );
        }}
        onBlur={() => {
          setKeyboardGrabbedItem((current) =>
            current?.sectionId === sectionId && current.itemId === itemId ? null : current
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setKeyboardGrabbedItem(null);
            return;
          }
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault();
          e.stopPropagation();
          setKeyboardGrabbedItem({ sectionId, itemId });
          moveItemInSection(sectionId, itemId, e.key === 'ArrowUp' ? -1 : 1);
        }}
      >
        <GripVertical size={18} />
      </button>
    );
  };

  const renderItemActionRail = (
    sectionId: ReorderableItemSection,
    itemId: string,
    label: string,
    onRemove: () => void
  ) => (
    <div
      className="mr-2 flex w-7 shrink-0 flex-col items-center gap-1 self-start"
      data-item-action-rail="true"
    >
      {renderItemDragHandle(sectionId, itemId, label, 'h-8 w-7')}
      <button
        type="button"
        data-item-delete-button="true"
        onClick={onRemove}
        className="pointer-events-auto inline-flex h-8 w-7 items-center justify-center rounded p-0 text-red-500 opacity-100 transition-all hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:outline-none sm:pointer-events-none sm:opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100"
        aria-label={`Usuń: ${label}`}
        title={`Usuń: ${label}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const addExperience = () => {
    const newExp: Experience = {
      id: makeClientId(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      responsibilities: [],
      isCurrent: false,
      useBulletList: false,
    };
    setExperiences((prev) => [...prev, newExp]);
  };

  const updateExperience = (
    id: string,
    field: keyof Experience,
    value: string | boolean | string[]
  ) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id !== id) return exp;

        if (field === 'isCurrent' && typeof value === 'boolean') {
          return { ...exp, isCurrent: value };
        }

        return { ...exp, [field]: value } as Experience;
      })
    );
  };

  const setExperienceResponsibilitiesTokens = (id: string, tokens: string) => {
    setExperiences((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, responsibilities: textToResponsibilityLines(tokens) } : exp
      )
    );
  };

  const removeExperience = (id: string) => {
    delete experienceTextareaRefs.current[id];
    setExperiences((prev) => prev.filter((exp) => exp.id !== id));
    setExperienceFormattingState((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: makeClientId(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    };
    setEducation((prev) => [...prev, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    setEducation((prev) =>
      prev.map((edu) => {
        if (edu.id !== id) return edu;

        if (field === 'description' && typeof value === 'string') {
          return {
            ...edu,
            description: mergePlainWithTokens(edu.description, value),
          };
        }

        if (field === 'isCurrent' && typeof value === 'boolean') {
          return { ...edu, isCurrent: value };
        }

        return { ...edu, [field]: value };
      })
    );
  };

  const setEducationDescriptionTokens = (id: string, tokens: string) => {
    setEducation((prev) =>
      prev.map((edu) => (edu.id === id ? { ...edu, description: tokens } : edu))
    );
  };

  const removeEducation = (id: string) => {
    delete educationTextareaRefs.current[id];
    setEducation((prev) => prev.filter((edu) => edu.id !== id));
    setEducationFormattingState((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addProject = () => {
    const newProject: Project = {
      id: makeClientId(),
      title: '',
      url: '',
      description: '',
    };
    setProjects((prev) => [...prev, newProject]);
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setProjects((prev) =>
      prev.map((project) => (project.id === id ? { ...project, [field]: value } : project))
    );
  };

  const removeProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: makeClientId(),
      name: '',
    };
    setSkills((prev) => [...prev, newSkill]);
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    setSkills((prev) =>
      prev.map((skill) => (skill.id === id ? { ...skill, [field]: value } : skill))
    );
  };

  const removeSkill = (id: string) => {
    setSkills((prev) => prev.filter((skill) => skill.id !== id));
  };

  const addHobby = () => {
    const newHobby: Hobby = { id: makeClientId(), name: '' };
    setHobbies((prev) => [...prev, newHobby]);
  };

  const updateHobby = (id: string, field: keyof Hobby, value: string) => {
    setHobbies((prev) =>
      prev.map((hobby) => (hobby.id === id ? { ...hobby, [field]: value } : hobby))
    );
  };

  const removeHobby = (id: string) => {
    setHobbies((prev) => prev.filter((hobby) => hobby.id !== id));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    if (showFullDates) {
      return date.toLocaleDateString(previewLabels.locale, { year: 'numeric', month: 'long' });
    } else {
      return date.getFullYear().toString();
    }
  };

  const privacyConsentTemplate = PRIVACY_CONSENT_TEMPLATES[resumePreviewLanguage];
  const hasPrivacyConsentTemplate = privacyStatement.content.includes(privacyConsentTemplate);

  const applyPrivacyConsentTemplate = () => {
    setPrivacyStatement((prev) => {
      const current = prev.content.trim();
      return {
        ...prev,
        content: current ? `${current}\n\n${privacyConsentTemplate}` : privacyConsentTemplate,
      };
    });
  };

  const handleZoomIn = () => {
    setCvScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setCvScale((prev) => Math.max(prev - 0.1, 0.3));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cvPosition.x,
      y: e.clientY - cvPosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCvPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setCvScale(getDefaultScale());
    setCvPosition({ x: 0, y: 0 });
  };

  // px-per-mm calibration (once)
  useLayoutEffect(() => {
    if (mmRatioRef.current) return;
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.width = '100mm';
    probe.style.height = '10mm';
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    const ratioW = rect.width / 100;
    mmRatioRef.current = ratioW || 3.78; // ~96dpi fallback
    setMmRatio(mmRatioRef.current);
    document.body.removeChild(probe);
  }, []);

  const pageContentHeightPx = useMemo(() => {
    const mm = mmRatio ?? mmRatioRef.current ?? 3.78;
    const innerHeightMm = PAGE_HEIGHT_MM - 2 * PAGE_PADDING_MM;
    return innerHeightMm * mm;
  }, [mmRatio, PAGE_HEIGHT_MM, PAGE_PADDING_MM]);

  const goToNextPage = () => scrollToPage(Math.min(currentPage + 1, pages.length));
  const goToPrevPage = () => scrollToPage(Math.max(currentPage - 1, 1));
  const goToPage = (page: number) => scrollToPage(page);

  const scrollToPage = (page: number) => {
    const container = pagesViewportRef.current;
    if (!container) return;
    const pagesEls = container.querySelectorAll<HTMLElement>('.cv-page');
    const el = pagesEls[page - 1];
    if (!el) return;
    setCurrentPage(page);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // old pagination helpers removed (replaced by scrollToPage)

  const formattingTokens: Record<FormattingType, { prefix: string; suffix: string }> = {
    bold: { prefix: '**', suffix: '**' },
    italic: { prefix: '_', suffix: '_' },
    underline: { prefix: '__', suffix: '__' },
  };

  const TOKEN_MARKERS = ['**', '__', '_'] as const;

  const getTokenLengthAt = (value: string, index: number) => {
    for (const marker of TOKEN_MARKERS) {
      if (value.startsWith(marker, index)) {
        return marker.length;
      }
    }
    return 0;
  };

  const stripFormattingTokens = (value: string) => {
    if (!value) return '';
    let result = '';
    for (let i = 0; i < value.length; ) {
      const tokenLength = getTokenLengthAt(value, i);
      if (tokenLength) {
        i += tokenLength;
        continue;
      }
      result += value[i];
      i += 1;
    }
    return result;
  };

  const plainToTokenIndex = (value: string, plainIndex: number) => {
    let tokenIndex = 0;
    let plainCounter = 0;

    while (tokenIndex < value.length && plainCounter < plainIndex) {
      const tokenLength = getTokenLengthAt(value, tokenIndex);
      if (tokenLength) {
        tokenIndex += tokenLength;
        continue;
      }
      tokenIndex += 1;
      plainCounter += 1;
    }

    return tokenIndex;
  };

  const tokenToPlainIndex = (value: string, tokenIndex: number) => {
    let idx = 0;
    let plainCounter = 0;

    while (idx < value.length && idx < tokenIndex) {
      const tokenLength = getTokenLengthAt(value, idx);
      if (tokenLength) {
        idx += tokenLength;
        continue;
      }
      idx += 1;
      plainCounter += 1;
    }

    return plainCounter;
  };

  const mergePlainWithTokens = (tokenValue: string, plainValue: string) => {
    let result = '';
    let tokenIndex = 0;
    let plainIndex = 0;

    while (tokenIndex < tokenValue.length && plainIndex < plainValue.length) {
      const tokenLength = getTokenLengthAt(tokenValue, tokenIndex);
      if (tokenLength) {
        result += tokenValue.slice(tokenIndex, tokenIndex + tokenLength);
        tokenIndex += tokenLength;
        continue;
      }

      result += plainValue[plainIndex];
      tokenIndex += 1;
      plainIndex += 1;
    }

    if (plainIndex < plainValue.length) {
      result += plainValue.slice(plainIndex);
    }

    while (tokenIndex < tokenValue.length) {
      const tokenLength = getTokenLengthAt(tokenValue, tokenIndex);
      if (tokenLength) {
        result += tokenValue.slice(tokenIndex, tokenIndex + tokenLength);
        tokenIndex += tokenLength;
      } else {
        tokenIndex += 1;
      }
    }

    return result;
  };

  const wrapSelectionWithTokens = (
    value: string,
    selectionStart: number,
    selectionEnd: number,
    type: FormattingType
  ) => {
    if (selectionEnd <= selectionStart) {
      return {
        text: value,
        selectionStart,
        selectionEnd,
      };
    }

    const token = formattingTokens[type];
    const before = value.slice(0, selectionStart);
    const selectedText = value.slice(selectionStart, selectionEnd);
    const after = value.slice(selectionEnd);
    const formatted = `${before}${token.prefix}${selectedText}${token.suffix}${after}`;
    const newSelectionStart = selectionStart + token.prefix.length;
    const newSelectionEnd = newSelectionStart + selectedText.length;
    return {
      text: formatted,
      selectionStart: newSelectionStart,
      selectionEnd: newSelectionEnd,
    };
  };

  const detectTokenAt = (
    value: string,
    index: number
  ): { type: FormattingType; length: number } | null => {
    if (value.startsWith('**', index)) {
      return { type: 'bold', length: 2 };
    }
    if (value.startsWith('__', index)) {
      return { type: 'underline', length: 2 };
    }
    if (value.startsWith('_', index)) {
      return { type: 'italic', length: 1 };
    }
    return null;
  };

  const parseFormattingRanges = (
    value: string
  ): Record<
    FormattingType,
    Array<{ plainStart: number; plainEnd: number; tokenStart: number; suffixIndex: number }>
  > => {
    const stack: Record<FormattingType, Array<{ tokenIndex: number; plainIndex: number }>> = {
      bold: [],
      italic: [],
      underline: [],
    };
    const ranges: Record<
      FormattingType,
      Array<{ plainStart: number; plainEnd: number; tokenStart: number; suffixIndex: number }>
    > = {
      bold: [],
      italic: [],
      underline: [],
    };

    let tokenIndex = 0;
    let plainIndex = 0;

    while (tokenIndex < value.length) {
      const token = detectTokenAt(value, tokenIndex);
      if (token) {
        const { type, length } = token;
        if (stack[type].length > 0) {
          const start = stack[type].pop()!;
          ranges[type].push({
            plainStart: start.plainIndex,
            plainEnd: plainIndex,
            tokenStart: start.tokenIndex,
            suffixIndex: tokenIndex,
          });
        } else {
          stack[type].push({ tokenIndex, plainIndex });
        }
        tokenIndex += length;
        continue;
      }

      tokenIndex += 1;
      plainIndex += 1;
    }

    return ranges;
  };

  const isStyleActiveInRange = (
    ranges: Array<{ plainStart: number; plainEnd: number }>,
    start: number,
    end: number,
    plainLength: number
  ) => {
    if (!ranges.length) return false;

    if (start === end) {
      if (plainLength === 0) return false;
      const pos = Math.max(0, Math.min(start, plainLength - 1));
      return ranges.some((range) => pos >= range.plainStart && pos < range.plainEnd);
    }

    return ranges.some((range) => start >= range.plainStart && end <= range.plainEnd);
  };

  const computeFormattingState = (
    value: string,
    selectionStartPlain: number,
    selectionEndPlain: number
  ): FormattingState => {
    const plainLength = stripFormattingTokens(value).length;
    const start = Math.max(0, Math.min(selectionStartPlain, plainLength));
    const end = Math.max(0, Math.min(selectionEndPlain, plainLength));
    const normalizedEnd = Math.max(start, end);
    const ranges = parseFormattingRanges(value);

    return {
      bold: isStyleActiveInRange(ranges.bold, start, normalizedEnd, plainLength),
      italic: isStyleActiveInRange(ranges.italic, start, normalizedEnd, plainLength),
      underline: isStyleActiveInRange(ranges.underline, start, normalizedEnd, plainLength),
    };
  };

  const toggleFormatting = (
    type: FormattingType,
    value: string,
    selectionStartPlain: number,
    selectionEndPlain: number
  ) => {
    const plainLength = stripFormattingTokens(value).length;
    const start = Math.max(0, Math.min(selectionStartPlain, plainLength));
    const end = Math.max(0, Math.min(selectionEndPlain, plainLength));
    const normalizedEnd = Math.max(start, end);

    if (start === normalizedEnd) {
      return null;
    }

    const ranges = parseFormattingRanges(value);
    const rangeToToggle = ranges[type].find(
      (range) => start >= range.plainStart && normalizedEnd <= range.plainEnd
    );

    if (rangeToToggle) {
      const token = formattingTokens[type];
      const content = value.slice(
        rangeToToggle.tokenStart + token.prefix.length,
        rangeToToggle.suffixIndex
      );
      const newValue =
        value.slice(0, rangeToToggle.tokenStart) +
        content +
        value.slice(rangeToToggle.suffixIndex + token.suffix.length);

      return {
        value: newValue,
        selectionStart: start,
        selectionEnd: start + (normalizedEnd - start),
      };
    }

    const tokenSelectionStart = plainToTokenIndex(value, start);
    const tokenSelectionEnd = plainToTokenIndex(value, normalizedEnd);
    const wrapped = wrapSelectionWithTokens(value, tokenSelectionStart, tokenSelectionEnd, type);
    if (wrapped.text === value) {
      return null;
    }

    const newPlainStart = tokenToPlainIndex(wrapped.text, wrapped.selectionStart);
    const newPlainEnd = tokenToPlainIndex(wrapped.text, wrapped.selectionEnd);

    return {
      value: wrapped.text,
      selectionStart: newPlainStart,
      selectionEnd: newPlainEnd,
    };
  };

  const escapeHtml = (input: string) =>
    input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatRichTextToHtml = (input: string) => {
    if (!input) return '';
    let html = escapeHtml(input);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<span style="text-decoration: underline;">$1</span>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br />');
    return html;
  };

  const splitRichTextParagraphs = (input: string) =>
    input
      .split(/\r?\n\s*\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

  const applyFormattingToTextarea = (
    type: FormattingType,
    textarea: HTMLTextAreaElement | null,
    currentValue: string,
    onValueChange: (value: string) => void,
    refLookup?: () => HTMLTextAreaElement | null,
    afterUpdate?: (params: { value: string; selectionStart: number; selectionEnd: number }) => void
  ) => {
    if (!textarea) return;
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;

    const toggleResult = toggleFormatting(type, currentValue, selectionStart, selectionEnd);
    if (!toggleResult) return;

    onValueChange(toggleResult.value);

    const updateSelection = () => {
      const target = refLookup ? refLookup() : textarea;
      if (!target) return;
      target.focus();
      target.setSelectionRange(toggleResult.selectionStart, toggleResult.selectionEnd);
      afterUpdate?.(toggleResult);
    };

    requestAnimationFrame(updateSelection);
  };

  const handleSummaryFormatting = (type: FormattingType) => {
    applyFormattingToTextarea(
      type,
      summaryTextareaRef.current,
      personalInfo.summary || '',
      (value) => setPersonalInfo((prev) => ({ ...prev, summary: value })),
      () => summaryTextareaRef.current,
      ({ value, selectionStart, selectionEnd }) =>
        setSummaryFormatting(computeFormattingState(value, selectionStart, selectionEnd))
    );
  };

  const handleExperienceFormatting = (
    expId: string,
    currentValue: string,
    type: FormattingType
  ) => {
    const textarea = experienceTextareaRefs.current[expId];
    applyFormattingToTextarea(
      type,
      textarea,
      currentValue || '',
      (value) => setExperienceResponsibilitiesTokens(expId, value),
      () => experienceTextareaRefs.current[expId],
      ({ value, selectionStart, selectionEnd }) =>
        setExperienceFormattingState((prev) => ({
          ...prev,
          [expId]: computeFormattingState(value, selectionStart, selectionEnd),
        }))
    );
  };

  const handleEducationFormatting = (eduId: string, currentValue: string, type: FormattingType) => {
    const textarea = educationTextareaRefs.current[eduId];
    applyFormattingToTextarea(
      type,
      textarea,
      currentValue || '',
      (value) => setEducationDescriptionTokens(eduId, value),
      () => educationTextareaRefs.current[eduId],
      ({ value, selectionStart, selectionEnd }) =>
        setEducationFormattingState((prev) => ({
          ...prev,
          [eduId]: computeFormattingState(value, selectionStart, selectionEnd),
        }))
    );
  };

  const updateExperienceFormattingFromSelection = (id: string) => {
    const textarea = experienceTextareaRefs.current[id];
    if (!textarea) return;
    const exp = experiences.find((experience) => experience.id === id);
    if (!exp) return;
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    setExperienceFormattingState((prev) => ({
      ...prev,
      [id]: computeFormattingState(
        responsibilityLinesToText(exp.responsibilities),
        selectionStart,
        selectionEnd
      ),
    }));
  };

  const updateEducationFormattingFromSelection = (id: string) => {
    const textarea = educationTextareaRefs.current[id];
    if (!textarea) return;
    const edu = education.find((entry) => entry.id === id);
    if (!edu) return;
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    setEducationFormattingState((prev) => ({
      ...prev,
      [id]: computeFormattingState(edu.description, selectionStart, selectionEnd),
    }));
  };

  const populateFromCv = React.useCallback(
    (cv: CvDto, position?: string, hobbyNamesOverride?: string[]) => {
      const basics = cv.basics;
      const projectLinks = cv.projects ?? [];

      const socialLinks: SocialLink[] = (cv.social ?? [])
        .filter((s) => s.link.trim())
        .map((s) => ({
          id: makeSocialLinkId(),
          label: s.social,
          url: s.link,
        }));

      if (basics) {
        setPersonalInfo((prev) => ({
          firstName: basics.firstName,
          lastName: basics.lastName,
          email: basics.email,
          phone: basics.phoneNumber,
          address: basics.location?.city || '',
          country: basics.location?.country || '',
          socialLinks,
          profession: position ?? prev.profession,
          summary: basics.summary,
        }));
      } else {
        setPersonalInfo((prev) => ({
          ...prev,
          socialLinks,
        }));
      }

      setExperiences(
        cv.work?.map((w) =>
          ensureExperienceDefaults({
            id: makeClientId(),
            company: w.company || '',
            position: w.position || '',
            startDate: w.startDate || '',
            endDate: w.endDate && w.endDate !== 'Present' ? w.endDate : '',
            responsibilities: Array.isArray(w.responsibilities) ? w.responsibilities : [],
            isCurrent: w.endDate === 'Present',
            useBulletList: false,
          })
        ) || []
      );

      setEducation(
        cv.education?.map((e) =>
          ensureEducationDefaults({
            id: makeClientId(),
            school: e.institution || '',
            degree: e.degree || '',
            field: e.field || '',
            startDate: e.startDate || '',
            endDate: e.endDate && e.endDate !== 'Present' ? e.endDate : '',
            isCurrent: e.endDate === 'Present',
            description: (e as { description?: string })?.description || '',
          })
        ) || []
      );

      setProjects(
        projectLinks.map((project) =>
          ensureProjectDefaults({
            id: makeClientId(),
            title: project.name || '',
            url: project.link || '',
            description: project.description || '',
          })
        )
      );

      setCertificates(
        cv.certificates?.map((c) =>
          ensureCertificateDefaults({
            id: makeClientId(),
            name: c.name,
            date: c.date || '',
            hasDate: Boolean(c.date),
          })
        ) || []
      );

      setSkills(cv.skills?.map((skill) => ({ id: makeClientId(), name: skill })) || []);

      setLanguages(
        cv.languages?.map((l) => ({
          id: makeClientId(),
          name: l.language,
          level: normalizeFluency(l.fluency),
        })) || []
      );

      const hobbyNames = hobbyNamesOverride ?? cv.hobbies ?? [];
      setHobbies(hobbyNames.map((hobby) => ({ id: makeClientId(), name: hobby })));
    },
    []
  );

  const buildCvDto = (): CvDto => {
    return {
      basics: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        phoneNumber: personalInfo.phone,
        email: personalInfo.email,
        summary: personalInfo.summary,
        location: {
          city: personalInfo.address,
          country: personalInfo.country,
        },
      },
      work: experiences.map((w) => ({
        company: w.company,
        position: w.position,
        startDate: w.startDate,
        endDate: w.isCurrent ? 'Present' : w.endDate,
        responsibilities: normalizeResponsibilitiesForPayload(w.responsibilities),
      })),
      education: education.map((e) => ({
        institution: e.school,
        degree: e.degree,
        field: e.field,
        startDate: e.startDate,
        endDate: e.isCurrent ? 'Present' : e.endDate,
        description: e.description,
      })),
      certificates: certificates.map((c) => ({
        name: c.name,
        date: c.hasDate && c.date ? c.date : undefined,
      })),
      projects: projects
        .filter(
          (project) => project.title.trim() || project.url.trim() || project.description.trim()
        )
        .map((project) => ({
          name: project.title,
          link: normalizeExternalUrl(project.url),
          description: project.description,
        })),
      social: personalInfo.socialLinks
        .filter((s) => s.url.trim())
        .map((s) => ({
          social: s.label,
          link: normalizeExternalUrl(s.url),
        })),
      skills: skills.map((s) => s.name),
      languages: languages.map((l) => ({ language: l.name, fluency: l.level })),
      hobbies: hobbies.map((hobby) => hobby.name),
    };
  };

  const canAutosave = Boolean(cvId);

  const autosavePayload = {
    id: cvId!,
    name: resumeName,
    targetPosition: personalInfo.profession || undefined,
    cvData: buildCvDto(), // zakładam, że masz taką funkcję generującą aktualne dane CV
  };

  const autosaveFn = async (payload: typeof autosavePayload) => {
    await handleAutosave(payload);
  };

  const {
    status: autosaveStatus,
    trigger,
    pause: pauseAutosave,
    flush: flushAutosave,
    resume: resumeAutosave,
    reset: resetAutosave,
  } = useAutosave({
    value: autosavePayload,
    enabled: canAutosave,
    delay: 2000, // 2s od ostatniej zmiany
  });

  useEffect(() => {
    if (!canAutosave) return;

    const pendingHydration = pendingAutosaveHydrationRef.current;
    if (pendingHydration) {
      pendingAutosaveHydrationRef.current = null;
      if (pendingHydration === 'saved') {
        resetAutosave(autosavePayload);
      } else {
        trigger(autosaveFn);
      }
      resumeAutosave();
      return;
    }

    trigger(autosaveFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    personalInfo,
    experiences,
    education,
    projects,
    skills,
    languages,
    certificates,
    hobbies,
    privacyStatement,
    sectionOrder,
    resumeName,
  ]);

  const handleTailorCvFromEditor = async (
    values: { targetPosition: string; jobDescription: string },
    mode: TailorCvMode
  ): Promise<TailorCvSubmitResult> => {
    if (!cvId) {
      toast.error('Nie znaleziono aktualnie otwartego CV');
      return 'error';
    }

    if (editorOperationRef.current) {
      toast.info('Poczekaj na zakończenie trwającej operacji');
      return 'error';
    }

    editorOperationRef.current = 'tailor';
    setIsTailoring(true);
    pauseAutosave();

    try {
      await flushAutosave(autosaveFn);

      if (mode === 'copy') {
        const result = await handleCreateTailoredCopy({
          sourceCv: buildCvDto(),
          targetPosition: values.targetPosition,
          jobDescription: values.jobDescription,
        });

        if (result.status === 'limit-reached') {
          resumeAutosave();
          return 'limit-reached';
        }

        if (result.status === 'insufficient-tokens') {
          resumeAutosave();
          router.refresh();
          if (result.cleanupFailed) {
            toast.warning('Sprawdź listę swoich CV', {
              description:
                'Nie pobrano tokenów, ale utworzona kopia może nadal zajmować miejsce na Twoim koncie.',
            });
          }
          return 'insufficient-tokens';
        }

        if (result.status === 'error') {
          resumeAutosave();
          router.refresh();
          toast.error('Nie udało się utworzyć CV pod ofertę', {
            description: result.cleanupFailed
              ? 'Utworzona kopia może nadal zajmować miejsce. Sprawdź listę CV na dashboardzie.'
              : 'Bazowe CV nie zostało zastąpione. Przed ponowną próbą sprawdź listę CV.',
          });
          return 'error';
        }

        setIsTailorDialogOpen(false);
        toast.success('Utworzono CV pod ofertę', {
          description: 'Bazowe CV nadal jest dostępne jako osobny dokument.',
        });
        resumeAutosave();
        router.push(`/resume/${result.cv.id}`);
        return 'success';
      }

      const result = await handleReplaceWithTailoredCv({
        cvId,
        resumeName,
        targetPosition: values.targetPosition,
        jobDescription: values.jobDescription,
      });

      if (result.status === 'insufficient-tokens') {
        if (result.latestCv) {
          pendingAutosaveHydrationRef.current = 'saved';
          populateFromCv(result.latestCv.cvData, result.latestCv.targetPosition ?? '');
        } else {
          toast.error('Nie udało się potwierdzić stanu CV', {
            description: 'Odświeżamy kreator, aby nie nadpisać nowszej treści.',
          });
          window.location.reload();
          return 'error';
        }
        router.refresh();
        return 'insufficient-tokens';
      }

      if (result.status === 'error') {
        router.refresh();
        if (result.latestCv) {
          pendingAutosaveHydrationRef.current = 'saved';
          populateFromCv(result.latestCv.cvData, result.latestCv.targetPosition ?? '');
          setIsTailorDialogOpen(false);
          toast.error('Nie udało się potwierdzić całej operacji', {
            description:
              'Wczytaliśmy ostatni stan CV z serwera. Sprawdź jego treść przed ponowną próbą.',
          });
        } else {
          toast.error('Nie udało się potwierdzić stanu CV', {
            description: 'Odświeżamy kreator, aby nie nadpisać nowszej treści.',
          });
          window.location.reload();
        }
        return 'error';
      }

      pendingAutosaveHydrationRef.current = result.metadataSaved ? 'saved' : 'needs-save';
      populateFromCv(result.cv.cvData, values.targetPosition);
      setIsTailorDialogOpen(false);
      toast.success('CV zostało dopasowane pod ofertę', {
        description: 'Poprzednia wersja aktualnego CV została zastąpiona.',
      });

      if (!result.metadataSaved) {
        toast.warning('Spróbujemy zapisać stanowisko automatycznie', {
          description: 'Treść CV została już poprawnie dopasowana.',
        });
      }

      return 'success';
    } catch (error) {
      resumeAutosave();
      router.refresh();
      console.error('Failed to prepare CV for tailoring', error);
      toast.error('Nie udało się zakończyć operacji', {
        description: 'Odśwież listę CV i sprawdź dane przed ponowną próbą.',
      });
      return 'error';
    } finally {
      editorOperationRef.current = null;
      setIsTailoring(false);
    }
  };

  const handleOpenTailorDialog = () => {
    const requestId = ++limitsRequestRef.current;
    setCvLimits(null);
    setIsCheckingCvLimits(true);
    setIsTailorDialogOpen(true);

    void handleGetCvLimits().then((limits) => {
      if (limitsRequestRef.current !== requestId) return;
      setCvLimits(limits);
      setIsCheckingCvLimits(false);
    });
  };

  const handleSave = async () => {
    if (!cvId || editorOperationRef.current) return;

    editorOperationRef.current = 'save';
    setIsManualSaving(true);
    try {
      await flushAutosave(autosaveFn);
      toast.success('CV zostało zapisane');
    } catch (err) {
      console.error('Manual save failed', err);
      toast.error('Nie udało się zapisać CV');
    } finally {
      editorOperationRef.current = null;
      setIsManualSaving(false);
    }
  };

  const handleNavigateToFormSection = (sectionId: string) => {
    const sectionElement = document.querySelector<HTMLElement>(
      `[data-cv-form-section="${sectionId}"]`
    );
    if (!sectionElement) return;

    const findScrollParent = (element: HTMLElement): HTMLElement | null => {
      let parent = element.parentElement;
      while (parent) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          parent.scrollHeight > parent.clientHeight
        ) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    };

    const scrollParent = findScrollParent(sectionElement);
    let scrollSettleTimeout: ReturnType<typeof setTimeout> | null = null;
    let scrollFallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    let hasHighlighted = false;

    const highlightSection = () => {
      if (hasHighlighted) return;
      hasHighlighted = true;

      if (scrollSettleTimeout) clearTimeout(scrollSettleTimeout);
      if (scrollFallbackTimeout) clearTimeout(scrollFallbackTimeout);
      scrollParent?.removeEventListener('scroll', handleScroll);

      setHighlightedFormSection(sectionId);

      if (sectionHighlightTimeoutRef.current) {
        clearTimeout(sectionHighlightTimeoutRef.current);
      }
      sectionHighlightTimeoutRef.current = setTimeout(() => {
        setHighlightedFormSection((current) => (current === sectionId ? null : current));
      }, 1100);
    };

    const handleScroll = () => {
      if (scrollSettleTimeout) clearTimeout(scrollSettleTimeout);
      scrollSettleTimeout = setTimeout(highlightSection, 140);
    };

    scrollParent?.addEventListener('scroll', handleScroll, { passive: true });
    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Obsługuje także sekcję, która już znajduje się w docelowym miejscu.
    scrollSettleTimeout = setTimeout(highlightSection, 180);
    // Zabezpieczenie dla przeglądarek emitujących scroll bez wyraźnego końca.
    scrollFallbackTimeout = setTimeout(highlightSection, 1600);
  };

  const loadFromProfile = async () => {
    if (!cvId || editorOperationRef.current) return;

    editorOperationRef.current = 'profile';
    setIsLoadingProfile(true);
    pauseAutosave();

    try {
      await flushAutosave(autosaveFn);

      const generated = await handleLoadFromProfile(
        cvId,
        resumeName,
        personalInfo.profession,
        hobbies.map((hobby) => hobby.name)
      );

      pendingAutosaveHydrationRef.current = 'saved';
      populateFromCv(generated.cvData, generated.targetPosition || undefined);
    } catch (err) {
      resumeAutosave();
      console.error('Failed to load from profile', err);
    } finally {
      editorOperationRef.current = null;
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!initialCv || hydratedCvIdRef.current === initialCv.id) return;

    hydratedCvIdRef.current = initialCv.id;
    const shouldMigrateLegacyHobbies = initialCv.hasPersistedHobbies === false;
    const legacyHobbies = shouldMigrateLegacyHobbies
      ? claimLegacyHobbiesForCv(localStorage, initialCv.id)
      : [];

    pendingAutosaveHydrationRef.current = shouldMigrateLegacyHobbies ? 'needs-save' : 'saved';
    populateFromCv(
      initialCv.cvData,
      initialCv.targetPosition || undefined,
      legacyHobbies.length > 0 ? legacyHobbies : undefined
    );
    setCvId(initialCv.id);
  }, [initialCv, populateFromCv]);

  const downloadPDF = async () => {
    const container = pagesViewportRef.current;
    if (!container) return;

    const pagesNodes = Array.from(container.querySelectorAll<HTMLElement>('.cv-page'));
    if (pagesNodes.length === 0) return;

    const fileName =
      personalInfo.firstName && personalInfo.lastName
        ? `${personalInfo.firstName}_${personalInfo.lastName}_CV`
        : 'My_CV';

    // 1. Zbieramy wszystkie style (linki i tagi style)
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    const baseHref = document.querySelector('base')?.href ?? window.location.origin;

    // 2. CSS naprawczy tylko dla wydruku
    const printStyles = `
    html, body, .cv-page, .cv-page * {
      font-family: 'Poppins', sans-serif !important;
    }

    @media print {
      @page { size: A4; margin: 0; }
      body {
        margin: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      /* Usuwamy transformacje skali z podglądu, by kartka była 1:1 */
      .cv-page {
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        transform: none !important;
        width: 210mm !important;
        height: 297mm !important;
        page-break-after: always !important;
        break-after: page !important;
        display: block !important;
      }
    }
  `;

    const printFrame = document.createElement('iframe');
    Object.assign(printFrame.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
    });
    document.body.appendChild(printFrame);

    const printDoc = printFrame.contentDocument;
    if (!printDoc) return;

    const pagesMarkup = pagesNodes.map((page) => page.outerHTML).join('');

    let hasPrinted = false;
    printFrame.onload = async () => {
      if (hasPrinted) return;
      hasPrinted = true;

      const win = printFrame.contentWindow;
      if (!win) return;

      try {
        const fontWeights = [300, 400, 500, 600, 700, 800];
        await Promise.all(
          fontWeights.map((weight) =>
            win.document.fonts.load(`${weight} 16px Poppins`, 'Vocare CV')
          )
        );
        await win.document.fonts.ready;

        // Dwie klatki pozwalają przeglądarce przeliczyć layout już z Poppins.
        await new Promise<void>((resolve) => {
          win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve()));
        });
      } catch (error) {
        console.warn('Nie udało się załadować czcionki Poppins do eksportu PDF.', error);
      } finally {
        // Przed print(), bo okno drukowania blokuje stronę, dopóki użytkownik go nie zamknie
        trackConversion('Download');
        win.focus();
        win.print();

        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1000);
      }
    };

    printDoc.open();
    printDoc.write(`
    <!doctype html>
    <html class="light">
      <head>
        <title>${fileName}</title>
        <base href="${baseHref}" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
        />
        ${styles}
        <style>${printStyles}</style>
      </head>
      <body class="bg-white">
        ${pagesMarkup}
      </body>
    </html>
  `);
    printDoc.close();
  };

  // Section visibility helper (must match preview rendering conditions)
  const isSectionVisible = React.useCallback(
    (sectionId: string) => {
      switch (sectionId) {
        case 'profile':
          return Boolean(
            personalInfo.firstName ||
            personalInfo.lastName ||
            personalInfo.email ||
            personalInfo.phone ||
            personalInfo.address ||
            personalInfo.profession ||
            personalInfo.summary ||
            personalInfo.lastName ||
            personalInfo.email ||
            personalInfo.phone ||
            personalInfo.address ||
            personalInfo.profession ||
            personalInfo.summary
          );
        case 'experience':
          return experiences.length > 0;
        case 'projects':
          return projects.length > 0;
        case 'education':
          return education.length > 0;
        case 'certificates':
          return certificates.length > 0;
        case 'skills':
          return skills.length > 0;
        case 'languages':
          return languages.length > 0;
        case 'hobbies':
          return hobbies.length > 0;
        case 'privacy':
          return Boolean(privacyStatement.content && privacyStatement.content.trim().length > 0);
        default:
          return false;
      }
    },
    [
      personalInfo,
      experiences,
      projects,
      education,
      certificates,
      skills,
      languages,
      hobbies,
      privacyStatement,
    ]
  );

  // Web fonts change text metrics, so pages measured with the fallback font must be re-measured
  const [fontsVersion, setFontsVersion] = useState(0);
  useEffect(() => {
    if (!document.fonts) return; // jsdom
    let active = true;
    const remeasure = () => {
      if (active) setFontsVersion((version) => version + 1);
    };
    document.fonts.ready.then(remeasure);
    document.fonts.addEventListener('loadingdone', remeasure);
    return () => {
      active = false;
      document.fonts.removeEventListener('loadingdone', remeasure);
    };
  }, []);

  // Build measured pages: render invisible blocks, measure (including margins), then pack
  useLayoutEffect(() => {
    // Wait for mm calibration
    if (!mmRatioRef.current) return;
    const container = measureContainerRef.current;
    if (!container) return;

    const headerEl = container.querySelector<HTMLElement>('.cv-section[data-block-id="header"]');
    let headerHeight = 0;
    if (headerEl) {
      const cs = getComputedStyle(headerEl);
      const mt = parseFloat(cs.marginTop || '0') || 0;
      const mb = parseFloat(cs.marginBottom || '0') || 0;
      headerHeight = headerEl.offsetHeight + mt + mb; // include margins
    }

    const blocks = Array.from(
      container.querySelectorAll<HTMLElement>('.cv-section[data-block-id]')
    );
    const heights = new Map<string, number>();
    const sectionSpacing = new Map<string, number>();
    const sectionHeaderHeights = new Map<string, number>();
    const sectionItemHeights = new Map<string, Array<{ id: string; h: number }>>();
    blocks.forEach((el) => {
      const id = el.getAttribute('data-block-id');
      if (!id) return;
      if (id === 'header') return; // handled above

      // Total section height including margins
      const cs = getComputedStyle(el);
      const mt = parseFloat(cs.marginTop || '0') || 0;
      const mb = parseFloat(cs.marginBottom || '0') || 0;
      heights.set(id, el.offsetHeight + mt + mb);
      sectionSpacing.set(id, mt + mb);

      // Section header height (h3)
      const h3 = el.querySelector('h3');
      if (h3) {
        const csH = getComputedStyle(h3 as HTMLElement);
        const mth = parseFloat(csH.marginTop || '0') || 0;
        const mbh = parseFloat(csH.marginBottom || '0') || 0;
        sectionHeaderHeights.set(id, (h3 as HTMLElement).offsetHeight + mth + mbh);
      }

      // Items by section
      const items: Array<{ id: string; h: number }> = [];
      if (id === 'experience') {
        const nodes = el.querySelectorAll<HTMLElement>('.exp-item[data-item-id]');
        nodes.forEach((n) => {
          const csI = getComputedStyle(n);
          const mti = parseFloat(csI.marginTop || '0') || 0;
          const mbi = parseFloat(csI.marginBottom || '0') || 0;
          const itemId = n.getAttribute('data-item-id') || '';
          items.push({ id: itemId, h: n.offsetHeight + mti + mbi });
        });
      } else if (id === 'education') {
        const nodes = el.querySelectorAll<HTMLElement>('.edu-item[data-item-id]');
        nodes.forEach((n) => {
          const csI = getComputedStyle(n);
          const mti = parseFloat(csI.marginTop || '0') || 0;
          const mbi = parseFloat(csI.marginBottom || '0') || 0;
          const itemId = n.getAttribute('data-item-id') || '';
          items.push({ id: itemId, h: n.offsetHeight + mti + mbi });
        });
      } else if (id === 'projects') {
        const nodes = el.querySelectorAll<HTMLElement>('.project-item[data-item-id]');
        nodes.forEach((n) => {
          const csI = getComputedStyle(n);
          const mti = parseFloat(csI.marginTop || '0') || 0;
          const mbi = parseFloat(csI.marginBottom || '0') || 0;
          const itemId = n.getAttribute('data-item-id') || '';
          items.push({ id: itemId, h: n.offsetHeight + mti + mbi });
        });
      } else if (id === 'certificates') {
        const nodes = el.querySelectorAll<HTMLElement>('.cert-item[data-item-id]');
        nodes.forEach((n) => {
          const csI = getComputedStyle(n);
          const mti = parseFloat(csI.marginTop || '0') || 0;
          const mbi = parseFloat(csI.marginBottom || '0') || 0;
          const itemId = n.getAttribute('data-item-id') || '';
          items.push({ id: itemId, h: n.offsetHeight + mti + mbi });
        });
      } else if (id === 'profile') {
        const nodes = el.querySelectorAll<HTMLElement>('.para-item[data-item-id]');
        nodes.forEach((n) => {
          const csI = getComputedStyle(n);
          const mti = parseFloat(csI.marginTop || '0') || 0;
          const mbi = parseFloat(csI.marginBottom || '0') || 0;
          const itemId = n.getAttribute('data-item-id') || '';
          items.push({ id: itemId, h: n.offsetHeight + mti + mbi });
        });
      } else if (id === 'privacy') {
        // Plain text, so a paragraph longer than the page space left can continue line by line
        const nodes = el.querySelectorAll<HTMLElement>('.para-item[data-item-id]');
        nodes.forEach((n, i) => items.push(...measureParagraphLines(n, i)));
      }
      if (items.length) sectionItemHeights.set(id, items);
    });

    const SAFETY_PX = 4; // guard for rounding/borders
    const pagesAcc = paginateSections(
      sectionOrder
        .filter((id) => isSectionVisible(id))
        .map((id) => ({
          id,
          height: heights.get(id) ?? 0,
          titleHeight: sectionHeaderHeights.get(id) ?? 0,
          spacing: sectionSpacing.get(id) ?? 0,
          items: sectionItemHeights.get(id),
        })),
      { pageHeight: pageContentHeightPx - SAFETY_PX, firstPageOffset: headerHeight }
    );

    setPages(pagesAcc);
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), Math.max(pagesAcc.length, 1)));
  }, [
    personalInfo,
    experiences,
    education,
    projects,
    projects,
    skills,
    languages,
    certificates,
    hobbies,
    privacyStatement,
    sectionOrder,
    resumePreviewLanguage,
    pageContentHeightPx,
    isSectionVisible,
    fontsVersion,
  ]);

  // Keep currentPage in sync with scroll position
  useEffect(() => {
    const viewport = pagesViewportRef.current;
    if (!viewport) return;
    const pagesEls = viewport.querySelectorAll<HTMLElement>('.cv-page');
    if (!pagesEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const idx = Array.from(pagesEls).indexOf(visible[0].target as HTMLElement);
          if (idx >= 0) setCurrentPage(idx + 1);
        }
      },
      { root: viewport, threshold: [0.5] }
    );

    pagesEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages.length]);

  const renderSectionInForm = (sectionId: string) => {
    switch (sectionId) {
      case 'profile':
        return (
          <div
            key="profile"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'profile' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'profile' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'profile')}
            onDragOver={(e) => handleSectionDragOver(e, 'profile')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'profile')}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <span
                  className="mr-2 cursor-grab text-gray-400"
                  data-drag-handle="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag section"
                  onMouseDown={() => {
                    dragIntentSectionRef.current = 'profile';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'profile';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <User className="mr-2" size={20} />
                Profil osobisty
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Krótki opis na początku CV, który w 4–6 zdaniach podkreśla Twoje odpowiednie
              doświadczenie i kwalifikacje.
            </p>
            <RichTextToolbar
              className="mb-2"
              onFormat={handleSummaryFormatting}
              formattingState={summaryFormatting}
            />
            <textarea
              ref={summaryTextareaRef}
              placeholder="Project Manager z ponad 5-letnim doświadczeniem, poszukujący nowych możliwości zawodowych."
              value={stripFormattingTokens(personalInfo.summary || '')}
              onChange={(e) => {
                const plainValue = e.target.value;
                const selectionStart = e.target.selectionStart ?? 0;
                const selectionEnd = e.target.selectionEnd ?? selectionStart;
                const nextTokens = mergePlainWithTokens(personalInfo.summary || '', plainValue);
                setPersonalInfo((prev) => ({ ...prev, summary: nextTokens }));
                setSummaryFormatting(
                  computeFormattingState(nextTokens, selectionStart, selectionEnd)
                );
              }}
              onSelect={updateSummaryFormattingFromSelection}
              onKeyUp={updateSummaryFormattingFromSelection}
              onMouseUp={updateSummaryFormattingFromSelection}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex w-full items-center justify-end space-x-2">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm bg-gray-100">
                    <MessageCircleQuestion className="text-gray-400" size={20} />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="font-poppins w-80">
                  <div className="flex justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Czy to rzeczywiście mi pomoże?</h4>
                      <p className="text-sm">
                        Zdecydowanie tak. Nasze modele AI są trenowane specjalnie po to, aby
                        dopasowywać CV do wymagań algorytmów używanych przez rekruterów.
                      </p>
                      <div className="text-muted-foreground text-xs">Confirmed by 1000+ users.</div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <button
                className={`flex flex-row items-center justify-center rounded-sm border bg-[#915EFF] px-3 py-2 text-sm text-white transition-all hover:bg-[#713ae8] focus:outline-none ${isPremium ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                <span className="text-sm text-white">Popraw z AI</span>
                <StarsIcon className="ml-2 scale-70" />
              </button>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div
            key="experience"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'experience' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'experience' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'experience')}
            onDragOver={(e) => handleSectionDragOver(e, 'experience')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'experience')}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <span
                  className="mr-2 cursor-grab text-gray-400"
                  data-drag-handle="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag section"
                  onMouseDown={() => {
                    dragIntentSectionRef.current = 'experience';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'experience';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <Briefcase className="mr-2" size={20} />
                Doświadczenie zawodowe
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Przedstaw swoje osiągnięcia, opisując codzienne obowiązki w 3–6 zdaniach, a następnie
              wypisz co najmniej dwa kluczowe osiągnięcia.
            </p>
            {experiences.map((exp) => {
              const responsibilitiesText = responsibilityLinesToText(exp.responsibilities);
              const formattingState = experienceFormattingState[exp.id] ?? EMPTY_FORMATTING_STATE;

              return (
                <div
                  key={exp.id}
                  {...getItemDropProps('experience', exp.id)}
                  className={getReorderableItemClassName(
                    'experience',
                    exp.id,
                    'group mb-4 rounded-lg border border-gray-200 bg-white p-4'
                  )}
                >
                  <div className="mb-2 flex min-w-0 items-start">
                    {renderItemActionRail(
                      'experience',
                      exp.id,
                      exp.position || exp.company || 'doświadczenie zawodowe',
                      () => removeExperience(exp.id)
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Firma"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Stanowisko"
                          value={exp.position}
                          onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mb-2 grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
                        <div className="min-w-0">
                          <label className="mb-1 block text-sm text-gray-600">
                            Data rozpoczęcia
                          </label>
                          <DatePickerWithCurrent
                            value={exp.startDate}
                            onChange={(date) => updateExperience(exp.id, 'startDate', date)}
                            isCurrent={false}
                            onCurrentChange={() => {}}
                            showCurrentToggle={false}
                            placeholder="Wybierz datę rozpoczęcia"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-sm text-gray-600">
                            Data zakończenia
                          </label>
                          <DatePickerWithCurrent
                            value={exp.endDate}
                            onChange={(date) => updateExperience(exp.id, 'endDate', date)}
                            isCurrent={exp.isCurrent}
                            onCurrentChange={(current) =>
                              updateExperience(exp.id, 'isCurrent', current)
                            }
                            placeholder="Wybierz datę zakończenia"
                          />
                        </div>
                      </div>
                      <RichTextToolbar
                        className="mt-2 mb-2"
                        onFormat={(type) =>
                          handleExperienceFormatting(exp.id, responsibilitiesText, type)
                        }
                        formattingState={formattingState}
                      />
                      <textarea
                        ref={(el) => {
                          if (el) {
                            experienceTextareaRefs.current[exp.id] = el;
                          } else {
                            delete experienceTextareaRefs.current[exp.id];
                          }
                        }}
                        placeholder="Obowiązki - każdy w osobnej linii"
                        value={stripFormattingTokens(responsibilitiesText)}
                        onChange={(e) => {
                          const plainValue = e.target.value;
                          const selectionStart = e.target.selectionStart ?? 0;
                          const selectionEnd = e.target.selectionEnd ?? selectionStart;
                          const nextTokens = mergePlainWithTokens(responsibilitiesText, plainValue);
                          setExperiences((prev) =>
                            prev.map((experience) =>
                              experience.id === exp.id
                                ? {
                                    ...experience,
                                    responsibilities: textToResponsibilityLines(nextTokens),
                                  }
                                : experience
                            )
                          );
                          setExperienceFormattingState((prev) => ({
                            ...prev,
                            [exp.id]: computeFormattingState(
                              nextTokens,
                              selectionStart,
                              selectionEnd
                            ),
                          }));
                        }}
                        onSelect={() => updateExperienceFormattingFromSelection(exp.id)}
                        onKeyUp={() => updateExperienceFormattingFromSelection(exp.id)}
                        onMouseUp={() => updateExperienceFormattingFromSelection(exp.id)}
                        rows={4}
                        className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />

                      <div className="flex w-full items-center justify-end space-x-2">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm bg-gray-100">
                              <MessageCircleQuestion className="text-gray-400" size={20} />
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent className="font-poppins w-80">
                            <div className="flex justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">
                                  Czy to rzeczywiście mi pomoże?
                                </h4>
                                <p className="text-sm">
                                  Zdecydowanie tak. Nasze modele AI są trenowane specjalnie po to,
                                  aby dopasowywać CV do wymagań algorytmów używanych przez
                                  rekruterów.
                                </p>
                                {/* do odkomentowania jak bedzie AI w CV */}
                                {/* <div className="text-muted-foreground text-xs">
                                  Potwierdzone przz 1000+ osób.
                                </div> */}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <button
                          className={`flex flex-row items-center justify-center rounded-sm border bg-[#915EFF] px-3 py-2 text-sm text-white transition-all hover:bg-[#713ae8] focus:outline-none ${isPremium ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        >
                          <span className="text-sm text-white">Popraw z AI</span>
                          <StarsIcon className="ml-2 scale-70" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={addExperience}
              className="flex cursor-pointer items-center font-medium text-[#915EFF]"
            >
              <span className="mr-2 text-xl">+</span>
              Doświadczenie zawodowe
            </button>
          </div>
        );

      case 'projects':
        return (
          <div
            key="projects"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'projects' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'projects' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'projects')}
            onDragOver={(e) => handleSectionDragOver(e, 'projects')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'projects')}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <span
                  className="mr-2 cursor-grab text-gray-400"
                  data-drag-handle="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag section"
                  onMouseDown={() => {
                    dragIntentSectionRef.current = 'projects';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'projects';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <FolderOpen className="mr-2" size={20} />
                Projekty
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Dodaj swoje najważniejsze projekty z klikalnym tytułem, linkiem do repozytorium lub
              wersji live oraz krótkim opisem tego, co zbudowałeś.
            </p>
            {projects.map((project) => (
              <div
                key={project.id}
                {...getItemDropProps('projects', project.id)}
                className={getReorderableItemClassName(
                  'projects',
                  project.id,
                  'group mb-4 rounded-lg border border-gray-200 bg-white p-4'
                )}
              >
                <div className="flex min-w-0 items-start">
                  {renderItemActionRail('projects', project.id, project.title || 'projekt', () =>
                    removeProject(project.id)
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Tytuł projektu"
                        value={project.title}
                        onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                        className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <input
                        type="url"
                        placeholder="https://your-project.com"
                        value={project.url}
                        onChange={(e) => updateProject(project.id, 'url', e.target.value)}
                        className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <textarea
                      placeholder="Krótki opis projektu"
                      value={project.description}
                      onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addProject}
              className="flex cursor-pointer items-center font-medium text-[#915EFF]"
            >
              <span className="mr-2 text-xl">+</span>
              Dodaj projekt
            </button>
          </div>
        );

      case 'education':
        return (
          <div
            key="education"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'education' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'education' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'education')}
            onDragOver={(e) => handleSectionDragOver(e, 'education')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'education')}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <span
                  className="mr-2 cursor-grab text-gray-400"
                  data-drag-handle="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag section"
                  onMouseDown={() => {
                    dragIntentSectionRef.current = 'education';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'education';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <GraduationCap className="mr-2" size={20} />
                Edukacja
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Dodaj swoje wykształcenie - średnie lub wyższe. W razie potrzeby uwzględnij
              odpowiednie kursy, projekty lub osiągnięcia, np. oceny.
            </p>
            {education.map((edu) => {
              const formattingState = educationFormattingState[edu.id] ?? EMPTY_FORMATTING_STATE;

              return (
                <div
                  key={edu.id}
                  {...getItemDropProps('education', edu.id)}
                  className={getReorderableItemClassName(
                    'education',
                    edu.id,
                    'group mb-4 rounded-lg border border-gray-200 bg-white p-4'
                  )}
                >
                  <div className="flex min-w-0 items-start">
                    {renderItemActionRail(
                      'education',
                      edu.id,
                      edu.field || edu.school || 'edukację',
                      () => removeEducation(edu.id)
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Szkoła/Uczelnia"
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Stopień"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Kierunek studiów/szkoły"
                          value={edu.field}
                          onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mb-2 grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
                        <div className="min-w-0">
                          <label className="mb-1 block text-sm text-gray-600">
                            Data rozpoczęcia
                          </label>
                          <DatePickerWithCurrent
                            value={edu.startDate}
                            onChange={(date) => updateEducation(edu.id, 'startDate', date)}
                            isCurrent={false}
                            onCurrentChange={() => {}}
                            showCurrentToggle={false}
                            allowFutureDates={true}
                            placeholder="Wybierz datę rozpoczęcia"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="mb-1 block text-sm text-gray-600">
                            Data zakończenia
                          </label>
                          <DatePickerWithCurrent
                            value={edu.endDate}
                            onChange={(date) => updateEducation(edu.id, 'endDate', date)}
                            isCurrent={edu.isCurrent}
                            onCurrentChange={(current) => {
                              updateEducation(edu.id, 'isCurrent', current);
                              if (current) {
                                updateEducation(edu.id, 'endDate', '');
                              }
                            }}
                            allowFutureDates={true}
                            placeholder="Wybierz datę zakończenia"
                          />
                        </div>
                      </div>
                      <RichTextToolbar
                        className="mt-2 mb-2"
                        onFormat={(type) =>
                          handleEducationFormatting(edu.id, edu.description, type)
                        }
                        formattingState={formattingState}
                      />
                      <textarea
                        ref={(el) => {
                          if (el) {
                            educationTextareaRefs.current[edu.id] = el;
                          } else {
                            delete educationTextareaRefs.current[edu.id];
                          }
                        }}
                        placeholder="Osiągnięcia, kursy/zajęcia, średnia ocen, ważne projekty."
                        value={stripFormattingTokens(edu.description)}
                        onChange={(e) => {
                          const plainValue = e.target.value;
                          const selectionStart = e.target.selectionStart ?? 0;
                          const selectionEnd = e.target.selectionEnd ?? selectionStart;
                          const nextTokens = mergePlainWithTokens(edu.description, plainValue);
                          setEducation((prev) =>
                            prev.map((entry) =>
                              entry.id === edu.id ? { ...entry, description: nextTokens } : entry
                            )
                          );
                          setEducationFormattingState((prev) => ({
                            ...prev,
                            [edu.id]: computeFormattingState(
                              nextTokens,
                              selectionStart,
                              selectionEnd
                            ),
                          }));
                        }}
                        onSelect={() => updateEducationFormattingFromSelection(edu.id)}
                        onKeyUp={() => updateEducationFormattingFromSelection(edu.id)}
                        onMouseUp={() => updateEducationFormattingFromSelection(edu.id)}
                        rows={4}
                        className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={addEducation}
              className="flex cursor-pointer items-center font-medium text-[#915EFF]"
            >
              <span className="mr-2 text-xl">+</span>
              Edukacja
            </button>
          </div>
        );

      case 'certificates':
        return (
          <div
            key="certificates"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'certificates' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'certificates' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'certificates')}
            onDragOver={(e) => handleSectionDragOver(e, 'certificates')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'certificates')}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <span
                  className="mr-2 cursor-grab text-gray-400"
                  data-drag-handle="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag section"
                  onMouseDown={() => {
                    dragIntentSectionRef.current = 'certificates';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'certificates';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <Award className="mr-2" size={20} />
                Certyfikaty
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">Lista Twoich certyfiaktów</p>
            {certificates.map((cert) => (
              <div
                key={cert.id}
                {...getItemDropProps('certificates', cert.id)}
                className={getReorderableItemClassName(
                  'certificates',
                  cert.id,
                  'group mb-3 rounded-lg border border-gray-200 bg-white p-3'
                )}
              >
                <div className="flex items-center">
                  {renderItemDragHandle(
                    'certificates',
                    cert.id,
                    cert.name || 'certyfikat',
                    'mr-2 h-10 w-6 self-center'
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      placeholder="Nazwa certyfikatu"
                      value={cert.name}
                      onChange={(e) => updateCertificate(cert.id, 'name', e.target.value)}
                      className="w-full min-w-0 flex-1 focus:outline-none"
                    />
                    <div className="flex w-full min-w-0 flex-1 justify-end">
                      <DatePickerWithCurrent
                        value={cert.date}
                        onChange={(date) => updateCertificate(cert.id, 'date', date)}
                        isCurrent={!cert.hasDate}
                        onCurrentChange={(checked) => {
                          const hasDate = !checked;
                          updateCertificate(cert.id, 'hasDate', hasDate);
                          if (checked) {
                            updateCertificate(cert.id, 'date', '');
                          }
                        }}
                        toggleLabel="Bez daty"
                        toggledButtonText="Bez daty"
                        placeholder="Wybierz datę"
                      />
                    </div>
                    <button
                      type="button"
                      data-item-delete-button="true"
                      onClick={() => removeCertificate(cert.id)}
                      className="ml-0 shrink-0 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100 sm:ml-2"
                      aria-label={`Usuń: ${cert.name || 'certyfikat'}`}
                      title="Usuń certyfikat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addCertificate}
              className="flex cursor-pointer items-center font-medium text-[#915EFF]"
            >
              <span className="mr-2 text-xl">+</span>
              Dodaj certyfikat
            </button>
          </div>
        );

      case 'skills':
        return (
          <div
            key="skills"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'skills' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'skills' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'skills')}
            onDragOver={(e) => handleSectionDragOver(e, 'skills')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'skills')}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <span
                  className="mr-2 cursor-grab text-gray-400"
                  data-drag-handle="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag section"
                  onMouseDown={() => {
                    dragIntentSectionRef.current = 'skills';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'skills';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <Award className="mr-2" size={20} />
                Umiejętności
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Opisz swoje obszary specjalizacji, koncentrując się na odpowiednich umiejętnościach
              twardych.
            </p>
            {skills.map((skill) => (
              <div
                key={skill.id}
                {...getItemDropProps('skills', skill.id)}
                className={getReorderableItemClassName(
                  'skills',
                  skill.id,
                  'group mb-3 rounded-md border border-gray-200 bg-white p-3'
                )}
              >
                <div className="flex min-w-0 items-center justify-between">
                  {renderItemDragHandle('skills', skill.id, skill.name || 'umiejętność')}
                  <input
                    type="text"
                    placeholder="Nazwa umiejętności"
                    value={skill.name}
                    onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                    className="min-w-0 flex-1 focus:outline-none"
                  />
                  <button
                    type="button"
                    data-item-delete-button="true"
                    onClick={() => removeSkill(skill.id)}
                    className="ml-2 shrink-0 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100"
                    aria-label={`Usuń: ${skill.name || 'umiejętność'}`}
                    title="Usuń umiejętność"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addSkill}
              className="flex cursor-pointer items-center font-medium text-[#915EFF]"
            >
              <span className="mr-2 text-xl">+</span>
              Dodaj umiejętność
            </button>
          </div>
        );

      case 'languages':
        return (
          <div
            key="languages"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'languages' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'languages' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'languages')}
            onDragOver={(e) => handleSectionDragOver(e, 'languages')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'languages')}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <span
                  className="mr-2 cursor-grab text-gray-400"
                  data-drag-handle="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag section"
                  onMouseDown={() => {
                    dragIntentSectionRef.current = 'languages';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'languages';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <Languages className="mr-2" size={20} />
                Języki
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Dodaj języki, które znasz, wraz z poziomem biegłości.
            </p>
            {languages.map((language) => (
              <div
                key={language.id}
                {...getItemDropProps('languages', language.id)}
                className={getReorderableItemClassName(
                  'languages',
                  language.id,
                  'group mb-3 rounded-lg border border-gray-200 bg-white/60 p-3'
                )}
              >
                <div className="flex min-w-0 items-center">
                  {renderItemDragHandle(
                    'languages',
                    language.id,
                    language.name || 'język',
                    'mr-2 h-10 w-6 self-center'
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      placeholder="Język"
                      value={language.name}
                      onChange={(e) => updateLanguage(language.id, 'name', e.target.value)}
                      className="h-10 w-full min-w-0 flex-1 focus:outline-none"
                    />
                    <Select
                      value={normalizeFluency(language.level)}
                      onValueChange={(value) => updateLanguage(language.id, 'level', value)}
                    >
                      <SelectTrigger className="font-poppins h-10 w-full rounded-sm border border-gray-300 px-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FLUENCY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {getFluencyLabel(option, 'pl')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="button"
                    data-item-delete-button="true"
                    onClick={() => removeLanguage(language.id)}
                    className="ml-2 shrink-0 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100"
                    aria-label={`Usuń: ${language.name || 'język'}`}
                    title="Usuń język"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addLanguage}
              className="flex cursor-pointer items-center font-medium text-[#915EFF]"
            >
              <span className="mr-2 text-xl">+</span>
              Dodaj język
            </button>
          </div>
        );

      case 'hobbies':
        return (
          <div
            key="hobbies"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'hobbies' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'hobbies' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'hobbies')}
            onDragOver={(e) => handleSectionDragOver(e, 'hobbies')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'hobbies')}
            onDragEnd={handleSectionDragEnd}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <span
                  className="mr-2 cursor-grab text-gray-400"
                  data-drag-handle="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag section"
                  onMouseDown={() => {
                    dragIntentSectionRef.current = 'hobbies';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'hobbies';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <Tag className="mr-2" size={20} />
                Zainteresowania
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Dodaj swoje zainteresowania i aktywności pozalekcyjne, które odzwierciedlają Twoją
              osobowość.
            </p>
            {hobbies.map((hobby) => (
              <div
                key={hobby.id}
                {...getItemDropProps('hobbies', hobby.id)}
                className={getReorderableItemClassName(
                  'hobbies',
                  hobby.id,
                  'group mb-3 rounded-lg border border-gray-200 bg-white p-3'
                )}
              >
                <div className="flex min-w-0 items-center">
                  {renderItemDragHandle('hobbies', hobby.id, hobby.name || 'zainteresowanie')}
                  <input
                    type="text"
                    placeholder="np. czytanie, podróżowanie, gotowanie."
                    value={hobby.name}
                    onChange={(e) => updateHobby(hobby.id, 'name', e.target.value)}
                    className="min-w-0 flex-1 focus:outline-none"
                  />
                  <button
                    type="button"
                    data-item-delete-button="true"
                    onClick={() => removeHobby(hobby.id)}
                    className="ml-2 shrink-0 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100"
                    aria-label={`Usuń: ${hobby.name || 'zainteresowanie'}`}
                    title="Usuń zainteresowanie"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addHobby} className="flex items-center font-medium text-[#915EFF]">
              <span className="mr-2 text-xl">+</span>
              Dodaj zainteresowania
            </button>
          </div>
        );
      case 'privacy':
        return (
          <div
            key="privacy"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'privacy' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            }`}
            onDragOver={(e) => handleSectionDragOver(e, 'privacy')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'privacy')}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-700">
                <PencilLine className="mr-2" size={20} />
                Klauzula informacyjna
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Dodaj klauzulę informacyjną dotyczącą prywatności lub zgodę na przetwarzanie danych.
            </p>
            <textarea
              placeholder="Wyrażam zgodę na przetwarzanie danych osobowych..."
              value={privacyStatement.content}
              onChange={(e) =>
                setPrivacyStatement({ ...privacyStatement, content: e.target.value })
              }
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={applyPrivacyConsentTemplate}
              disabled={hasPrivacyConsentTemplate}
              className="mt-2 flex cursor-pointer items-center font-medium text-[#915EFF] disabled:cursor-not-allowed disabled:opacity-50"
              title="Wklej standardową zgodę RODO"
            >
              <span className="mr-2 text-xl">+</span>
              Użyj gotowej zgody
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSectionInPreview = (sectionId: string) => {
    switch (sectionId) {
      case 'profile':
        return personalInfo.firstName ||
          personalInfo.lastName ||
          personalInfo.email ||
          personalInfo.phone ||
          personalInfo.address ||
          personalInfo.profession ||
          personalInfo.summary ? (
          <div
            className="cv-section mb-5"
            key="profile"
            data-block-id="profile"
            data-section="profile"
          >
            <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              {previewLabels.sections.profile}
            </h3>
            <div className="text-sm leading-relaxed break-words text-gray-700">
              {splitRichTextParagraphs(personalInfo.summary || '').map((para, i) => (
                <p
                  key={`sum-${i}`}
                  className="para-item mb-2 last:mb-0"
                  data-item-id={`p${i}`}
                  dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(para) }}
                />
              ))}
            </div>
          </div>
        ) : null;

      case 'experience':
        return experiences.length > 0 ? (
          <div
            className="cv-section mb-5"
            key="experience"
            data-block-id="experience"
            data-section="experience"
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Briefcase size={16} className="mr-2" />
              {previewLabels.sections.experience}
            </h3>
            {experiences.map((exp) => (
              <div key={exp.id} className="exp-item mb-4" data-item-id={exp.id}>
                {/* Nagłówek stanowisko + firma */}
                <div className="exp-header mb-1 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold break-words text-gray-900">
                      {exp.position || 'Position'}
                    </div>
                    <div className="font-medium break-words text-gray-700">
                      {exp.company || 'Company name'}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                    {formatDate(exp.startDate)} -{' '}
                    {exp.isCurrent || !exp.endDate
                      ? previewLabels.current
                      : formatDate(exp.endDate)}
                  </div>
                </div>

                {/* Opis */}
                {renderExperienceDescription(exp)}
              </div>
            ))}
          </div>
        ) : null;

      case 'projects':
        return projects.length > 0 ? (
          <div
            className="cv-section mb-5"
            key="projects"
            data-block-id="projects"
            data-section="projects"
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <FolderOpen size={16} className="mr-2" />
              {previewLabels.sections.projects}
            </h3>
            {projects.map((project) => {
              const projectUrl = normalizeExternalUrl(project.url);

              return (
                <div key={project.id} className="project-item mb-3" data-item-id={project.id}>
                  {projectUrl ? (
                    <a
                      href={projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#915EFF] underline underline-offset-2"
                    >
                      {project.title || 'Project title'}
                    </a>
                  ) : (
                    <div className="font-semibold text-gray-900">
                      {project.title || 'Project title'}
                    </div>
                  )}
                  {project.description && (
                    <p className="mt-1 text-sm leading-relaxed break-words text-gray-700">
                      {project.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : null;

      case 'education':
        return education.length > 0 ? (
          <div
            className="cv-section mb-5"
            key="education"
            data-block-id="education"
            data-section="education"
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <GraduationCap size={16} className="mr-2" />
              {previewLabels.sections.education}
            </h3>
            {education.map((edu) => (
              <div key={edu.id} className="edu-item mb-3" data-item-id={edu.id}>
                <div className="mb-1 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold break-words text-gray-900">
                      {edu.field ||
                        (resumePreviewLanguage === 'pl'
                          ? 'Kierunek studiów'
                          : 'Field of study')}{' '}
                      {edu.degree.trim() &&
                        `- ${getEducationDegreeLabel(edu.degree, resumePreviewLanguage)}`}
                    </h4>
                    <p className="font-medium break-words text-gray-700">
                      {edu.school || 'School/University'}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                    {formatDate(edu.startDate)} -{' '}
                    {edu.isCurrent || !edu.endDate
                      ? previewLabels.current
                      : formatDate(edu.endDate)}
                  </div>
                </div>
                {edu.description && (
                  <div
                    className="edu-desc mt-1 text-sm leading-relaxed text-gray-700"
                    dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(edu.description) }}
                  />
                )}
              </div>
            ))}
          </div>
        ) : null;

      case 'certificates':
        return certificates.length > 0 ? (
          <div
            className="cv-section mb-5"
            key="certificates"
            data-block-id="certificates"
            data-section="certificates"
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Award size={16} className="mr-2" />
              {previewLabels.sections.certificates}
            </h3>
            <div className="space-y-1">
              {certificates.map((cert) => (
                <div key={cert.id} className="cert-item" data-item-id={cert.id}>
                  <p className="text-sm text-gray-700">
                    {cert.name}
                    {cert.date ? ` (${formatDate(cert.date)})` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case 'skills':
        return skills.length > 0 ? (
          <div
            className="cv-section mb-5"
            key="skills"
            data-block-id="skills"
            data-section="skills"
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Award size={16} className="mr-2" />
              {previewLabels.sections.skills}
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                >
                  {skill.name || 'Skill'}
                </span>
              ))}
            </div>
          </div>
        ) : null;

      case 'languages':
        return languages.length > 0 ? (
          <div
            className="cv-section mb-5"
            key="languages"
            data-block-id="languages"
            data-section="languages"
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Languages size={16} className="mr-2" />
              {previewLabels.sections.languages}
            </h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language.id}
                  className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800"
                >
                  {language.name || (resumePreviewLanguage === 'pl' ? 'Język' : 'Language')} -{' '}
                  {getFluencyLabel(language.level, resumePreviewLanguage)}
                </span>
              ))}
            </div>
          </div>
        ) : null;

      case 'hobbies':
        return hobbies.length > 0 ? (
          <div
            className="cv-section mb-5"
            key="hobbies"
            data-block-id="hobbies"
            data-section="hobbies"
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Tag size={16} className="mr-2" />
              {previewLabels.sections.hobbies}
            </h3>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby) => (
                <span
                  key={hobby.id}
                  className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                >
                  {hobby.name || 'Hobby'}
                </span>
              ))}
            </div>
          </div>
        ) : null;

      case 'privacy':
        return privacyStatement.content ? (
          <div
            className="cv-section mb-5"
            key="privacy"
            data-block-id="privacy"
            data-section="privacy"
          >
            <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              {previewLabels.sections.privacy}
            </h3>
            <div className="text-xs leading-relaxed break-words text-gray-700">
              {(privacyStatement.content || '')
                .split(/\n+/)
                .filter(Boolean)
                .map((para, i) => (
                  <p key={`priv-${i}`} className="para-item mb-2 last:mb-0" data-item-id={`p${i}`}>
                    {para}
                  </p>
                ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const renderHeader = () => (
    <div className="cv-section mb-6" data-block-id="header">
      <h1 className="mb-2 text-3xl leading-tight font-bold text-gray-900">
        {personalInfo.firstName || personalInfo.lastName
          ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
          : ''}
      </h1>
      {personalInfo.profession && (
        <h2 className="mb-4 text-xl text-gray-600">{personalInfo.profession}</h2>
      )}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {personalInfo.email && (
          <div className="flex items-center">
            <Mail size={14} className="mr-2 flex-shrink-0" />
            <span>{personalInfo.email}</span>
          </div>
        )}
        {personalInfo.phone && (
          <div className="flex items-center">
            <Phone size={14} className="mr-2 flex-shrink-0" />
            {personalInfo.phone}
          </div>
        )}
        {personalInfo.address && (
          <div className="flex items-center">
            <MapPin size={14} className="mr-2 flex-shrink-0" />
            {personalInfo.address}
          </div>
        )}
        {personalInfo.socialLinks
          .filter((s) => s.url.trim())
          .map((s) => (
            <div key={s.id} className="flex items-center">
              <a
                href={normalizeExternalUrl(s.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-700 underline underline-offset-2"
              >
                {s.label}
              </a>
            </div>
          ))}
      </div>
    </div>
  );

  const renderSectionTitle = (sectionId: string) => {
    switch (sectionId) {
      case 'profile':
        return (
          <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            {previewLabels.sections.profile}
          </h3>
        );
      case 'experience':
        return (
          <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            <Briefcase size={16} className="mr-2" />
            {previewLabels.sections.experience}
          </h3>
        );
      case 'projects':
        return (
          <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            <FolderOpen size={16} className="mr-2" />
            {previewLabels.sections.projects}
          </h3>
        );
      case 'education':
        return (
          <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            <GraduationCap size={16} className="mr-2" />
            {previewLabels.sections.education}
          </h3>
        );
      case 'certificates':
        return (
          <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            <Award size={16} className="mr-2" />
            {previewLabels.sections.certificates}
          </h3>
        );
      case 'privacy':
        return (
          <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            {previewLabels.sections.privacy}
          </h3>
        );
      default:
        return null;
    }
  };

  const renderExperienceDescription = (exp: Experience) => {
    const responsibilities = normalizeResponsibilitiesForPayload(exp.responsibilities);

    if (!responsibilities.length) {
      return null;
    }

    return (
      <ul className="ml-5 space-y-1 text-sm leading-relaxed text-gray-700">
        {responsibilities.map((item, index) => (
          <li key={`${exp.id}-responsibility-${index}`} className="flex items-start gap-2">
            <span className="mt-[2px] text-gray-500">-</span>
            <span
              className="flex-1"
              dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(item) }}
            />
          </li>
        ))}
      </ul>
    );
  };

  const renderExperienceItems = (ids?: string[]) => {
    const list = ids ? experiences.filter((e) => ids.includes(e.id)) : experiences;
    return (
      <>
        {list.map((exp) => (
          <div key={exp.id} className="exp-item mb-4" data-item-id={exp.id}>
            <div className="exp-header mb-1 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-semibold break-words text-gray-900">
                  {exp.position || 'Position'}
                </div>
                <div className="font-medium break-words text-gray-700">
                  {exp.company || 'Company name'}
                </div>
              </div>
              <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                {formatDate(exp.startDate)} -{' '}
                {exp.isCurrent || !exp.endDate ? previewLabels.current : formatDate(exp.endDate)}
              </div>
            </div>
            {renderExperienceDescription(exp)}
          </div>
        ))}
      </>
    );
  };

  const renderProjectItems = (ids?: string[]) => {
    const list = ids ? projects.filter((project) => ids.includes(project.id)) : projects;

    return (
      <>
        {list.map((project) => {
          const projectUrl = normalizeExternalUrl(project.url);

          return (
            <div key={project.id} className="project-item mb-3" data-item-id={project.id}>
              {projectUrl ? (
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#915EFF] underline underline-offset-2"
                >
                  {project.title || 'Project title'}
                </a>
              ) : (
                <div className="font-semibold text-gray-900">
                  {project.title || 'Project title'}
                </div>
              )}
              {project.description && (
                <p className="mt-1 text-sm leading-relaxed break-words text-gray-700">
                  {project.description}
                </p>
              )}
            </div>
          );
        })}
      </>
    );
  };

  const renderEducationItems = (ids?: string[]) => {
    const list = ids ? education.filter((e) => ids.includes(e.id)) : education;
    return (
      <>
        {list.map((edu) => (
          <div key={edu.id} className="edu-item mb-3" data-item-id={edu.id}>
            <div className="mb-1 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold break-words text-gray-900">
                  {edu.field ||
                    (resumePreviewLanguage === 'pl' ? 'Kierunek studiów' : 'Field of study')}{' '}
                  -{' '}
                  {getEducationDegreeLabel(edu.degree, resumePreviewLanguage) ||
                    (resumePreviewLanguage === 'pl' ? 'Stopień' : 'Degree')}
                </h4>
                <p className="font-medium break-words text-gray-700">
                  {edu.school || 'School/University'}
                </p>
              </div>
              <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                {formatDate(edu.startDate)} -{' '}
                {edu.isCurrent || !edu.endDate ? previewLabels.current : formatDate(edu.endDate)}
              </div>
            </div>
            {edu.description && (
              <div
                className="edu-desc mt-1 text-sm leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(edu.description) }}
              />
            )}
          </div>
        ))}
      </>
    );
  };

  const renderCertificatesItems = (ids?: string[]) => {
    const list = ids ? certificates.filter((c) => ids.includes(c.id)) : certificates;
    return (
      <div className="space-y-1">
        {list.map((cert) => (
          <div key={cert.id} className="cert-item" data-item-id={cert.id}>
            <p className="text-sm text-gray-700">
              {cert.name}
              {cert.hasDate && cert.date ? ` (${formatDate(cert.date)})` : ''}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderChunk = (chunk: SectionChunk) => {
    const { sectionId, items, includeTitle } = chunk;
    // For simple sections without item splitting, render full section
    if (!items || items.length === 0) {
      return (
        <React.Fragment key={`chunk-${sectionId}-${Math.random()}`}>
          {renderSectionInPreview(sectionId)}
        </React.Fragment>
      );
    }

    // Split-capable sections
    switch (sectionId) {
      case 'profile':
        return (
          <div
            className="cv-section mb-5"
            data-block-id="profile"
            data-section="profile"
            key={`chunk-prof-${items.join('-')}`}
          >
            {includeTitle && renderSectionTitle('profile')}
            <div className="text-sm leading-relaxed break-words text-gray-700">
              {splitRichTextParagraphs(personalInfo.summary || '').map((para, i) => {
                const id = `p${i}`;
                if (!items.includes(id)) return null;
                return (
                  <p
                    key={`sum-${i}`}
                    className="para-item mb-2 last:mb-0"
                    data-item-id={id}
                    dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(para) }}
                  />
                );
              })}
            </div>
          </div>
        );
      case 'experience':
        return (
          <div
            className="cv-section mb-5"
            data-block-id="experience"
            data-section="experience"
            key={`chunk-exp-${items.join('-')}`}
          >
            {includeTitle && renderSectionTitle('experience')}
            {renderExperienceItems(items)}
          </div>
        );
      case 'projects':
        return (
          <div
            className="cv-section mb-5"
            data-block-id="projects"
            data-section="projects"
            key={`chunk-projects-${items.join('-')}`}
          >
            {includeTitle && renderSectionTitle('projects')}
            {renderProjectItems(items)}
          </div>
        );
      case 'education':
        return (
          <div
            className="cv-section mb-5"
            data-block-id="education"
            data-section="education"
            key={`chunk-edu-${items.join('-')}`}
          >
            {includeTitle && renderSectionTitle('education')}
            {renderEducationItems(items)}
          </div>
        );
      case 'certificates':
        return (
          <div
            className="cv-section mb-5"
            data-block-id="certificates"
            data-section="certificates"
            key={`chunk-cert-${items.join('-')}`}
          >
            {includeTitle && renderSectionTitle('certificates')}
            {renderCertificatesItems(items)}
          </div>
        );
      case 'privacy':
        return (
          <div
            className="cv-section mb-5"
            data-block-id="privacy"
            data-section="privacy"
            key={`chunk-priv-${items.join('-')}`}
          >
            {includeTitle && renderSectionTitle('privacy')}
            <div className="text-xs leading-relaxed break-words text-gray-700">
              {getParagraphFragments(
                (privacyStatement.content || '').split(/\n+/).filter(Boolean),
                items
              ).map(({ index, text }) => (
                <p
                  key={`priv-${index}`}
                  className="para-item mb-2 last:mb-0"
                  data-item-id={`p${index}`}
                >
                  {text}
                </p>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <React.Fragment key={`chunk-default-${sectionId}`}>
            {renderSectionInPreview(sectionId)}
          </React.Fragment>
        );
    }
  };

  // Phones: fit one A4 page to the screen width whenever the preview shows.
  useEffect(() => {
    if (!isMobile || mobileMode !== 'preview') return;
    const fit = () => {
      const width = pagesViewportRef.current?.clientWidth || window.innerWidth;
      const pagePx = PAGE_WIDTH_MM * (mmRatioRef.current ?? 96 / 25.4);
      setCvScale(Math.min(1, (width - 24) / pagePx));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [isMobile, mobileMode]);

  // On phones the analysis "Przejdź do sekcji" may be used from the preview:
  // switch back to the edit cards first, then scroll to the section.
  const handleNavigateFromAnalysis = (sectionId: string) => {
    if (isMobile && mobileMode !== 'edit') {
      setMobileMode('edit');
      setTimeout(() => handleNavigateToFormSection(sectionId), 60);
      return;
    }
    handleNavigateToFormSection(sectionId);
  };

  const editorDialogs = (
    <>
      <CvAnalysisDrawer
        cvId={cvId}
        cvName={resumeName}
        targetPosition={personalInfo.profession || undefined}
        open={isAnalysisOpen}
        onOpenChange={setIsAnalysisOpen}
        onNavigateToSection={handleNavigateFromAnalysis}
      />

      <TailorCvFromEditorDialog
        open={isTailorDialogOpen}
        limits={cvLimits}
        currentCvName={resumeName}
        defaultTargetPosition={personalInfo.profession}
        isCheckingLimits={isCheckingCvLimits}
        isSubmitting={isTailoring}
        onOpenChange={setIsTailorDialogOpen}
        onSubmit={handleTailorCvFromEditor}
        onUpgrade={() => router.push('/pricing')}
      />
    </>
  );

  // CV preview: hidden measurement container + paged A4 viewport.
  const previewContainer = (
    <div
      className="relative flex-1 overflow-hidden bg-gray-100/20"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
    >
      {/* Hidden measurement container to compute heights */}
      <div
        ref={measureContainerRef}
        className="cv-text"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: '-10000px',
          width: `${PAGE_WIDTH_MM}mm`,
          background: '#fff',
        }}
      >
        <div style={{ padding: `${PAGE_PADDING_MM}mm` }}>
          {renderHeader()}
          {sectionOrder.filter(isSectionVisible).map((id) => (
            <React.Fragment key={`m-${id}`}>{renderSectionInPreview(id)}</React.Fragment>
          ))}
        </div>
      </div>

      {/* Pages viewport */}
      <div ref={pagesViewportRef} className="absolute inset-0 overflow-auto">
        <div
          ref={zoomWrapperRef}
          className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'} flex flex-col items-center`}
          style={
            isMobile
              ? // `zoom` scales layout too, so no blank scroll area under the pages.
                { zoom: cvScale, padding: '24px 0 140px' }
              : {
                  transform: `translate(${cvPosition.x}px, ${cvPosition.y}px) scale(${cvScale})`,
                  transformOrigin: 'top center',
                  padding: '40px 0',
                }
          }
          onMouseDown={handleMouseDown}
        >
          {(pages.length
            ? pages
            : [
                [
                  /* empty page */
                ] as SectionChunk[],
              ]
          ).map((page, idx) => (
            <div
              key={`page-${idx}`}
              className="cv-page cv-text mb-6 overflow-hidden rounded-sm shadow"
              style={{
                width: `${PAGE_WIDTH_MM}mm`,
                height: `${PAGE_HEIGHT_MM}mm`,
                background: '#fff',
              }}
            >
              <div className="box-border h-full" style={{ padding: `${PAGE_PADDING_MM}mm` }}>
                {idx === 0 && renderHeader()}
                {page.map((chunk, cidx) => (
                  <React.Fragment key={`p${idx}-c${cidx}`}>{renderChunk(chunk)}</React.Fragment>
                ))}
                {/* Empty state message on first page */}
                {idx === 0 &&
                  !personalInfo.firstName &&
                  !personalInfo.lastName &&
                  !personalInfo.email &&
                  !personalInfo.phone &&
                  !personalInfo.address &&
                  personalInfo.socialLinks.length === 0 &&
                  !personalInfo.summary &&
                  experiences.length === 0 &&
                  projects.length === 0 &&
                  projects.length === 0 &&
                  skills.length === 0 &&
                  education.length === 0 && (
                    <div className="mt-20 text-center text-gray-500">
                      <p className="text-lg">
                        Zacznij od uzupełnienia pól po lewej stronie. <br /> Efeket będziesz widział
                        tutaj na bieżąco.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      {true && (
        <div
          className={`absolute bottom-5 left-1/2 -translate-x-1/2 transform transition-all duration-500 ${
            isHovered ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-16 opacity-0'
          } flex items-center space-x-2 rounded-lg bg-white px-4 py-2 shadow-lg`}
        >
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className={`rounded p-2 ${
              currentPage === 1
                ? 'cursor-not-allowed text-gray-400'
                : 'cursor-pointer text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: pages.length || 1 }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`h-8 w-8 cursor-pointer rounded text-sm font-medium ${
                  currentPage === page
                    ? 'bg-[#915EFF] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === (pages.length || 1)}
            className={`rounded p-2 ${
              currentPage === (pages.length || 1)
                ? 'cursor-not-allowed text-gray-400'
                : 'cursor-pointer text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChevronRight size={16} />
          </button>

          <span className="ml-2 text-sm text-gray-600">
            {currentPage} / {pages.length || 1}
          </span>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobileCvEditor
          resumeName={resumeName}
          mode={mobileMode}
          onModeChange={setMobileMode}
          autosaveStatus={autosaveStatus}
          isBusy={isManualSaving || isLoadingProfile || isTailoring}
          isLoadingProfile={isLoadingProfile}
          highlightedSection={highlightedFormSection}
          data={{
            personalInfo,
            experiences,
            education,
            projects,
            certificates,
            skills,
            languages,
            hobbies,
            privacyStatement,
          }}
          setters={{
            setPersonalInfo,
            setExperiences,
            setEducation,
            setProjects,
            setCertificates,
            setSkills,
            setLanguages,
            setHobbies,
            setPrivacyStatement,
          }}
          sectionOrder={sectionOrder}
          privacyTemplate={PRIVACY_CONSENT_TEMPLATES[resumePreviewLanguage]}
          showFullDates={showFullDates}
          onShowFullDatesChange={setShowFullDates}
          previewLanguage={resumePreviewLanguage}
          onPreviewLanguageChange={setResumePreviewLanguage}
          onBack={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/dashboard/resume');
            }
          }}
          onSaveNow={handleSave}
          onLoadFromProfile={loadFromProfile}
          onTailor={handleOpenTailorDialog}
          onAnalysis={() => setIsAnalysisOpen(true)}
          onDownload={downloadPDF}
          preview={previewContainer}
        />
        {editorDialogs}
      </>
    );
  }

  return (
    <div className="font-poppins flex h-screen flex-col overflow-hidden bg-gray-50 lg:flex-row lg:pt-6 dark:text-black">
      {/* Top Navigation for Mobile */}
      <div className="mb-4 flex items-center justify-start bg-white px-2 py-3 shadow-lg lg:hidden">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/dashboard/resume');
            }
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100"
          title="Powrót"
        >
          <ChevronLeft size={20} className="text-gray-700" />
          <span className="text-gray-700">Powrót</span>
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="relative z-30 mx-3 hidden w-16 shrink-0 flex-col items-center justify-between overflow-visible rounded-lg bg-white py-6 shadow-lg lg:flex">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => router.push('/dashboard/resume')}
            className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-100"
            title="Dashboard"
          >
            <Home size={24} className="text-gray-600" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isManualSaving || isLoadingProfile || isTailoring}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            title="Save resume"
          >
            <Save size={16} className="h-6 w-6 text-gray-600" />
            <div className="flex flex-row items-center justify-center text-[9px]">
              {autosaveStatus === 'saving' && <span className="text-gray-500">Saving…</span>}
              {autosaveStatus === 'saved' && <span className="text-green-600">Saved ✓</span>}
              {autosaveStatus === 'error' && <span className="text-red-500">Save failed</span>}
            </div>
          </button>
          <ResumeAnalysisPromoButton cvId={cvId} onAnalyze={() => setIsAnalysisOpen(true)} />
          <Select
            value={showFullDates ? 'full' : 'year'}
            onValueChange={(value) => setShowFullDates(value === 'full')}
          >
            <SelectTrigger
              aria-label={`Format daty: ${showFullDates ? 'Miesiąc i rok' : 'Tylko rok'}`}
              title="Format daty"
              className="h-12 w-12 cursor-pointer justify-center gap-0 rounded-lg border-0 bg-transparent p-0 shadow-none transition-colors hover:bg-gray-100! [&>svg:last-child]:hidden"
            >
              <CalendarDays aria-hidden="true" className="h-6! w-6! text-gray-600" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="right"
              align="center"
              sideOffset={8}
              avoidCollisions={false}
              className="min-w-40"
            >
              <SelectItem value="full">Miesiąc i rok</SelectItem>
              <SelectItem value="year">Tylko rok</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={resumePreviewLanguage}
            onValueChange={(value) => setResumePreviewLanguage(value as ResumePreviewLanguage)}
          >
            <SelectTrigger
              aria-label={`Język CV: ${resumePreviewLanguage.toUpperCase()}`}
              title="Język CV"
              className="h-12 w-12 cursor-pointer justify-center gap-0 rounded-lg border-0 bg-transparent p-0 shadow-none transition-colors hover:bg-gray-100! [&>svg:last-child]:hidden"
            >
              <Languages aria-hidden="true" className="h-6! w-6! text-gray-600" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="right"
              align="center"
              sideOffset={8}
              avoidCollisions={false}
              className="min-w-24"
            >
              <SelectItem value="pl">PL</SelectItem>
              <SelectItem value="en">EN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <HoverCard>
          <HoverCardTrigger asChild>
            <button className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-sm bg-gray-100">
              v1.1.0
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="font-poppins w-80">
            <div className="flex justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Wersja beta</h4>
                <p className="text-sm">
                  Pamiętaj, że aplikacja może zawierać błędy lub brakujące funkcje. Ciężko pracujemy
                  nad jej ulepszeniem.
                </p>
                <div className="text-muted-foreground text-xs">Vocare team</div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        {/* <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gray-200/40">
          <span className="font-poppins">v0.1.2</span>
        </div> */}
      </div>

      {editorDialogs}

      {/* Main Content */}
      <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden px-3 lg:flex-row lg:px-0">
        {!isMobile && (
          <div className="h-full overflow-y-auto rounded-lg bg-white shadow-lg lg:w-[48%]">
            <div className="max-h-full overflow-y-auto p-4 lg:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-gray-800 lg:text-xl">Kreator CV</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={loadFromProfile}
                    disabled={isLoadingProfile || isTailoring || isManualSaving}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-[6px] border-[1.5px] border-transparent px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900 [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(135deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)_border-box] hover:[background:linear-gradient(#F7F3FF,#F7F3FF)_padding-box,linear-gradient(135deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)_border-box] focus-visible:ring-2 focus-visible:ring-[#915EFF]/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingProfile ? 'Importowanie...' : 'Zaimportuj z profilu'}
                    <Image src={download_propfile_cv} width={14} height={14} alt="offer-icon" />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenTailorDialog}
                    disabled={isTailoring || isLoadingProfile || isManualSaving}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-[6px] border-2 border-[#915EFF] bg-[#915EFF] px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:border-[#713AE8] hover:bg-[#713AE8] focus-visible:ring-2 focus-visible:ring-[#915EFF]/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    title="Stwórz CV na podstawie oferty pracy"
                  >
                    Stwórz CV pod ofertę
                    <Image src={offer_type} width={16} height={16} alt="offer-icon" />
                  </button>
                </div>
              </div>

              {/* Personal Information Section */}
              <div
                data-cv-form-section="contact"
                className={`mb-6 origin-center transform-gpu scroll-m-6 rounded-lg bg-gray-50 p-4 transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transform-none lg:p-6 ${
                  highlightedFormSection === 'contact'
                    ? 'scale-[1.015] shadow-[0_0_0_3px_rgba(145,94,255,0.28),0_12px_32px_rgba(145,94,255,0.18)]'
                    : 'scale-100'
                }`}
              >
                <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-700">
                  <User className="mr-2" size={20} />
                  Dane kontaktowe
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-gray-600">Imię</label>
                      <input
                        type="text"
                        placeholder="Grzegorz"
                        value={personalInfo.firstName}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, firstName: e.target.value })
                        }
                        className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-gray-600">Nazwisko</label>
                      <input
                        type="text"
                        placeholder="Brzenczyszczykiewicz"
                        value={personalInfo.lastName}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, lastName: e.target.value })
                        }
                        className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">E-mail</label>
                    <input
                      type="email"
                      placeholder="gbrzenczyszczykiewicz@gmail.com"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Stanowisko</label>
                    <input
                      type="text"
                      placeholder="np. Project Manager"
                      value={personalInfo.profession}
                      onChange={(e) =>
                        setPersonalInfo({ ...personalInfo, profession: e.target.value })
                      }
                      className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Collapsible Additional Fields */}
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-[#915EFF]">
                      Pokaż dodatkowe pola
                    </summary>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm text-gray-600">Numer telefonu</label>
                          <input
                            type="tel"
                            placeholder="np. +48 222 639 831"
                            value={personalInfo.phone}
                            onChange={(e) =>
                              setPersonalInfo({ ...personalInfo, phone: e.target.value })
                            }
                            className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-gray-600">Adres</label>
                          <input
                            type="text"
                            placeholder="np. 221B Baker Street, Londyn"
                            value={personalInfo.address}
                            onChange={(e) =>
                              setPersonalInfo({ ...personalInfo, address: e.target.value })
                            }
                            className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-full">
                          <label className="mb-2 block text-sm font-medium text-gray-600">
                            Linki
                          </label>
                          {personalInfo.socialLinks.map((link) => (
                            <div key={link.id} className="mb-2 flex items-center gap-2">
                              <>
                                <input
                                  type="text"
                                  list={`social-suggestions-${link.id}`}
                                  placeholder="e.g. GitHub"
                                  value={link.label}
                                  onChange={(e) =>
                                    setPersonalInfo((prev) => ({
                                      ...prev,
                                      socialLinks: prev.socialLinks.map((s) =>
                                        s.id === link.id ? { ...s, label: e.target.value } : s
                                      ),
                                    }))
                                  }
                                  className="font-poppins h-[46px] w-36 rounded-sm border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <datalist id={`social-suggestions-${link.id}`}>
                                  {SOCIAL_LINK_SUGGESTIONS.map((type) => (
                                    <option key={type} value={type} />
                                  ))}
                                </datalist>
                              </>
                              <input
                                type="url"
                                placeholder="https://..."
                                value={link.url}
                                onChange={(e) =>
                                  setPersonalInfo((prev) => ({
                                    ...prev,
                                    socialLinks: prev.socialLinks.map((s) =>
                                      s.id === link.id ? { ...s, url: e.target.value } : s
                                    ),
                                  }))
                                }
                                className="flex-1 rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setPersonalInfo((prev) => ({
                                    ...prev,
                                    socialLinks: prev.socialLinks.filter((s) => s.id !== link.id),
                                  }))
                                }
                                className="rounded p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                                title="Remove link"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setPersonalInfo((prev) => ({
                                ...prev,
                                socialLinks: [
                                  ...prev.socialLinks,
                                  { id: makeSocialLinkId(), label: 'GitHub', url: '' },
                                ],
                              }))
                            }
                            className="flex cursor-pointer items-center font-medium text-[#915EFF]"
                          >
                            <span className="mr-2 text-xl">+</span>
                            Dodaj linki
                          </button>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {sectionOrder.map((sectionId) => (
                <div
                  key={sectionId}
                  data-cv-form-section={sectionId}
                  className={`origin-center transform-gpu scroll-m-6 rounded-lg transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transform-none ${
                    highlightedFormSection === sectionId
                      ? 'scale-[1.015] shadow-[0_0_0_3px_rgba(145,94,255,0.28),0_12px_32px_rgba(145,94,255,0.18)]'
                      : 'scale-100'
                  }`}
                >
                  {renderSectionInForm(sectionId)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Panel - CV Preview */}
        <div className="flex w-full flex-1 flex-col overflow-hidden rounded-lg bg-gray-100 lg:w-[52%]">
          {isMobile ? (
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
              <span>Podgląd CV</span>
              <button
                onClick={downloadPDF}
                className="flex cursor-pointer items-center gap-2 rounded border border-[#915EFF] bg-[#915EFF] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#713ae8]"
                title="Pobierz CV jako PDF"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="7,10 12,15 17,10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="12"
                    y1="15"
                    x2="12"
                    y2="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Pobierz</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-gray-700">Podgląd CV</h2>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <button
                  onClick={downloadPDF}
                  className="flex cursor-pointer items-center gap-2 rounded border border-[#915EFF] bg-[#915EFF] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#713ae8]"
                  title="Pobierz CV jako PDF"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="7,10 12,15 17,10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="12"
                      y1="15"
                      x2="12"
                      y2="3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Pobierz</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 rounded bg-gray-50 px-2 py-1 sm:bg-transparent sm:px-0">
                  <button
                    onClick={handleZoomOut}
                    className="cursor-pointer rounded p-2 transition-colors hover:bg-gray-100"
                    title="Pomniejsz"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <span className="min-w-12 text-center text-xs text-gray-600 sm:text-sm">
                    {Math.round(cvScale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="cursor-pointer rounded p-2 transition-colors hover:bg-gray-100"
                    title="Powiększ"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={resetView}
                    className="cursor-pointer rounded p-2 text-xs transition-colors hover:bg-gray-100 sm:text-sm"
                    title="Resetuj widok"
                  >
                    Zreestuj
                  </button>
                  <div className="flex items-center text-xs text-gray-500 sm:text-sm">
                    <Move size={16} className="mr-1" />
                    Złap i przesuń
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewContainer}
        </div>
      </div>
    </div>
  );
};

export default CVCreator;
