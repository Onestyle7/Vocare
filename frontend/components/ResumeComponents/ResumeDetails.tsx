'use client';

import { useState, useEffect, useRef } from 'react';
import { GridBackgroundDemo } from '../MarketComponents/GridBackgroundDemo';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

// Types based on the provided JSON format
interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string | null;
  endDate: string | null;
}

interface WorkExperience {
  company: string;
  position: string;
  description: string;
  responsibilities: string[];
  startDate: string | null;
  endDate: string | null;
}

interface Certificate {
  name: string;
  date: string | null;
  issuer: string;
}

interface Language {
  language: string;
  level: string;
}

interface CvData {
  firstName: string;
  lastName: string;
  country: string;
  address: string;
  phoneNumber: string;
  education: Education[];
  workExperience: WorkExperience[];
  skills: string[];
  certificates: Certificate[];
  languages: Language[];
  additionalInformation: string;
  aboutMe: string;
  personalityType: string;
}

// Mock data based on the provided JSON
const mockData: CvData = {
  firstName: 'Kacper',
  lastName: 'Jóźwik',
  country: 'Poland',
  address: 'Szewska 12, Kraków',
  phoneNumber: '423552412',
  education: [
    {
      institution: 'Polsko-Japońska Akademia Technik Komputerowych',
      degree: 'Bachelor',
      field: 'Informatyka',
      startDate: '8.10.2021 02:00:00',
      endDate: '8.06.2023 02:00:00',
    },
    {
      institution: 'Uniwersytet Jagielloński',
      degree: 'Master',
      field: 'Zarządzanie projektami IT',
      startDate: '29.04.2025 02:00:00',
      endDate: null,
    },
  ],
  workExperience: [
    {
      company: 'Allegro',
      position: 'QA Automation Engineer',
      description:
        'Tworzenie i utrzymanie testów automatycznych w Cypress i Playwright\nIntegracja testów z CI/CD w GitHub Actions\nWspółpraca z zespołem developerskim w metodyce Agile\nAutomatyzacja scenariuszy e2e dla aplikacji e-commerce',
      responsibilities: [],
      startDate: '8.06.2019 02:00:00',
      endDate: '8.06.2021 02:00:00',
    },
    {
      company: 'CD PROJEKT RED',
      position: 'QA Specialist (Manual)',
      description:
        'Testowanie nowych funkcji w grach AAA na PC i konsole\nWeryfikacja zgodności scenariuszy fabularnych i systemów RPG\nZgłaszanie błędów w Jira oraz regresje\nBliska współpraca z zespołem narrative, UX i dev',
      responsibilities: [],
      startDate: '20.08.2021 02:00:00',
      endDate: '8.02.2024 01:00:00',
    },
    {
      company: 'Brainly',
      position: 'QA Engineer',
      description:
        'Prowadzenie testów manualnych i automatycznych REST API oraz frontendów\nUdział w testowaniu aplikacji mobilnej (Android/iOS)\nTworzenie dokumentacji testowej i przypadków testowych\nTestowanie wydajnościowe przy użyciu JMeter',
      responsibilities: [],
      startDate: '8.01.2025 01:00:00',
      endDate: null,
    },
  ],
  skills: ['Pakiet office', 'obsługa komputera', 'organizowanie wyjazdów'],
  certificates: [
    {
      name: 'Certificate in Advanced English',
      date: null,
      issuer: 'Cambridge',
    },
  ],
  languages: [
    {
      language: 'English',
      level: 'Advanced',
    },
    {
      language: 'Polski',
      level: 'Native',
    },
    {
      language: 'Italian',
      level: 'Basic',
    },
  ],
  additionalInformation:
    'W trakcie studiów informatycznych, aktualnie uczę się automatyzacji (Playwright). W wolnym czasie testuję własne projekty i śledzę zmiany w branży.',
  aboutMe:
    "Uczę się każdego dnia, pracując jako manual QA w branży gier. Uwielbiam znajdować edge case'y, których nikt się nie spodziewa, i pomagać zespołowi poprawiać jakość. Dobrze odnajduję się w pracy zespołowej i szybko się uczę nowych narzędzi.",
  personalityType: 'Entrepreneur',
};

