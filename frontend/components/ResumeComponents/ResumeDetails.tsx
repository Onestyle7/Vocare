'use client';

import { CvDto } from '@/lib/types/resume';
import { useEffect, useState } from 'react';

// This interface matches the backend CvDto structure
interface CvTemplateProps {
  cv: CvDto;
}

export default function ResumeDetails({ cv }: CvTemplateProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Format date from YYYY-MM-DD to display format
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    if (dateString === 'Present') return 'PRESENT';

    // Extract year and month from YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length >= 2) {
      // Convert to format like "2021 – PRESENT"
      return parts[0]; // Just return the year
    }
    return dateString;
  };

  // Format date ranges for display
  const formatDateRange = (startDate?: string, endDate?: string): string => {
    const start = formatDate(startDate);
    const end = endDate ? formatDate(endDate) : 'PRESENT';

    return `${start} – ${end}`;
  };

  // Combine first name and last name
  const fullName = cv?.basics ? `${cv.basics.firstName} ${cv.basics.lastName}` : '';

  // Create a description from summary
  const description = cv?.basics?.summary || '';

  // Create personal info array from CV data
  const personalInfo = [
    { label: 'PROFESSION', value: cv?.work?.[0]?.position || 'PROFESSIONAL' },
    {
      label: 'LOCATION',
      value: cv?.basics?.location
        ? `${cv.basics.location.city}, ${cv.basics.location.country}`
        : '',
    },
    { label: 'EDUCATION', value: cv?.education?.[0]?.degree || 'HIGHER EDUCATION' },
  ];

  return (
    <div className="font-poppins mt-[90%] min-h-screen rounded-xl bg-white font-sans text-black shadow-2xl max-sm:mt-[400%]">
      {/* Header */}
      <header
        className="px-6 pt-12 pb-6 transition-all duration-1000 ease-out md:px-12 lg:px-20"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-50px)',
        }}
      >
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold md:text-5xl">
            {cv?.work?.[0]?.position || 'PROFESSIONAL'}
          </h1>
          <h2 className="text-3xl font-bold md:text-5xl">
            PASSION AND <span className="italic underline">EXPERIENCE.</span>
          </h2>

          <div className="mt-4 flex justify-end space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
              <span className="text-sm text-white">IG</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black">
              <span className="text-sm text-black">f</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black">
              <span className="text-sm text-black">in</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="flex flex-col gap-8 md:flex-row md:gap-16">
          {/* Left Column - Profile */}
          <div
            className="w-full transition-all delay-200 duration-1000 ease-out md:w-1/3"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateX(0)' : 'translateX(-50px)',
            }}
          >
            <div className="mb-8">
              <div className="mb-6 h-48 w-48 overflow-hidden rounded-full bg-gray-300">
                <img
                  src="/api/placeholder/192/192"
                  alt="Profile placeholder"
                  className="h-full w-full object-cover"
                />
              </div>

              <h2 className="mb-1 text-2xl font-bold">{fullName}</h2>
              <p className="mb-4 text-sm">{description}</p>

              <div className="mb-8 space-y-4">
                {personalInfo.map((info, index) => (
                  <div key={index} className="flex flex-col border-b border-gray-300 pb-1">
                    <span className="text-xs font-semibold">{info.label}</span>
                    <span className="text-sm">{info.value}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4 border-b border-gray-300 pb-1">
                <span className="text-xs font-semibold">CONTACT</span>
                <p className="text-sm">{cv?.basics?.email || ''}</p>
                <p className="text-sm">{cv?.basics?.phoneNumber || ''}</p>
              </div>

              <button className="w-full cursor-pointer border border-black px-4 py-2 text-center transition duration-300 hover:bg-black hover:text-white">
                SEND MESSAGE
              </button>
            </div>
          </div>

          {/* Right Column - Experience, Education, Skills */}
          <div
            className="w-full transition-all delay-400 duration-1000 ease-out md:w-2/3"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateX(0)' : 'translateX(50px)',
            }}
          >
            {/* Experience Section */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold">EXPERIENCE</h2>
              <div className="mb-8 border-t-2 border-black"></div>

              {cv?.work?.map((exp, index) => (
                <div
                  key={index}
                  className="mb-8 transition-all duration-500 ease-out"
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${500 + index * 200}ms`,
                  }}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-lg font-semibold">{exp.company}</h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {formatDateRange(exp.startDate, exp.endDate)}
                      </p>
                      <p className="text-sm font-semibold">{exp.position}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{exp.description}</p>
                </div>
              ))}
            </section>

            {/* Education and Skills in two columns for larger screens */}
            <div className="flex flex-col gap-8">
              {/* Education Section */}
              <section className="mb-12 w-full">
                <h2 className="mb-4 text-2xl font-bold">EDUCATION</h2>
                <div className="mb-8 border-t-2 border-black"></div>

                {cv?.education?.map((edu, index) => (
                  <div
                    key={index}
                    className="mb-6 transition-all duration-500 ease-out"
                    style={{
                      opacity: isLoaded ? 1 : 0,
                      transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                      transitionDelay: `${900 + index * 200}ms`,
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-lg font-semibold">{edu.institution}</h3>
                      <div className="inline-block rounded-full border border-black px-3 py-1 text-xs">
                        {formatDateRange(edu.startDate, edu.endDate)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      {edu.degree} in {edu.field}
                    </p>
                  </div>
                ))}
              </section>

              {/* Certificates Section */}
              <section className="mb-12 w-full">
                <h2 className="mb-4 text-2xl font-bold">CERTIFICATES</h2>
                <div className="mb-8 border-t-2 border-black"></div>

                {cv?.certificates?.map((cert, index) => (
                  <div
                    key={index}
                    className="mb-6 transition-all duration-500 ease-out"
                    style={{
                      opacity: isLoaded ? 1 : 0,
                      transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                      transitionDelay: `${1500 + index * 200}ms`,
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-lg font-semibold">{cert.name}</h3>
                      {cert.date && (
                        <div className="inline-block rounded-full border border-black px-3 py-1 text-xs">
                          {formatDate(cert.date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </div>

            {/* Skills Section */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">SKILLS</h2>
              <div className="mb-8 border-t-2 border-black"></div>
              <div
                className="grid grid-cols-2 gap-4 transition-all duration-500 ease-out md:grid-cols-3"
                style={{
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: '1900ms',
                }}
              >
                {cv?.skills?.map((skill, index) => (
                  <div
                    key={index}
                    className="rounded border border-gray-300 px-3 py-2 text-center text-sm"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </section>

            {/* Languages Section */}
            {cv?.languages && cv.languages.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-4 text-2xl font-bold">LANGUAGES</h2>
                <div className="mb-8 border-t-2 border-black"></div>
                <div
                  className="grid grid-cols-1 gap-4 transition-all duration-500 ease-out md:grid-cols-2"
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: '2100ms',
                  }}
                >
                  {cv.languages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-gray-200 pb-2"
                    >
                      <span className="font-medium">{lang.language}</span>
                      <span className="text-sm text-gray-600">{lang.fluency}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
