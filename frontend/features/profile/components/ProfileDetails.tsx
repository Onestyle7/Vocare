'use client';

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, LogOut, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { spinner_terminal } from '@/features/marketing/constants/index';
import { PersonalityType, personalityTypeLabels } from '@/lib/types/personalityTypes';
import { Risk, riskLabels } from '@/lib/types/risk';

import { formatDate } from '../../../components/SupportComponents/formatSimpleDate';
import Section from '../../../components/SupportComponents/Section';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import { useProfileActions } from '../hooks/useProfileActions';
import ProfileCard from './ProfileCard';
import ProfileForm from './ProfileForm';
import { useProfileContext } from './ProfileProvider';
import UploadCvButton from './UploadCvButton';

const getPersonalityLabel = (value: PersonalityType | string | undefined): string => {
  if (value === undefined || value === null || value === '') {
    return personalityTypeLabels[PersonalityType.Unknown.toString()];
  }
  const numeric =
    typeof value === 'string'
      ? isNaN(Number(value))
        ? (PersonalityType[value as keyof typeof PersonalityType] ?? PersonalityType.Unknown)
        : Number(value)
      : value;
  return (
    personalityTypeLabels[numeric.toString()] ??
    personalityTypeLabels[PersonalityType.Unknown.toString()]
  );
};

const getRiskLabel = (value: Risk | string | undefined): string => {
  if (value === undefined || value === null || value === '') {
    return riskLabels[Risk.Unknown];
  }
  const numeric =
    typeof value === 'string'
      ? isNaN(Number(value))
        ? (Risk[value as keyof typeof Risk] ?? Risk.Unknown)
        : Number(value)
      : value;
  return riskLabels[numeric as Risk] ?? riskLabels[Risk.Unknown];
};

