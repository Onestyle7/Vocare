'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { createCv, updateCv } from '@/lib/api/cv';
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
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
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
}

interface PrivacyStatement {
  id: string;
  content: string;
}

interface CVCreatorProps {
  initialCv?: CvDetailsDto;
}

const CVCreator: React.FC<CVCreatorProps> = ({ initialCv }) => {
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

  const [isPremium] = useState(false);
  const [cvId, setCvId] = useState<string | null>(initialCv?.id ?? null);
  const [resumeName] = useState<string>(initialCv?.name ?? 'New Resume');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [experiences, setExperiences] = useState<Experience[]>(() => {
    const saved = localStorage.getItem('experiences');
    return saved ? JSON.parse(saved) : [];
  });
  const [education, setEducation] = useState<Education[]>(() => {
    const saved = localStorage.getItem('education');
    return saved ? JSON.parse(saved) : [];
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
    return saved ? JSON.parse(saved) : [];
  });

  const [privacyStatement, setPrivacyStatement] = useState<PrivacyStatement>(() => {
    const saved = localStorage.getItem('privacyStatement');
    return saved ? JSON.parse(saved) : { id: 'privacy', content: '' };
  });

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

  useEffect(() => {
    checkContentOverflow();
  }, [
    experiences,
    education,
    skills,
    languages,
    certificates,
    hobbies,
    personalInfo,
    privacyStatement,
  ]);

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
      id: Date.now().toString(),
      name: '',
      date: '',
    };
    setCertificates([...certificates, newCert]);
  };

  const updateCertificate = (id: string, field: keyof Certificate, value: string) => {
    setCertificates(
      certificates.map((cert) => (cert.id === id ? { ...cert, [field]: value } : cert))
    );
  };

  const removeCertificate = (id: string) => {
    setCertificates(certificates.filter((cert) => cert.id !== id));
  };

  // Section drag & drop handlers
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
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
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrent: false,
    };
    setExperiences([...experiences, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setExperiences(experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
    };
    setEducation([...education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    setEducation(education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
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

  const checkContentOverflow = () => {
    const cvElement = document.querySelector<HTMLElement>('.cv-content');
    if (!cvElement) return;
    const contentHeight = cvElement.scrollHeight;
    const pageHeight = cvElement.clientHeight;
    const newTotalPages = Math.ceil(contentHeight / pageHeight);
    setTotalPages(newTotalPages);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const populateFromCv = (cv: CvDto, position?: string) => {
    if (cv.basics) {
      setPersonalInfo({
        firstName: cv.basics.firstName,
        lastName: cv.basics.lastName,
        email: cv.basics.email,
        phone: cv.basics.phoneNumber,
        address: cv.basics.location?.city || '',
        country: cv.basics.location?.country || '',
        profession: position || personalInfo.profession,
        summary: cv.basics.summary,
      });
    }

    setExperiences(
      cv.work?.map((w, idx) => ({
        id: `${Date.now()}${idx}`,
        company: w.company || '',
        position: w.position || '',
        startDate: w.startDate || '',
        endDate: w.endDate && w.endDate !== 'Present' ? w.endDate : '',
        description: w.description || '',
        isCurrent: w.endDate === 'Present',
      })) || []
    );

    setEducation(
      cv.education?.map((e, idx) => ({
        id: `${Date.now()}${idx}`,
        school: e.institution || '',
        degree: e.degree || '',
        field: e.field || '',
        startDate: e.startDate || '',
        endDate: e.endDate && e.endDate !== 'Present' ? e.endDate : '',
        isCurrent: e.endDate === 'Present',
      })) || []
    );

    setCertificates(
      cv.certificates?.map((c, idx) => ({
        id: `${Date.now()}${idx}`,
        name: c.name,
        date: c.date || '',
      })) || []
    );

    setSkills(cv.skills?.map((s, idx) => ({ id: `${Date.now()}${idx}`, name: s })) || []);

    setLanguages(
      cv.languages?.map((l, idx) => ({
        id: `${Date.now()}${idx}`,
        name: l.language,
        level: l.fluency,
      })) || []
    );
  };

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
      })),
      certificates: certificates.map((c) => ({ name: c.name, date: c.date })),
      skills: skills.map((s) => s.name),
      languages: languages.map((l) => ({ language: l.name, fluency: l.level })),
    };
  };

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
      const cv = await createCv({
        name: 'Generated CV',
        targetPosition: personalInfo.profession,
        createFromProfile: true,
      });
      populateFromCv(cv.cvData, cv.targetPosition || undefined);
    } catch (err) {
      console.error('Failed to generate CV from profile', err);
    }
  };

  useEffect(() => {
    if (initialCv) {
      populateFromCv(initialCv.cvData, initialCv.targetPosition || undefined);
      setCvId(initialCv.id);
    }
  }, [initialCv]);

  const downloadPDF = async () => {
    try {
      // ► Zamiana querySelector na generyczny HTMLElement
      const cvElement = document.querySelector<HTMLElement>('.cv-content');
      if (!cvElement) return;

      const originalScale = cvScale;
      setCvScale(1);

      // Poczekaj na przerender
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ► Rzutowanie dla html2canvas
      const canvas = await html2canvas(cvElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff', 
        width: cvElement.offsetWidth,
        height: cvElement.offsetHeight,
      });

      setCvScale(originalScale);

      const imgData = canvas.toDataURL('image/png');

      // A4 rozmiary w mm
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Oblicz wymiary obrazu zachowując proporcje
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let yPosition = 0;
        let pageCount = 0;

        while (yPosition < imgHeight) {
          if (pageCount > 0) {
            pdf.addPage();
          }

          const sourceY = (yPosition * canvas.height) / imgHeight;
          const sourceHeight = Math.min(
            (pdfHeight * canvas.height) / imgHeight,
            canvas.height - sourceY
          );

          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          if (!pageCtx) {
            console.error('Could not get 2D context from pageCanvas');
            return; 
          }

          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;

          pageCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );

          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;

          pageCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = (sourceHeight * pdfWidth) / canvas.width;

          pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, pageImgHeight);

          yPosition += pdfHeight;
          pageCount++;
        }
      }

      // Wygeneruj nazwę pliku
      const fileName =
        personalInfo.firstName && personalInfo.lastName
          ? `${personalInfo.firstName}_${personalInfo.lastName}_CV.pdf`
          : 'My_CV.pdf';

      pdf.save(fileName);
    } catch (error) {
      console.error('Błąd podczas generowania PDF:', error);
      alert('Wystąpił błąd podczas pobierania CV. Spróbuj ponownie.');
    }
  };

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
                <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
                <User className="mr-2" size={20} />
                Personal profile
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              A short summary at the top of your CV that highlights relevant experience and
              qualifications in 4–6 sentences.
            </p>
            <textarea
              placeholder="Project Manager with over 5 years of experience, seeking new opportunities."
              value={personalInfo.summary}
              onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
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
                      <h4 className="text-sm font-semibold">Will it acutally help me?</h4>
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
                className={`flex flex-row items-center justify-center rounded-sm border bg-red-500 px-3 py-2 text-sm text-white transition-all hover:bg-red-500/90 focus:outline-none ${isPremium ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
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
                <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
                <Briefcase className="mr-2" size={20} />
                Work experience
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Showcase your achievements by describing your daily responsibilities in 3–6 sentences,
              then list at least two key accomplishments.
            </p>
            {experiences.map((exp) => (
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
                    <textarea
                      placeholder="Job description / Responsibilities"
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
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
                        className={`flex flex-row items-center justify-center rounded-sm border bg-red-500 px-3 py-2 text-sm text-white transition-all hover:bg-red-500/90 focus:outline-none ${isPremium ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                      >
                        <span className="text-sm text-white">Achieve more with AI</span>
                        <StarsIcon className="ml-2 scale-70" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addExperience}
              className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
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
                <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
                <GraduationCap className="mr-2" size={20} />
                Education
              </h2>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Add your education, whether it&apos;s secondary or higher. If needed, include relevant
              courses, projects, or achievements (e.g., grades).
            </p>
            {education.map((edu) => (
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
            ))}
            <button
              onClick={addEducation}
              className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
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
                <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
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
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Certificate name"
                    value={cert.name}
                    onChange={(e) => updateCertificate(cert.id, 'name', e.target.value)}
                    className="flex-1 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={cert.date}
                    onChange={(e) => updateCertificate(cert.id, 'date', e.target.value)}
                    className="rounded-sm border px-3 py-2 focus:outline-none"
                  />
                  <button
                    onClick={() => removeCertificate(cert.id)}
                    className="ml-2 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                    title="Remove certificate"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addCertificate}
              className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
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
                <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
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
              className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
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
                <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
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
                    <select
                      value={language.level}
                      onChange={(e) => updateLanguage(language.id, 'level', e.target.value)}
                      className="rounded-sm border px-3 py-2 focus:outline-none"
                    >
                      <option value="Ogólny">Ogólny</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Conversational">Conversational</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Proficient">Proficient</option>
                      <option value="Native speaker">Native speaker</option>
                    </select>
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
              className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
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
                <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
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
                  placeholder="e.g., Reading, Traveling, Cooking"
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
            <button
              onClick={addHobby}
              className="flex items-center font-medium text-red-600 hover:text-red-700"
            >
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
                <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
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
            className="mb-5"
            key="profile"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              Personal Profile
            </h3>
            <p className="text-sm leading-relaxed break-words text-gray-700">
              {personalInfo.summary}
            </p>
          </div>
        ) : null;

      case 'experience':
        return experiences.length > 0 ? (
          <div
            className="mb-5"
            key="experience"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Briefcase size={16} className="mr-2" />
              Work Exeperience
            </h3>
            {experiences.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="mb-1 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-gray-900">
                      {exp.position || 'Position'}
                    </h4>
                    <p className="truncate font-medium text-gray-700">
                      {exp.company || 'Company name'}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                    {formatDate(exp.startDate)} -{' '}
                    {exp.isCurrent || !exp.endDate ? 'present' : formatDate(exp.endDate)}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-xs leading-relaxed break-words text-gray-700">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case 'education':
        return education.length > 0 ? (
          <div
            className="mb-5"
            key="education"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <GraduationCap size={16} className="mr-2" />
              Education
            </h3>
            {education.map((edu) => (
              <div key={edu.id} className="mb-3">
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
              </div>
            ))}
          </div>
        ) : null;

      case 'certificates':
        return certificates.length > 0 ? (
          <div
            className="mb-5"
            key="certificates"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Award size={16} className="mr-2" />
              Certificates
            </h3>
            <div className="space-y-1">
              {certificates.map((cert) => (
                <p key={cert.id} className="text-sm text-gray-700">
                  {cert.name}
                  {cert.date ? ` (${formatDate(cert.date)})` : ''}
                </p>
              ))}
            </div>
          </div>
        ) : null;

      case 'skills':
        return skills.length > 0 ? (
          <div
            className="mb-5"
            key="skills"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
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
            className="mb-5"
            key="languages"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
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
            className="mb-5"
            key="hobbies"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
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
            className="mb-5"
            key="privacy"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
          >
            <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              Privacy Statement
            </h3>
            <p className="text-xs leading-relaxed break-words text-gray-700">
              {privacyStatement.content}
            </p>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="font-poppins flex h-screen flex-col overflow-hidden bg-gray-50 lg:flex-row lg:pt-6 dark:text-black">
      {/* Top Navigation for Mobile */}
      <div className="mb-4 flex items-center justify-center bg-white py-4 shadow-lg lg:hidden">
        <button
          onClick={() => (window.location.href = '/resume')}
          className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-100"
          title="Strona główna"
        >
          <Home size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="mx-3 hidden w-16 flex-col items-center justify-between rounded-lg bg-white py-6 shadow-lg lg:flex">
        <button
          onClick={() => (window.location.href = '/resume')}
          className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-100"
          title="Strona główna"
        >
          <Home size={24} className="text-gray-600" />
        </button>
        <button
                  onClick={handleSave}
                  className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-100"
                  title="Save resume"
                >
                  <Save size={16} className="text-black w-6 h-6" />
                </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gray-200/40">
          <span className="font-poppins">v1.0</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden px-3 lg:flex-row lg:px-0">
        {/* Left Panel - Form Inputs */}
        <div className="h-full overflow-y-auto rounded-lg bg-white shadow-lg lg:w-1/2">
          <div className="max-h-full overflow-y-auto p-4 lg:p-6">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h1 className="text-xl font-bold text-gray-800 lg:text-2xl">Resume creator</h1>
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Date format:</label>
                <Select
                  value={showFullDates ? 'full' : 'year'}
                  onValueChange={(value) => setShowFullDates(value === 'full')}
                >
                  <SelectTrigger className="font-poppins h-10! w-40 rounded-sm border border-gray-300 px-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Month & year</SelectItem>
                    <SelectItem value="year">Just year</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={loadFromProfile}
                  className="flex cursor-pointer items-center space-x-2 rounded border border-red-500 bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
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
                  <label className="mb-1 block text-sm text-gray-600">E-mail addres</label>
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
                    placeholder="e.g., Project Manager"
                    value={personalInfo.profession}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, profession: e.target.value })
                    }
                    className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Collapsible Additional Fields */}
                <details className="group">
                  <summary className="cursor-pointer font-medium text-red-600">
                    Show additional fields
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">Phone number</label>
                        <input
                          type="tel"
                          placeholder="e.g., +48 22 263 98 31"
                          value={personalInfo.phone}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, phone: e.target.value })
                          }
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">Adress</label>
                        <input
                          type="text"
                          placeholder="e.g., 221B Baker Street, London"
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
                          placeholder="e.g., Poland"
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
        <div className="flex flex-col overflow-hidden rounded-lg bg-gray-100 lg:w-1/2">
          {/* Preview Controls */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-700">Resume Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadPDF}
                className="flex cursor-pointer items-center space-x-2 rounded border border-red-500 bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
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
            <div
              className={`absolute inset-0 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                transform: `translate(${cvPosition.x}px, ${cvPosition.y}px)`,
              }}
              onMouseDown={handleMouseDown}
            >
              {/* A4 Paper with exact dimensions */}
              <div
                className="cv-content rounded-sm"
                style={{
                  width: '210mm',
                  height: '297mm',
                  transform: `scale(${cvScale})`,
                  transformOrigin: 'center center',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff', // Force HEX
                  color: '#000000', // Force HEX
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // Use RGBA for shadow
                }}
              >
                <div
                  className="p-8"
                  style={{
                    height: `calc(100% * ${totalPages})`,
                    transform: `translateY(-${
                      (currentPage - 1) * (100 / totalPages)
                    }%)`,
                  }}
                >
                  <div className="mb-6">
                    <h1 className="mb-2 text-3xl leading-tight font-bold text-gray-900">
                      {personalInfo.firstName || personalInfo.lastName
                        ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
                        : 'Joe Doe'}
                    </h1>
                    {personalInfo.profession && (
                      <h2 className="mb-4 text-xl text-gray-600">{personalInfo.profession}</h2>
                    )}

                    {/* Contact Information */}
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

                  {sectionOrder.map((sectionId) => renderSectionInPreview(sectionId))}

                  {/* Empty state message */}
                  {!personalInfo.firstName &&
                    !personalInfo.lastName &&
                    !personalInfo.email &&
                    experiences.length === 0 &&
                    skills.length === 0 &&
                    education.length === 0 &&
                    currentPage === 1 && (
                      <div className="mt-20 text-center text-gray-500">
                        <p className="text-lg">
                          Start filling the form on the left to create your CV.
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Pagination Controls - dodaj na dole kontenera */}
            {totalPages > 1 && (
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`h-8 w-8 cursor-pointer rounded text-sm font-medium ${
                        currentPage === page
                          ? 'bg-red-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`rounded p-2 ${
                    currentPage === totalPages
                      ? 'cursor-not-allowed text-gray-400'
                      : 'cursor-pointer text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>

                <span className="ml-2 text-sm text-gray-600">
                  {currentPage} / {totalPages}
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