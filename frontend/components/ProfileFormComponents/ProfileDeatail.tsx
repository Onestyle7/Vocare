'use client';

import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/profile';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types/profile';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, LogOut } from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import { formatDate } from '../SupportComponents/formatSimpleDate';
import ProfileForm from './ProfileForm';
import { Separator } from '../ui/separator';
import ProfileCard from './ProfileCard';
import { Button } from '../ui/button';

export default function ProfileDetails() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    router.push('/sign-in');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/sign-in');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getUserProfile(token);
        setProfile(data);
      } catch (error) {
        console.error(error);
        toast.error('Provide additional information', {
          description: 'Filling the Profile Form will allow you to use the full power of Vocare.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const goToNextPage = () => {
    if (currentPage < 2) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => setIsEditing(false);

  const isProfileEmpty = !profile;

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading profile...</div>;
  }

  if (isEditing) {
    return <ProfileForm initialData={profile ?? undefined} onCancel={handleCancelEdit} />;
  }

  const renderPersonalInfoPage = () => (
    <div className="relative space-y-8">
      <div className="mt-4 space-y-4">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">
            Personal Information
          </h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Country:</span>
            <span className="ml-2">{profile?.country || '—'}</span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Address:</span>
            <span className="ml-2">{profile?.address || '—'}</span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Phone:</span>
            <span className="ml-2">{profile?.phoneNumber || '—'}</span>
          </div>
          <Separator />
          <div className="flex flex-col space-y-2">
            <span className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
              Education <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
            </span>

            {profile?.education?.length ? (
              profile.education?.map((edu, index) => (
                <div key={index} className="space-y-4 rounded-lg p-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-200">
                      Institution:
                    </span>
                    <span className="ml-2 text-right">{edu.institution}</span>
                  </div>
                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-200">Degree:</span>
                    <span className="ml-2 text-right">{edu.degree}</span>
                  </div>
                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-200">Field:</span>
                    <span className="ml-2 text-right">{edu.field}</span>
                  </div>
                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-200">Duration:</span>
                    <span className="ml-2 w-fit rounded-md border px-2 py-0.5 text-right">
                      {formatDate(edu.startDate)} –{' '}
                      {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                    </span>
                  </div>
                  {profile.education && index !== profile.education.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No education data</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Languages</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.languages?.length ? (
            profile.languages.map((lang, index) => (
              <span
                key={index}
                className="rounded-full bg-[#efe7ff] px-3 py-1 text-sm text-[#915EFF] dark:bg-gray-900/50"
              >
                {lang.language} {lang.level && `(${lang.level})`}
              </span>
            ))
          ) : (
            <p className="text-gray-500 italic">No languages</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Certificates</h2>
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
            <p className="text-gray-500 italic">No certificates</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSkillsAndWorkPage = () => (
    <div className="space-y-8">
      <div className="mt-4 space-y-2">
        <h2 className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          Skills
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </h2>
        <div className="flex flex-wrap gap-2">
          {profile?.skills?.length ? (
            profile.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-[#efe7ff] px-3 py-1 text-sm text-[#915EFF] dark:bg-gray-900/50"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-gray-500 italic">No skills</p>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <span className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          Work Experience <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </span>

        {profile?.workExperience?.length ? (
          profile.workExperience?.map((exp, index) => (
            <div key={index} className="space-y-4 rounded-lg p-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-200">Position:</span>
                <span className="ml-2 text-right text-[#915EFF]">{exp.position}</span>
              </div>
              <Separator />

              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-200">Company:</span>
                <span className="ml-2 text-right">{exp.company}</span>
              </div>
              <Separator />

              <div className="flex items-start justify-between gap-4">
                <span className="font-medium text-gray-600 dark:text-gray-200">Description:</span>
                <span className="ml-2 max-w-md text-right text-sm">{exp.description || '—'}</span>
              </div>
              <Separator />

              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-200">Duration:</span>
                <span className="ml-2 w-fit rounded-md border px-2 py-0.5 text-right">
                  {formatDate(exp.startDate)} – {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                </span>
              </div>
              {profile.workExperience && index !== profile.workExperience.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No work experience</p>
        )}
      </div>
    </div>
  );

  const renderAboutMePage = () => (
    <div className="space-y-8">
      <div className="mt-4 space-y-2">
        <h2 className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          About Me
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </h2>
        <div className="rounded-lg bg-gray-50/60 p-4 dark:bg-black/20">
          <p>{profile?.aboutMe || 'No description yet.'}</p>
        </div>
        <h2 className="flex items-center text-2xl font-medium text-gray-700 dark:text-gray-200">
          Addidtional Informations
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </h2>
        <div className="rounded-lg bg-gray-50/60 p-4 dark:bg-black/20">
          <p>{profile?.additionalInformation || 'No additional informations yet.'}</p>
        </div>
      </div>
    </div>
  );

  const pages = [renderPersonalInfoPage, renderSkillsAndWorkPage, renderAboutMePage];

  return (
    <div className="font-poppins mx-4 mt-16 max-w-7xl max-sm:mx-4 xl:mx-auto 2xl:max-w-[1480px]">
      <div className="flex h-screen flex-col xl:flex-row">
        <div className="hidden xl:block xl:w-1/2 xl:pr-8">
          <div className="flex h-3/4 items-center justify-center">
            <ProfileCard />
          </div>
        </div>

        <div className="bg-background relative z-10 w-full rounded-xl border p-4 xl:h-3/4 xl:w-1/2 dark:bg-[#0e100f]">
          <div className="flex h-full flex-col">
            <div className="flex flex-row items-start justify-between border-b">
              <h1 className="mb-4 text-2xl font-bold text-gray-800 xl:text-3xl dark:text-gray-200">
                {isProfileEmpty ? 'Your Profile' : `${profile.firstName} ${profile.lastName}`}
              </h1>
              <div className="flex gap-2">
                <Button
                  onClick={handleEdit}
                  className="rounded-full bg-[#915EFF] hover:bg-[#b594fd]"
                >
                  Edit
                </Button>
                <Button onClick={handleLogout} variant="outline" className="rounded-full">
                  <LogOut />
                </Button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto">{pages[currentPage]()}</div>

            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <button onClick={goToPreviousPage} disabled={currentPage === 0}>
                <ArrowLeft />
              </button>
              <button onClick={goToNextPage} disabled={currentPage === 2}>
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