export default function ProfileDetails() {
  const { profile, isProfileEmpty } = useProfileContext();
  const { handleLogout, isPending } = useProfileActions();

  const [currentPage, setCurrentPage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(false);

  // ✅ show button when NOT at bottom, hide with ease when at bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      setAtBottom(isBottom);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });

    return () => el.removeEventListener('scroll', update);
  }, [isEditing, currentPage]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = 4;

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => setIsEditing(false);

  if (isEditing) {
    return (
      <ProfileForm
        initialData={profile ?? undefined}
        onCancel={handleCancelEdit}
        setIsEditing={setIsEditing}
      />
    );
  }

  const renderPersonalInfoPage = () => (
    <div className="relative space-y-8">
      <div className="mt-4 space-y-4">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Profil osobisty</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Kraj:</span>
            <span className="ml-2">{profile?.country || '—'}</span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Adres:</span>
            <span className="ml-2">{profile?.address || '—'}</span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Telefon:</span>
            <span className="ml-2">{profile?.phoneNumber || '—'}</span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Typ osobowości:</span>
            <span className="ml-2">{getPersonalityLabel(profile?.personalityType)}</span>
          </div>
          <Separator />
          <div className="flex flex-col space-y-2">
            <span className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
              Wykształcenie <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
            </span>

            {profile?.education?.length ? (
              profile.education?.map((edu, index) => (
                <div key={index} className="space-y-4 rounded-lg p-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-200">
                      Instytucja:
                    </span>
                    <span className="ml-2 text-right">{edu.institution}</span>
                  </div>
                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-200">Stopień:</span>
                    <span className="ml-2 text-right">{edu.degree}</span>
                  </div>
                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-200">Kierunek:</span>
                    <span className="ml-2 text-right">{edu.field}</span>
                  </div>
                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-200">
                      Czas trwania:
                    </span>
                    <span className="ml-2 w-fit rounded-md border px-2 py-0.5 text-right">
                      {formatDate(edu.startDate)} –{' '}
                      {edu.endDate ? formatDate(edu.endDate) : 'Obecnie'}
                    </span>
                  </div>
                  {profile.education && index !== profile.education.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">Brak danych o wykształceniu</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Języki</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.languages?.length ? (
            profile.languages.map((lang, index) => (
              <span
                key={index}
                className="rounded-lg bg-[#efe7ff] px-3 py-1 text-sm text-[#915EFF] dark:bg-gray-900/50"
              >
                {lang.language} {lang.level && `(${lang.level})`}
              </span>
            ))
          ) : (
            <p className="text-gray-500 italic">Brak danych o językach</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Certyfikaty</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.certificates?.length ? (
            profile.certificates.map((cert, index) => (
              <span
                key={index}
                className="rounded-full bg-[#efe7ff] px-3 py-1 text-sm text-[#915EFF] dark:bg-gray-900/50"
              >
                {cert.name}
              </span>
            ))
          ) : (
            <p className="text-gray-500 italic">Brak certyfikatów</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSkillsAndWorkPage = () => (
    <div className="space-y-8">
      <div className="mt-4 space-y-2">
        <h2 className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          Umiejętności
          <div className="ml-2 h-2 w-2 rounded-lg bg-[#915EFF]" />
        </h2>
        <div className="flex flex-wrap gap-2">
          {profile?.skills?.length ? (
            profile.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded-lg bg-[#efe7ff] px-3 py-1 text-sm text-[#915EFF] dark:bg-gray-900/50"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-gray-500 italic">Brak umiejętności</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          Umiejętności miękkie
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </h2>
        <div className="flex flex-wrap gap-2">
          {profile?.softSkills?.length ? (
            profile.softSkills.map((skill, index) => (
              <span
                key={index}
                className="rounded-lg bg-[#efe7ff] px-3 py-1 text-sm text-[#915EFF] dark:bg-gray-900/50"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-gray-500 italic">Brak umiejętności miękkich</p>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <span className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          Doświadczenie zawodowe
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </span>

        {profile?.workExperience?.length ? (
          profile.workExperience?.map((exp, index) => (
            <div key={index} className="space-y-4 rounded-lg p-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-200">Stanowisko:</span>
                <span className="ml-2 text-right text-[#915EFF]">{exp.position}</span>
              </div>
              <Separator />

              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-200">Firma:</span>
                <span className="ml-2 text-right">{exp.company}</span>
              </div>
              <Separator />

              <div className="flex items-start justify-between gap-4">
                <span className="font-medium text-gray-600 dark:text-gray-200">Opis:</span>
                <span className="ml-2 max-w-md text-left text-sm">{exp.description || '—'}</span>
              </div>
              <Separator />

              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-200">Czas trwania:</span>
                <span className="ml-2 w-fit rounded-md border px-2 py-0.5 text-right">
                  {formatDate(exp.startDate)} – {exp.endDate ? formatDate(exp.endDate) : 'Obecnie'}
                </span>
              </div>
              {profile.workExperience && index !== profile.workExperience.length - 1 && (
                <Separator className="mt-4 mb-10" />
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">Brak doświadczenia zawodowego</p>
        )}
      </div>
    </div>
  );

  const renderAboutMePage = () => (
    <div className="space-y-8">
      <div className="mt-4 space-y-2">
        <h2 className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          O mnie
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </h2>
        <div className="rounded-lg bg-gray-50/60 p-4 dark:bg-black/20">
          <p>{profile?.aboutMe || 'Brak opisu.'}</p>
        </div>
        <h2 className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          Dodatkowe informacje
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </h2>
        <div className="rounded-lg bg-gray-50/60 p-4 dark:bg-black/20">
          <p>{profile?.additionalInformation || 'Brak dodatkowych informacji.'}</p>
        </div>
      </div>
    </div>
  );

  const renderFinancialSurveyPage = () => (
    <div className="space-y-8">
      <div className="mt-4 space-y-2">
        <h2 className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          Ankieta finansowa
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">
              Aktualne wynagrodzenie:
            </span>
            <span className="ml-2">{profile?.financialSurvey?.currentSalary ?? '—'}</span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">
              Oczekiwane wynagrodzenie:
            </span>
            <span className="ml-2">{profile?.financialSurvey?.desiredSalary ?? '—'}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">
              Zobowiązania finansowe (kredyt):
            </span>
            <span className="ml-2 rounded-lg border px-4 py-2 text-gray-600 dark:text-gray-200">
              {profile?.financialSurvey?.hasLoans ? 'Tak' : 'Nie'}
            </span>
          </div>
          {profile?.financialSurvey?.hasLoans && (
            <>
              <Separator />
              <div className="flex justify-between rounded-lg">
                <span className="font-medium text-gray-600 dark:text-gray-200">
                  Szczegóły kredytu:
                </span>
                <span className="ml-2">{profile?.financialSurvey?.loanDetails || '—'}</span>
              </div>
            </>
          )}
          <Separator />
          <div className="flex items-center justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">
              Gotowość do relokacji:
            </span>
            <span className="ml-2 rounded-lg border px-4 py-2 text-gray-600 dark:text-gray-200">
              {profile?.financialSurvey?.willingToRelocate ? 'Tak' : 'Nie'}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">
              Gotowość do zmiany rodzaju zawodu:
            </span>
            <span className="ml-2 rounded-lg border px-4 py-2 text-gray-600 dark:text-gray-200">
              {profile?.willingToRebrand ? 'Tak' : 'Nie'}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">
              Skłonność do ryzyka:
            </span>
            <span className="ml-2">{getRiskLabel(profile?.financialSurvey?.riskAppetite)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const pages = [
    renderPersonalInfoPage,
    renderSkillsAndWorkPage,
    renderAboutMePage,
    renderFinancialSurveyPage,
  ];

  return (
    <Section
      className="relative -mt-[5.25rem] pt-[3.5rem]"
      crosses
      crossesOffset="lg:translate-y-[7.5rem]"
      customPaddings
      id="profile"
    >
      <div className="font-grotesk mt-10 lg:px-4 xl:mx-10 xl:mt-16 xl:border-t">
        <div className="font-grotesk mt-8 max-w-5xl max-md:px-4 xl:mx-auto 2xl:max-w-[1600px]">
          <div className="mt-2 flex h-screen flex-col xl:flex-row">
            <div className="hidden w-2/5 xl:block xl:pr-8 2xl:w-1/2">
              <div className="-mt-8 flex h-3/4 items-center justify-center">
                <ProfileCard />
              </div>
            </div>

            <div className="bg-background dark:bg-background relative z-20 w-full rounded-xl border p-4 xl:h-3/4 xl:w-3/5 2xl:w-1/2">
              <div className="flex h-full flex-col">
                <div className="flex min-w-0 flex-col gap-4 border-b pb-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h1 className="min-w-0 text-2xl font-bold break-words text-gray-800 xl:text-3xl dark:text-gray-200">
                      {isProfileEmpty ? 'Mój Profil' : `${profile?.firstName} ${profile?.lastName}`}
                    </h1>
                    <div className="flex items-center gap-2 sm:hidden">
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-10 w-10 justify-center rounded-[7px] p-0"
                        aria-label="Subskrypcja"
                      >
                        <Link href="/dashboard/profile/payments">
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        onClick={handleLogout}
                        disabled={isPending}
                        variant="outline"
                        size="lg"
                        className="h-10 w-10 justify-center rounded-[7px] p-0"
                        aria-label="Wyloguj"
                      >
                        {isPending ? (
                          <Image
                            src={spinner_terminal}
                            alt="loader"
                            width={16}
                            height={16}
                            className="animate-spin"
                          />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex w-full min-w-0 flex-col gap-3 2xl:w-auto 2xl:flex-row 2xl:items-center 2xl:justify-end 2xl:gap-2">
                    <div className="flex w-full min-w-0 flex-wrap justify-start gap-2 2xl:w-auto 2xl:flex-nowrap">
                      <UploadCvButton className="order-1 max-w-full sm:order-1" />
                      <Button
                        onClick={handleEdit}
                        size="lg"
                        className="order-2 shrink-0 justify-center rounded-lg bg-[#915EFF] text-white shadow-[0_12px_30px_rgba(145,94,255,0.35)] transition-shadow hover:bg-[#a779ff] hover:shadow-[0_16px_38px_rgba(145,94,255,0.4)] max-sm:w-full sm:order-2 sm:px-6"
                      >
                        Edytuj
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="order-3 hidden h-10 w-10 shrink-0 justify-center rounded-full p-0 sm:order-3 sm:inline-flex sm:w-10 sm:rounded-[7px]"
                        aria-label="Subskrypcja"
                      >
                        <Link href="/dashboard/profile/payments">
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        onClick={handleLogout}
                        disabled={isPending}
                        variant="outline"
                        size="lg"
                        className="order-4 hidden h-10 w-10 shrink-0 justify-center rounded-full p-0 sm:order-4 sm:inline-flex sm:w-10 sm:rounded-[7px]"
                        aria-label="Wyloguj"
                      >
                        {isPending ? (
                          <Image
                            src={spinner_terminal}
                            alt="loader"
                            width={16}
                            height={16}
                            className="animate-spin"
                          />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ✅ scroll container + floating down button */}
                <div ref={scrollRef} className="relative flex-grow overflow-y-auto">
                  {pages[currentPage]()}
                </div>

                <div className="relative mt-6 flex items-center justify-between border-t pt-4">
                  {/* LEFT */}
                  <button onClick={goToPreviousPage} disabled={currentPage === 0}>
                    <ArrowLeft />
                  </button>

                  {/* CENTER – scroll down */}
                  <button
                    type="button"
                    onClick={atBottom ? scrollToTop : scrollToBottom}
                    aria-label={atBottom ? 'Scroll to top' : 'Scroll to bottom'}
                    className={[
                      'absolute left-1/2 -translate-x-1/2',
                      'bg-background/80 h-10 w-10 rounded-full border backdrop-blur',
                      'flex items-center justify-center',
                      'transition-all duration-300',
                      'hover:scale-105',
                    ].join(' ')}
                  >
                    {atBottom ? (
                      <ArrowUp className="h-5 w-5 cursor-pointer" />
                    ) : (
                      <ArrowDown className="h-5 w-5 cursor-pointer" />
                    )}
                  </button>

                  {/* RIGHT */}
                  <button onClick={goToNextPage} disabled={currentPage === totalPages - 1}>
                    <ArrowRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