export default function MinimalistCVTemplate() {
  const [isLoaded, setIsLoaded] = useState(false);
  const cv = mockData;
  const cvRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    if (!cvRef.current) return;

    const canvas = await html2canvas(cvRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${cv.firstName}_${cv.lastName}_CV.pdf`);
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Present';
    try {
      const dateParts = dateString.split(' ')[0].split('.');
      const day = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch (error) {
      console.error('Error parsing date:', error);
      return dateString;
    }
  };

  const formatDescription = (description: string): string[] => {
    return description.split('\n').filter((line) => line.trim() !== '');
  };

  const getAnimationStyle = (delay: number = 0) => ({
    opacity: isLoaded ? 1 : 0,
    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDelay: `${delay}ms`,
  });

  return (
    <div className="xl:border-grey-100 relative xl:mx-10 xl:border">
      <div>
        <GridBackgroundDemo />
      </div>
      <div
        ref={cvRef}
        className="font-poppins relative mx-4 mb-4 min-h-screen max-w-5xl rounded-lg bg-white text-gray-900 shadow-md xl:mx-auto xl:mt-10 dark:bg-gray-900 dark:text-gray-100"
      >
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16 lg:py-20">
          {/* Header Section */}
          <header className="mb-16" style={getAnimationStyle()}>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="mb-2 text-4xl font-bold tracking-tight md:text-6xl">
                  {cv.firstName} {cv.lastName}
                </h1>
                <h2 className="text-xl text-gray-500 md:text-2xl dark:text-gray-300">
                  {cv.workExperience[0].position}
                </h2>
              </div>
              <div className="space-y-1 text-sm md:text-right">
                <p>{cv.address}</p>
                <p>{cv.country}</p>
                <p className="font-medium">{cv.phoneNumber}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6 md:mt-10 md:pt-8 dark:border-gray-700">
              <p className="max-w-3xl text-gray-700 dark:text-gray-300">{cv.aboutMe}</p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {/* Left Column */}
            <div className="md:col-span-2">
              {/* Work Experience */}
              <section className="mb-12" style={getAnimationStyle(200)}>
                <h2 className="mb-6 border-b border-gray-200 pb-2 text-2xl font-semibold dark:border-gray-700">
                  Work Experience
                </h2>

                <div className="space-y-10">
                  {cv.workExperience.map((work, index) => (
                    <div key={index} style={getAnimationStyle(300 + index * 150)}>
                      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                        <div>
                          <h3 className="text-xl font-medium">{work.position}</h3>
                          <p className="text-lg text-gray-600 dark:text-gray-300">{work.company}</p>
                        </div>
                        <div>
                          <span className="text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {formatDate(work.startDate)} — {formatDate(work.endDate)}
                          </span>
                        </div>
                      </div>
                      <ul className="list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
                        {formatDescription(work.description).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Education */}
              <section style={getAnimationStyle(600)}>
                <h2 className="mb-6 border-b border-gray-200 pb-2 text-2xl font-semibold dark:border-gray-700">
                  Education
                </h2>

                <div className="space-y-6">
                  {cv.education.map((edu, index) => (
                    <div key={index} style={getAnimationStyle(700 + index * 150)}>
                      <div className="mb-1 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                        <div>
                          <h3 className="text-xl font-medium">{edu.institution}</h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            {edu.degree} in {edu.field}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div>
              {/* Skills */}
              <section className="mb-10" style={getAnimationStyle(300)}>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold dark:border-gray-700">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cv.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              {/* Languages */}
              <section className="mb-10" style={getAnimationStyle(400)}>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold dark:border-gray-700">
                  Languages
                </h2>
                <div className="space-y-2">
                  {cv.languages.map((language, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{language.language}</span>
                      <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full bg-gray-800 dark:bg-gray-300"
                          style={{
                            width:
                              language.level === 'Native'
                                ? '100%'
                                : language.level === 'Advanced'
                                  ? '80%'
                                  : language.level === 'Intermediate'
                                    ? '60%'
                                    : language.level === 'Basic'
                                      ? '30%'
                                      : '10%',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Certificates */}
              <section className="mb-10" style={getAnimationStyle(500)}>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold dark:border-gray-700">
                  Certificates
                </h2>
                <div className="space-y-3">
                  {cv.certificates.map((cert, index) => (
                    <div key={index}>
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{cert.issuer}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Additional Information */}
              <section style={getAnimationStyle(600)}>
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold dark:border-gray-700">
                  Additional Information
                </h2>
                <div className="text-gray-700 dark:text-gray-300">
                  <p>{cv.additionalInformation}</p>
                </div>
              </section>

              {/* Personality Type */}
              <div
                className="mt-10 border-t border-gray-200 pt-6 dark:border-gray-700"
                style={getAnimationStyle(700)}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 dark:bg-gray-800">
                  <span className="h-3 w-3 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {cv.personalityType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={downloadPdf}
          className="absolute top-4 right-4 z-10 rounded bg-black px-4 py-2 text-white transition hover:bg-gray-800"
        >
          Download as PDF
        </button>
      </div>
    </div>
  );
}
