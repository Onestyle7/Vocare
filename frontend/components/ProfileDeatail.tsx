'use client';

import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/profile';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types/profile';
import { toast } from 'sonner';
import ProfileCard from './ProfileFormComponents/ProfileCard';
import { ArrowLeft, ArrowRight, LogOut } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import ProfileForm from './ProfileFormComponents/ProfileForm';
import { logoutUser } from '@/lib/auth';

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
          description: 'Filling the Profile Form will allow You to use the full power of Vocare.',
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

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading profile...</div>;
  }

  if (!profile) {
    return <ProfileForm />;
  }

  if (isEditing) {
    return <ProfileForm initialData={profile} onCancel={handleCancelEdit} />;
  }

  const renderPersonalInfoPage = () => (
    <div className="space-y-8">
      <div className="mt-4 space-y-4">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Personal Information</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Country:</span>
            <span className="ml-2">{profile.country}</span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Address:</span>
            <span className="ml-2">{profile.address}</span>
          </div>
          <Separator />
          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Phone:</span>
            <span className="ml-2">{profile.phoneNumber}</span>
          </div>
          <Separator />
          <div className="flex flex-col space-y-2">
            <span className="font-medium text-gray-600 dark:text-gray-200">Education:</span>
            {profile.education?.map((edu, index) => (
              <div key={index} className="text-sm">
                {edu.institution} ({edu.degree}, {edu.field}) {edu.startDate} - {edu.endDate || 'Present'}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Languages</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.languages?.map((lang, index) => (
            <span key={index} className="rounded-full bg-[#efe7ff] px-3 py-1 text-sm text-[#915EFF] dark:bg-gray-900/50">
              {lang.language} {lang.level && `(${lang.level})`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSkillsAndWorkPage = () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((skill, index) => (
            <span key={index} className="rounded-full bg-[#efe7ff] px-3 py-1 text-sm text-[#915EFF] dark:bg-gray-900/50">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Work Experience</h2>
        <ul className="space-y-2">
          {profile.workExperience?.map((exp, index) => (
            <li key={index}>
              <strong>{exp.position}</strong> at {exp.company} ({exp.startDate} - {exp.endDate || 'Present'})
              <div className="text-sm">{exp.description}</div>
              {exp.responsibilities?.length > 0 && (
                <ul className="ml-4 list-disc">
                  {exp.responsibilities.map((resp, idx) => (
                    <li key={idx} className="text-sm">{resp}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Certificates</h2>
        <ul className="space-y-2">
          {profile.certificates?.map((cert, index) => (
            <li key={index}>
              {cert.name} {cert.issuer && `(Issued by: ${cert.issuer})`} {cert.date && `on ${cert.date}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderAboutMePage = () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">About Me</h2>
        <div className="rounded-lg bg-gray-50/60 p-4 dark:bg-black/20">
          <p>{profile.aboutMe}</p>
        </div>
      </div>

      {profile.additionalInformation && (
        <div className="space-y-2">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Additional Information</h2>
          <div className="rounded-lg bg-gray-50/60 p-4 dark:bg-black/20">
            <p>{profile.additionalInformation}</p>
          </div>
        </div>
      )}
    </div>
  );

  const pages = [renderPersonalInfoPage, renderSkillsAndWorkPage, renderAboutMePage];

  return (
    <div className="font-poppins mx-auto mt-16 max-w-7xl max-sm:mx-4 2xl:max-w-[1480px]">
      <div className="flex h-screen flex-col xl:flex-row">
        <div className="hidden xl:block xl:w-1/2 xl:pr-8">
          <div className="flex h-3/4 items-center justify-center">
            <ProfileCard />
          </div>
        </div>

        <div className="w-full rounded-xl border p-4 xl:h-3/4 xl:w-1/2">
          <div className="flex h-full flex-col">
            <div className="flex flex-row items-start justify-between border-b">
              <h1 className="mb-4 text-2xl font-bold text-gray-800 xl:text-3xl dark:text-gray-200">
                {profile.firstName} {profile.lastName}
              </h1>
              <div className="flex gap-2">
                <Button onClick={handleEdit} className="rounded-full bg-[#915EFF] hover:bg-[#b594fd]">
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
