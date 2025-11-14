'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Home,
  Trash2,
  ZoomIn,
  ZoomOut,
  Move,
  Tag,
  GripVertical,
  PencilLine,
  StarsIcon,
  MessageCircleQuestion,
  ChevronRight,
  ChevronLeft,
  Upload,
  Save,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { createCv, deleteCv, updateCv } from '@/lib/api/cv';
import { CvDto, CvDetailsDto, UpdateCvDto } from '@/lib/types/cv';
import { DatePickerWithCurrent } from './DatePickerWithCurrent';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAutosave } from '@/lib/hooks/useAutosave';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  profession: string;
  summary: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
  useBulletList: boolean;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface Skill {
  id: string;
  name: string;
}

interface Hobby {
  id: string;
  name: string;
}

interface Language {
  id: string;
  name: string;
  level: string;
}

interface Certificate {
  id: string;
  name: string;
  date: string;
  hasDate: boolean;
}

interface PrivacyStatement {
  id: string;
  content: string;
}

interface CVCreatorProps {
  initialCv?: CvDetailsDto;
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

const makeExperienceId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureExperienceDefaults = (exp: Partial<Experience>): Experience => ({
  id: typeof exp.id === 'string' && exp.id.length > 0 ? exp.id : makeExperienceId(),
  company: exp.company ?? '',
  position: exp.position ?? '',
  startDate: exp.startDate ?? '',
  endDate: exp.endDate ?? '',
  description: exp.description ?? '',
  isCurrent: Boolean(exp.isCurrent),
  useBulletList: Boolean(exp.useBulletList),
});

const makeEducationId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-edu`;

const ensureEducationDefaults = (edu: Partial<Education>): Education => ({
  id: typeof edu.id === 'string' && edu.id.length > 0 ? edu.id : makeEducationId(),
  school: edu.school ?? '',
  degree: edu.degree ?? '',
  field: edu.field ?? '',
  startDate: edu.startDate ?? '',
  endDate: edu.endDate ?? '',
  isCurrent: Boolean(edu.isCurrent),
  description: edu.description ?? '',
});

const makeCertificateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-cert`;

const ensureCertificateDefaults = (cert: Partial<Certificate>): Certificate => ({
  id: typeof cert.id === 'string' && cert.id.length > 0 ? cert.id : makeCertificateId(),
  name: cert.name ?? '',
  date: cert.date ?? '',
  hasDate: cert.hasDate ?? Boolean(cert.date),
});

const CVCreator: React.FC<CVCreatorProps> = ({ initialCv }) => {
  const router = useRouter();
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => {
    const saved = localStorage.getItem('personalInfo');
    return saved
      ? JSON.parse(saved)
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          country: '',
          profession: '',
          summary: '',
        };
  });

  const [skipAutosaveOnce, setSkipAutosaveOnce] = useState(false);
  const [isPremium] = useState(false);
  const [cvId, setCvId] = useState<string | null>(initialCv?.id ?? null);
  const [resumeName] = useState<string>(initialCv?.name ?? 'New Resume');

  // Pagination (computed from measured pages)
  const [currentPage, setCurrentPage] = useState(1);
  type SectionChunk = { sectionId: string; items?: string[]; includeTitle?: boolean };
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

  const [skills, setSkills] = useState<Skill[]>(() => {
    const saved = localStorage.getItem('skills');
    return saved ? JSON.parse(saved) : [];
  });
  const [hobbies, setHobbies] = useState<Hobby[]>(() => {
    const saved = localStorage.getItem('hobbies');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFullDates, setShowFullDates] = useState(true);
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

  // CV Preview controls
  const [cvScale, setCvScale] = useState(0.8);
  const [cvPosition, setCvPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('sectionOrder');
    return saved
      ? JSON.parse(saved)
      : [
          'profile',
          'experience',
          'education',
          'certificates',
          'skills',
          'languages',
          'hobbies',
          'privacy',
        ];
  });
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

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

  const addLanguage = () => {
    const newLanguage: Language = {
      id: Date.now().toString(),
      name: '',
      level: 'Beginner',
    };
    setLanguages([...languages, newLanguage]);
  };

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    setLanguages(languages.map((lang) => (lang.id === id ? { ...lang, [field]: value } : lang)));
  };

  const removeLanguage = (id: string) => {
    setLanguages(languages.filter((lang) => lang.id !== id));
  };

  const addCertificate = () => {
    const newCert: Certificate = {
      id: makeCertificateId(),
      name: '',
      date: '',
      hasDate: true,
    };
    setCertificates([...certificates, newCert]);
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
    setCertificates(certificates.filter((cert) => cert.id !== id));
  };

  // Section drag & drop handlers
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
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
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionId);
  };

  const handleSectionDragLeave = () => {
    setDragOverSection(null);
  };

  const handleSectionDrop = (e: React.DragEvent, targetSectionId: string) => {
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

    setSectionOrder(currentOrder);
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
    dragIntentSectionRef.current = null;
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: makeExperienceId(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrent: false,
      useBulletList: false,
    };
    setExperiences((prev) => [...prev, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id !== id) return exp;

        if (field === 'description' && typeof value === 'string') {
          return {
            ...exp,
            description: mergePlainWithTokens(exp.description, value),
          };
        }

        if (field === 'isCurrent' && typeof value === 'boolean') {
          return { ...exp, isCurrent: value };
        }

        return { ...exp, [field]: value };
      })
    );
  };

  const setExperienceDescriptionTokens = (id: string, tokens: string) => {
    setExperiences((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, description: tokens } : exp))
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
      id: makeEducationId(),
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

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
    };
    setSkills([...skills, newSkill]);
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    setSkills(skills.map((skill) => (skill.id === id ? { ...skill, [field]: value } : skill)));
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter((skill) => skill.id !== id));
  };

  const addHobby = () => {
    const newHobby: Hobby = { id: Date.now().toString(), name: '' };
    setHobbies([...hobbies, newHobby]);
  };

  const updateHobby = (id: string, field: keyof Hobby, value: string) => {
    setHobbies(hobbies.map((hobby) => (hobby.id === id ? { ...hobby, [field]: value } : hobby)));
  };

  const removeHobby = (id: string) => {
    setHobbies(hobbies.filter((hobby) => hobby.id !== id));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (showFullDates) {
      return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
    } else {
      return date.getFullYear().toString();
    }
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
    setCvScale(0.8);
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
      (value) => setExperienceDescriptionTokens(expId, value),
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
      [id]: computeFormattingState(exp.description, selectionStart, selectionEnd),
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

  const populateFromCv = React.useCallback((cv: CvDto, position?: string) => {
    const basics = cv.basics;
    if (basics) {
      setPersonalInfo((prev) => ({
        firstName: basics.firstName,
        lastName: basics.lastName,
        email: basics.email,
        phone: basics.phoneNumber,
        address: basics.location?.city || '',
        country: basics.location?.country || '',
        profession: position ?? prev.profession,
        summary: basics.summary,
      }));
    }

    setExperiences(
      cv.work?.map((w) =>
        ensureExperienceDefaults({
          id: makeExperienceId(),
          company: w.company || '',
          position: w.position || '',
          startDate: w.startDate || '',
          endDate: w.endDate && w.endDate !== 'Present' ? w.endDate : '',
          description: w.description || '',
          isCurrent: w.endDate === 'Present',
          useBulletList: false,
        })
      ) || []
    );

    setEducation(
      cv.education?.map((e) =>
        ensureEducationDefaults({
          id: makeEducationId(),
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

    setCertificates(
      cv.certificates?.map((c) =>
        ensureCertificateDefaults({
          id: makeCertificateId(),
          name: c.name,
          date: c.date || '',
          hasDate: Boolean(c.date),
        })
      ) || []
    );

    setSkills(cv.skills?.map((s, idx) => ({ id: `${Date.now()}${idx}`, name: s })) || []);

    setLanguages(
      cv.languages?.map((l, idx) => ({
        id: `${Date.now()}${idx}`,
        name: l.language,
        level: l.fluency,
      })) || []
    );
  }, []);

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
        description: w.description,
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
      skills: skills.map((s) => s.name),
      languages: languages.map((l) => ({ language: l.name, fluency: l.level })),
    };
  };

  const canAutosave = Boolean(cvId);

  const autosavePayload = {
    id: cvId!,
    name: resumeName,
    targetPosition: personalInfo.profession || undefined,
    cvData: buildCvDto(), // zakładam, że masz taką funkcję generującą aktualne dane CV
  };

  const { status: autosaveStatus, trigger } = useAutosave({
    value: autosavePayload,
    enabled: canAutosave,
    delay: 60000, // 60s od ostatniej zmiany
    skipOnce: skipAutosaveOnce, // flaga ustawiana po "Load profile"
    onSkipConsumed: () => setSkipAutosaveOnce(false),
  });

  const autosaveFn = async (payload: typeof autosavePayload, signal: AbortSignal) => {
    await updateCv(payload, { signal });
  };

  useEffect(() => {
    if (!canAutosave) return;
    trigger(autosaveFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    personalInfo,
    experiences,
    education,
    skills,
    languages,
    certificates,
    hobbies,
    privacyStatement,
    sectionOrder,
    resumeName,
  ]);

  const handleSave = async () => {
    if (!cvId) return;

    const payload: UpdateCvDto = {
      id: cvId,
      name: resumeName,
      targetPosition: personalInfo.profession || undefined,
      cvData: buildCvDto(),
    };

    try {
      await updateCv(payload);
    } catch (err) {
      console.error('Failed to save CV', err);
    }
  };

  const loadFromProfile = async () => {
    try {
      if (!cvId) return;

      const generated = await createCv({
        name: 'Generated CV',
        targetPosition: personalInfo.profession,
        createFromProfile: true,
      });

      // 1) Zapisz dane do bieżącego CV
      await updateCv({
        id: cvId,
        name: resumeName,
        targetPosition: generated.targetPosition,
        cvData: generated.cvData,
      });

      // 2) Wypełnij formularz danymi
      populateFromCv(generated.cvData, generated.targetPosition || undefined);

      // 3) Usuń tymczasowy rekord
      await deleteCv(generated.id);

      // 4) Pomiń JEDEN autosave (żeby nie zapisywać od razu po wczytaniu profilu)
      setSkipAutosaveOnce(true);
    } catch (err) {
      console.error('Failed to generate CV from profile', err);
    }
  };

  useEffect(() => {
    if (initialCv) {
      populateFromCv(initialCv.cvData, initialCv.targetPosition || undefined);
      setCvId(initialCv.id);
    }
  }, [initialCv, populateFromCv]);

  const downloadPDF = async () => {
    const container = pagesViewportRef.current;
    const zoomWrapper = zoomWrapperRef.current;
    if (!container || !zoomWrapper) return;

    const origTransform = zoomWrapper.style.transform;
    // Temporarily disable transform for crisp rendering
    zoomWrapper.style.transform = 'none';
    // Temporarily remove shadows/borders from pages to avoid capture discrepancies
    const pagesNodes = container.querySelectorAll<HTMLElement>('.cv-page');
    const restoreStyles: Array<{ el: HTMLElement; boxShadow: string; border: string }> = [];
    pagesNodes.forEach((el) => {
      restoreStyles.push({
        el,
        boxShadow: el.style.boxShadow || '',
        border: el.style.border || '',
      });
      el.style.boxShadow = 'none';
      el.style.border = 'none';
    });
    await new Promise((r) => setTimeout(r, 50));

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const CANVAS_SCALE = 1.6; // balance between clarity and size (~1.6 ≈ 150dpi)
    const JPEG_QUALITY = 0.92; // slightly higher quality for sharper text
    for (let i = 0; i < pagesNodes.length; i++) {
      const pageEl = pagesNodes[i];
      const canvas = await html2canvas(pageEl, {
        scale: CANVAS_SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    }

    // Restore zoom transform
    zoomWrapper.style.transform = origTransform;
    // Restore styles
    restoreStyles.forEach(({ el, boxShadow, border }) => {
      el.style.boxShadow = boxShadow;
      el.style.border = border;
    });

    const fileName =
      personalInfo.firstName && personalInfo.lastName
        ? `${personalInfo.firstName}_${personalInfo.lastName}_CV.pdf`
        : 'My_CV.pdf';
    pdf.save(fileName);
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
              personalInfo.summary
          );
        case 'experience':
          return experiences.length > 0;
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
      education,
      certificates,
      skills,
      languages,
      hobbies,
      privacyStatement,
    ]
  );

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
      } else if (id === 'certificates') {
        const nodes = el.querySelectorAll<HTMLElement>('.cert-item[data-item-id]');
        nodes.forEach((n) => {
          const csI = getComputedStyle(n);
          const mti = parseFloat(csI.marginTop || '0') || 0;
          const mbi = parseFloat(csI.marginBottom || '0') || 0;
          const itemId = n.getAttribute('data-item-id') || '';
          items.push({ id: itemId, h: n.offsetHeight + mti + mbi });
        });
      } else if (id === 'profile' || id === 'privacy') {
        const nodes = el.querySelectorAll<HTMLElement>('.para-item[data-item-id]');
        nodes.forEach((n) => {
          const csI = getComputedStyle(n);
          const mti = parseFloat(csI.marginTop || '0') || 0;
          const mbi = parseFloat(csI.marginBottom || '0') || 0;
          const itemId = n.getAttribute('data-item-id') || '';
          items.push({ id: itemId, h: n.offsetHeight + mti + mbi });
        });
      }
      if (items.length) sectionItemHeights.set(id, items);
    });

    const visible = sectionOrder.filter((id) => isSectionVisible(id));
    const pagesAcc: SectionChunk[][] = [];
    let current: SectionChunk[] = [];
    // First page starts with header space allocated
    let used = headerHeight;
    const SAFETY_PX = 4; // guard for rounding/borders
    const limit = pageContentHeightPx - SAFETY_PX; // px

    const pushPage = () => {
      pagesAcc.push(current);
      current = [];
      used = 0; // next page without header
    };

    for (const id of visible) {
      const wholeH = heights.get(id) ?? 0;
      if (wholeH <= 0) continue;

      // If whole section fits on current page
      if ((used > 0 && used + wholeH <= limit) || (used === 0 && wholeH <= limit)) {
        current.push({ sectionId: id, includeTitle: true });
        used += wholeH;
        continue;
      }

      // If section doesn't fit fully, try to split by items when possible
      const items = sectionItemHeights.get(id);
      const secHeaderH = sectionHeaderHeights.get(id) || 0;

      if (!items || !items.length) {
        // No way to split; move to next page if not empty, then place it (may overflow)
        if (used > 0) {
          pushPage();
        }
        current.push({ sectionId: id, includeTitle: true });
        used = wholeH; // may exceed limit; last resort
        continue;
      }

      // Split list items across pages
      let idx = 0;
      while (idx < items.length) {
        // Ensure at least header fits, otherwise new page
        if (used > 0 && used + secHeaderH >= limit) {
          pushPage();
        }
        const chunkIds: string[] = [];
        let chunkH = secHeaderH;
        const pageRemaining = limit - used;

        // If even header alone exceeds page, force new page
        if (chunkH > pageRemaining && used > 0) {
          pushPage();
        }

        // Fit as many items as possible on this page
        while (idx < items.length) {
          const it = items[idx];
          if (chunkH + it.h <= limit - used) {
            chunkIds.push(it.id);
            chunkH += it.h;
            idx++;
          } else {
            break;
          }
        }

        // If nothing fits (single item larger than page), force place one to avoid infinite loop
        if (chunkIds.length === 0 && idx < items.length) {
          chunkIds.push(items[idx].id);
          chunkH += items[idx].h;
          idx++;
        }

        current.push({ sectionId: id, includeTitle: true, items: chunkIds });
        used += chunkH;

        // If next item remains, start a new page for continuation
        if (idx < items.length) {
          pushPage();
        }
      }
    }

    if (current.length) pagesAcc.push(current);

    setPages(pagesAcc);
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), Math.max(pagesAcc.length, 1)));
  }, [
    personalInfo,
    experiences,
    education,
    skills,
    languages,
    certificates,
    hobbies,
    privacyStatement,
    sectionOrder,
    pageContentHeightPx,
    isSectionVisible,
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
                Personal profile
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              A short summary at the top of your CV that highlights relevant experience and
              qualifications in 4–6 sentences.
            </p>
            <RichTextToolbar
              className="mb-2"
              onFormat={handleSummaryFormatting}
              formattingState={summaryFormatting}
            />
            <textarea
              ref={summaryTextareaRef}
              placeholder="Project Manager with over 5 years of experience, seeking new opportunities."
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
                      <h4 className="text-sm font-semibold">Will it actually help me?</h4>
                      <p className="text-sm">
                        It&apos;ll surely do. Our AI models are trained specifically to match
                        requirements of the algorithms used by recruiters.
                      </p>
                      <div className="text-muted-foreground text-xs">Confirmed by 1000+ users.</div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <button
                className={`flex flex-row items-center justify-center rounded-sm border bg-[#915EFF] px-3 py-2 text-sm text-white transition-all hover:bg-[#713ae8] focus:outline-none ${isPremium ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                <span className="text-sm text-white">Achieve more with AI</span>
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
                Work experience
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Showcase your achievements by describing your daily responsibilities in 3–6 sentences,
              then list at least two key accomplishments.
            </p>
            {experiences.map((exp) => {
              const formattingState = experienceFormattingState[exp.id] ?? EMPTY_FORMATTING_STATE;

              return (
                <div
                  key={exp.id}
                  className="group mb-4 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Position"
                          value={exp.position}
                          onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm text-gray-600">Start date</label>
                          <DatePickerWithCurrent
                            value={exp.startDate}
                            onChange={(date) => updateExperience(exp.id, 'startDate', date)}
                            isCurrent={false}
                            onCurrentChange={() => {}}
                            showCurrentToggle={false}
                            placeholder="Select start date"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-gray-600">End date</label>
                          <DatePickerWithCurrent
                            value={exp.endDate}
                            onChange={(date) => updateExperience(exp.id, 'endDate', date)}
                            isCurrent={exp.isCurrent}
                            onCurrentChange={(current) =>
                              updateExperience(exp.id, 'isCurrent', current)
                            }
                            placeholder="Select end date"
                          />
                        </div>
                      </div>
                      <RichTextToolbar
                        className="mt-2 mb-2"
                        onFormat={(type) =>
                          handleExperienceFormatting(exp.id, exp.description, type)
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
                        placeholder="Job description / Responsibilities"
                        value={stripFormattingTokens(exp.description)}
                        onChange={(e) => {
                          const plainValue = e.target.value;
                          const selectionStart = e.target.selectionStart ?? 0;
                          const selectionEnd = e.target.selectionEnd ?? selectionStart;
                          const nextTokens = mergePlainWithTokens(exp.description, plainValue);
                          setExperiences((prev) =>
                            prev.map((experience) =>
                              experience.id === exp.id
                                ? { ...experience, description: nextTokens }
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
                        rows={2}
                        className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />

                      <div className="flex w-full items-center justify-end space-x-2">
                        <button
                          onClick={() => removeExperience(exp.id)}
                          className="ml-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                          title="remove Work experience"
                        >
                          <Trash2 size={16} />
                        </button>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm bg-gray-100">
                              <MessageCircleQuestion className="text-gray-400" size={20} />
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent className="font-poppins w-80">
                            <div className="flex justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">Will it acutally help me?</h4>
                                <p className="text-sm">
                                  It&apos;ll surely do. Our AI models are trained specifically to
                                  match requirements of the algorithms used by recruiters.
                                </p>
                                <div className="text-muted-foreground text-xs">
                                  Confirmed by 1000+ users.
                                </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        <button
                          className={`flex flex-row items-center justify-center rounded-sm border bg-[#915EFF] px-3 py-2 text-sm text-white transition-all hover:bg-[#713ae8] focus:outline-none ${isPremium ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        >
                          <span className="text-sm text-white">Achieve more with AI</span>
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
              Add work experience
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
                Education
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Add your education, whether it&apos;s secondary or higher. If needed, include relevant
              courses, projects, or achievements (e.g. grades).
            </p>
            {education.map((edu) => {
              const formattingState = educationFormattingState[edu.id] ?? EMPTY_FORMATTING_STATE;

              return (
                <div
                  key={edu.id}
                  className="group mb-4 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="School/University"
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Field of study"
                          value={edu.field}
                          onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm text-gray-600">Start date</label>
                          <DatePickerWithCurrent
                            value={edu.startDate}
                            onChange={(date) => updateEducation(edu.id, 'startDate', date)}
                            isCurrent={false}
                            onCurrentChange={() => {}}
                            showCurrentToggle={false}
                            placeholder="Select start date"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-gray-600">End date</label>
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
                            placeholder="Select end date"
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
                        placeholder="Achievements, coursework, GPA, notable projects"
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
                        rows={2}
                        className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="ml-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                      title="Remove education"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              onClick={addEducation}
              className="flex cursor-pointer items-center font-medium text-[#915EFF]"
            >
              <span className="mr-2 text-xl">+</span>
              Add education
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
                Certificates
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">List your certifications.</p>
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="group mb-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Certificate name"
                    value={cert.name}
                    onChange={(e) => updateCertificate(cert.id, 'name', e.target.value)}
                    className="flex-1 focus:outline-none"
                  />
                  <div className="flex flex-1 justify-end">
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
                      toggleLabel="Has date"
                      toggledButtonText="No date"
                      placeholder="Select date"
                    />
                  </div>
                  <button
                    onClick={() => removeCertificate(cert.id)}
                    className="ml-0 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700 sm:ml-2"
                    title="Remove certificate"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addCertificate}
              className="flex cursor-pointer items-center font-medium text-[#915EFF]"
            >
              <span className="mr-2 text-xl">+</span>
              Add certificate
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
                Skills
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Describe your areas of specialization, focusing on relevant hard skills.
            </p>
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="group mb-3 rounded-md border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Skill name"
                    value={skill.name}
                    onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                    className="flex-1 focus:outline-none"
                  />
                  <button
                    onClick={() => removeSkill(skill.id)}
                    className="ml-2 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                    title="Remove skill"
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
              Add skill
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
                Languages
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Add the languages you know along with your level of proficiency.
            </p>
            {languages.map((language) => (
              <div
                key={language.id}
                className="group mb-3 rounded-lg border border-gray-200 bg-white/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 gap-3">
                    <input
                      type="text"
                      placeholder="Language"
                      value={language.name}
                      onChange={(e) => updateLanguage(language.id, 'name', e.target.value)}
                      className="flex-1 focus:outline-none"
                    />
                    <Select
                      value={language.level}
                      onValueChange={(value) => updateLanguage(language.id, 'level', value)}
                    >
                      <SelectTrigger className="font-poppins h-10 w-40 rounded-sm border border-gray-300 px-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Conversational">Conversational</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                        <SelectItem value="Proficient">Proficient</SelectItem>
                        <SelectItem value="Native speaker">Native speaker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    onClick={() => removeLanguage(language.id)}
                    className="ml-2 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                    title="Remove language"
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
              Add language
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
                Hobby
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Add your interests and extracurricular activities that reflect your personality.
            </p>
            {hobbies.map((hobby) => (
              <div
                key={hobby.id}
                className="group mb-3 flex items-center rounded-lg border border-gray-200 bg-white p-3"
              >
                <input
                  type="text"
                  placeholder="e.g. Reading, Traveling, Cooking"
                  value={hobby.name}
                  onChange={(e) => updateHobby(hobby.id, 'name', e.target.value)}
                  className="flex-1 focus:outline-none"
                />
                <button
                  onClick={() => removeHobby(hobby.id)}
                  className="ml-2 rounded p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={addHobby} className="flex items-center font-medium text-[#915EFF]">
              <span className="mr-2 text-xl">+</span>
              Add hobby
            </button>
          </div>
        );
      case 'privacy':
        return (
          <div
            key="privacy"
            className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
              dragOverSection === 'privacy' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            } ${draggedSection === 'privacy' ? 'opacity-50' : ''}`}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, 'privacy')}
            onDragOver={(e) => handleSectionDragOver(e, 'privacy')}
            onDragLeave={handleSectionDragLeave}
            onDrop={(e) => handleSectionDrop(e, 'privacy')}
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
                    dragIntentSectionRef.current = 'privacy';
                  }}
                  onMouseUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      dragIntentSectionRef.current = 'privacy';
                    }
                  }}
                  onKeyUp={() => {
                    dragIntentSectionRef.current = null;
                  }}
                >
                  <GripVertical size={20} />
                </span>
                <PencilLine className="mr-2" size={20} />
                Privacy Statement
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Add your privacy statement or data processing consent information.
            </p>
            <textarea
              placeholder="I agree to the processing of personal data provided in this document for the purposes of the recruitment process..."
              value={privacyStatement.content}
              onChange={(e) =>
                setPrivacyStatement({ ...privacyStatement, content: e.target.value })
              }
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
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
              Personal Profile
            </h3>
            <div className="text-sm leading-relaxed break-words text-gray-700">
              {(personalInfo.summary || '')
                .split(/\n+/)
                .filter(Boolean)
                .map((para, i) => (
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
              Work Experience
            </h3>
            {experiences.map((exp) => (
              <div key={exp.id} className="exp-item mb-4" data-item-id={exp.id}>
                {/* Nagłówek stanowisko + firma */}
                <div className="exp-header mb-1 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-900">
                      {exp.position || 'Position'}
                    </div>
                    <div className="truncate font-medium text-gray-700">
                      {exp.company || 'Company name'}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                    {formatDate(exp.startDate)} -{' '}
                    {exp.isCurrent || !exp.endDate ? 'present' : formatDate(exp.endDate)}
                  </div>
                </div>

                {/* Opis */}
                {renderExperienceDescription(exp)}
              </div>
            ))}
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
              Education
            </h3>
            {education.map((edu) => (
              <div key={edu.id} className="edu-item mb-3" data-item-id={edu.id}>
                <div className="mb-1 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-gray-900">
                      {edu.field || 'Field of study'} - {edu.degree || 'Degree'}
                    </h4>
                    <p className="truncate font-medium text-gray-700">
                      {edu.school || 'School/University'}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                    {formatDate(edu.startDate)} -{' '}
                    {edu.isCurrent || !edu.endDate ? 'present' : formatDate(edu.endDate)}
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
              Certificates
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
              Skills
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
              Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language.id}
                  className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800"
                >
                  {language.name || 'Language'} - {language.level}
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
              Hobby
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
              Privacy Statement
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
          : 'Joe Doe'}
      </h1>
      {personalInfo.profession && (
        <h2 className="mb-4 text-xl text-gray-600">{personalInfo.profession}</h2>
      )}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {personalInfo.email && (
          <div className="flex items-center">
            <Mail size={14} className="mr-2 flex-shrink-0" />
            <span className="break-all">{personalInfo.email}</span>
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
      </div>
    </div>
  );

  const renderSectionTitle = (sectionId: string) => {
    switch (sectionId) {
      case 'profile':
        return (
          <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            Personal Profile
          </h3>
        );
      case 'experience':
        return (
          <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            <Briefcase size={16} className="mr-2" />
            Work Experience
          </h3>
        );
      case 'education':
        return (
          <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            <GraduationCap size={16} className="mr-2" />
            Education
          </h3>
        );
      case 'certificates':
        return (
          <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            <Award size={16} className="mr-2" />
            Certificates
          </h3>
        );
      case 'privacy':
        return (
          <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
            Privacy Statement
          </h3>
        );
      default:
        return null;
    }
  };

  const renderExperienceDescription = (exp: Experience) => {
    if (!exp.description) {
      return null;
    }

    const rawLines = exp.description.split(/\r?\n/);

    if (exp.useBulletList) {
      const blocks: Array<{ type: 'bullet'; items: string[] } | { type: 'text'; content: string }> =
        [];

      rawLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return;
        }

        const bulletPrefixes = ['- ', '• '];
        const prefix = bulletPrefixes.find((p) => trimmed.startsWith(p));

        if (prefix) {
          const content = trimmed.slice(prefix.length).trim();
          if (!content) {
            return;
          }
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.type === 'bullet') {
            lastBlock.items.push(content);
          } else {
            blocks.push({ type: 'bullet', items: [content] });
          }
        } else {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.type === 'text') {
            lastBlock.content = `${lastBlock.content}\n${trimmed}`;
          } else {
            blocks.push({ type: 'text', content: trimmed });
          }
        }
      });

      if (blocks.length > 0) {
        return (
          <div className="space-y-2 text-sm leading-relaxed text-gray-700">
            {blocks.map((block, idx) => {
              if (block.type === 'bullet') {
                return (
                  <ul
                    key={`${exp.id}-bullets-${idx}`}
                    className="ml-5 space-y-1 text-sm leading-relaxed text-gray-700"
                  >
                    {block.items.map((item, itemIdx) => (
                      <li
                        key={`${exp.id}-bullet-${idx}-${itemIdx}`}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-[2px] text-gray-500">-</span>
                        <span
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(item) }}
                        />
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p
                  key={`${exp.id}-text-${idx}`}
                  className="text-sm leading-relaxed text-gray-700"
                  dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(block.content) }}
                />
              );
            })}
          </div>
        );
      }
    }

    return (
      <div
        className="exp-desc text-sm leading-relaxed text-gray-700"
        dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(exp.description) }}
      />
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
                <div className="truncate font-semibold text-gray-900">
                  {exp.position || 'Position'}
                </div>
                <div className="truncate font-medium text-gray-700">
                  {exp.company || 'Company name'}
                </div>
              </div>
              <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                {formatDate(exp.startDate)} -{' '}
                {exp.isCurrent || !exp.endDate ? 'present' : formatDate(exp.endDate)}
              </div>
            </div>
            {renderExperienceDescription(exp)}
          </div>
        ))}
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
                <h4 className="truncate font-semibold text-gray-900">
                  {edu.field || 'Field of study'} - {edu.degree || 'Degree'}
                </h4>
                <p className="truncate font-medium text-gray-700">
                  {edu.school || 'School/University'}
                </p>
              </div>
              <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                {formatDate(edu.startDate)} -{' '}
                {edu.isCurrent || !edu.endDate ? 'present' : formatDate(edu.endDate)}
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
              {(personalInfo.summary || '')
                .split(/\n+/)
                .filter(Boolean)
                .map((para, i) => {
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
              {(privacyStatement.content || '')
                .split(/\n+/)
                .filter(Boolean)
                .map((para, i) => {
                  const id = `p${i}`;
                  if (!items.includes(id)) return null;
                  return (
                    <p key={`priv-${i}`} className="para-item mb-2 last:mb-0" data-item-id={id}>
                      {para}
                    </p>
                  );
                })}
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

  return (
    <div className="font-poppins flex h-screen flex-col overflow-hidden bg-gray-50 lg:flex-row lg:pt-6 dark:text-black">
      {/* Top Navigation for Mobile */}
      <div className="mb-4 flex items-center justify-center bg-white py-4 shadow-lg lg:hidden">
        <button
          onClick={() => router.push('/resume')}
          className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-100"
          title="Dashboard"
        >
          <Home size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="mx-3 hidden w-16 flex-col items-center justify-between rounded-lg bg-white py-6 shadow-lg lg:flex">
        <button
          onClick={() => router.push('/resume')}
          className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-100"
          title="Dashboard"
        >
          <Home size={24} className="text-gray-600" />
        </button>
        <button
          onClick={handleSave}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-gray-100"
          title="Save resume"
        >
          <Save size={16} className="h-6 w-6 text-black" />
          <div className="mt-2 flex flex-row items-center justify-center text-[9px]">
            {autosaveStatus === 'saving' && <span className="text-gray-500">Saving…</span>}
            {autosaveStatus === 'saved' && <span className="text-green-600">Saved ✓</span>}
            {autosaveStatus === 'error' && <span className="text-red-500">Save failed</span>}
          </div>
        </button>

        <HoverCard>
          <HoverCardTrigger asChild>
            <button className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-sm bg-gray-100">
              v1.0.0
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="font-poppins w-80">
            <div className="flex justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Beta version</h4>
                <p className="text-sm">
                  Be aware of bugs or missing features. We are working hard to improve the
                  application.
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

      {/* Main Content */}
      <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden px-3 lg:flex-row lg:px-0">
        {/* Left Panel - Form Inputs */}
        <div className="h-full overflow-y-auto rounded-lg bg-white shadow-lg lg:w-[48%]">
          <div className="max-h-full overflow-y-auto p-4 lg:p-6">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h1 className="text-xl font-bold text-gray-800 lg:text-xl">Resume creator</h1>
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Date format:</label>
                <Select
                  value={showFullDates ? 'full' : 'year'}
                  onValueChange={(value) => setShowFullDates(value === 'full')}
                >
                  <SelectTrigger className="font-poppins h-10 w-40 rounded-sm border border-gray-300 px-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Month & year</SelectItem>
                    <SelectItem value="year">Just year</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={loadFromProfile}
                  className="flex cursor-pointer items-center space-x-2 rounded border border-[#915EFF] bg-[#915EFF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#713ae8]"
                  title="Load data from profile and save time"
                >
                  <Upload size={16} className="mr-2 text-white" />
                  Load profile
                </button>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4 lg:p-6">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-700">
                <User className="mr-2" size={20} />
                Personal details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Name</label>
                    <input
                      type="text"
                      placeholder="Joe"
                      value={personalInfo.firstName}
                      onChange={(e) =>
                        setPersonalInfo({ ...personalInfo, firstName: e.target.value })
                      }
                      className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={personalInfo.lastName}
                      onChange={(e) =>
                        setPersonalInfo({ ...personalInfo, lastName: e.target.value })
                      }
                      className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-600">E-mail address</label>
                  <input
                    type="email"
                    placeholder="joedoe@gmail.com"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-600">Position</label>
                  <input
                    type="text"
                    placeholder="e.g. Project Manager"
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
                    Show additional fields
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">Phone number</label>
                        <input
                          type="tel"
                          placeholder="e.g. +48 22 263 98 31"
                          value={personalInfo.phone}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, phone: e.target.value })
                          }
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">Address</label>
                        <input
                          type="text"
                          placeholder="e.g. 221B Baker Street, London"
                          value={personalInfo.address}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, address: e.target.value })
                          }
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">Country</label>
                        <input
                          type="text"
                          placeholder="e.g. Poland"
                          value={personalInfo.country}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, country: e.target.value })
                          }
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {sectionOrder.map((sectionId) => renderSectionInForm(sectionId))}
          </div>
        </div>

        {/* Right Panel - CV Preview */}
        <div className="flex flex-col overflow-hidden rounded-lg bg-gray-100 lg:w-[52%]">
          {/* Preview Controls */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-700">Resume Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadPDF}
                className="flex cursor-pointer items-center space-x-2 rounded border border-[#915EFF] bg-[#915EFF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#713ae8]"
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
                <span>Download</span>
              </button>

              {/* Istniejące przyciski zoom */}
              <button
                onClick={handleZoomOut}
                className="cursor-pointer rounded p-2 transition-colors hover:bg-gray-100"
                title="Pomniejsz"
              >
                <ZoomOut size={18} />
              </button>
              <span className="min-w-12 text-center text-sm text-gray-600">
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
                className="cursor-pointer rounded p-2 text-sm transition-colors hover:bg-gray-100"
                title="Resetuj widok"
              >
                Reset
              </button>
              <div className="flex items-center text-sm text-gray-500">
                <Move size={16} className="mr-1" />
                Drag and move
              </div>
            </div>
          </div>

          {/* CV Preview Container */}
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
                style={{
                  transform: `translate(${cvPosition.x}px, ${cvPosition.y}px) scale(${cvScale})`,
                  transformOrigin: 'top center',
                  padding: '40px 0',
                }}
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
                    className="cv-page mb-6 overflow-hidden rounded-sm shadow"
                    style={{
                      width: `${PAGE_WIDTH_MM}mm`,
                      height: `${PAGE_HEIGHT_MM}mm`,
                      background: '#fff',
                    }}
                  >
                    <div className="box-border h-full" style={{ padding: `${PAGE_PADDING_MM}mm` }}>
                      {idx === 0 && renderHeader()}
                      {page.map((chunk, cidx) => (
                        <React.Fragment key={`p${idx}-c${cidx}`}>
                          {renderChunk(chunk)}
                        </React.Fragment>
                      ))}
                      {/* Empty state message on first page */}
                      {idx === 0 &&
                        !personalInfo.firstName &&
                        !personalInfo.lastName &&
                        !personalInfo.email &&
                        experiences.length === 0 &&
                        skills.length === 0 &&
                        education.length === 0 && (
                          <div className="mt-20 text-center text-gray-500">
                            <p className="text-lg">
                              Start filling the form on the left to create your CV.
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
                  isHovered
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-16 opacity-0'
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
        </div>
      </div>
    </div>
  );
};

export default CVCreator;
