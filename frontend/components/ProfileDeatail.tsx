'use client';
import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/profile';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/app/types/profile';
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
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  function handleEdit() {
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading profile...</div>;
  }

  if (!profile) {
    return <ProfileForm />;
  }

  if (isEditing) {
    return <ProfileForm initialData={profile} onCancel={handleCancelEdit} />;
  }

  // Page content components
  const renderPersonalInfoPage = () => (
    <div className="space-y-8">
      {/* Personal Information */}
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

          <div className="flex justify-between rounded-lg">
            <span className="font-medium text-gray-600 dark:text-gray-200">Education:</span>
            <span className="ml-2">{profile.education}</span>
          </div>
        </div>
        <Separator />
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Languages</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="rounded-lg py-4">
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((lang, index) => (
              <span
                key={index}
                className="rounded-full bg-[#efe7ff] dark:bg-gray-900/50 px-3 py-1 text-sm text-[#915EFF]"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkillsAndWorkPage = () => (
    <div className="space-y-8">
      {/* Skills */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Skills</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="rounded-lg">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-[#efe7ff] dark:bg-gray-900/50  px-3 py-1 text-sm text-[#915EFF]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Work Experience */}
      <div className="space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Work Experience</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="rounded-lg p-4">
          <ul className="space-y-2">
            {profile.workExperience.map((exp, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Certificates */}
      <div className="space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Certificates</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="rounded-lg p-4">
          <ul className="space-y-2">
            {profile.certificates.map((cert, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-green-500">•</span>
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderAboutMePage = () => (
    <div className="space-y-8">
      {/* About Me */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">About Me</h2>
          <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
        </div>
        <div className="rounded-lg bg-gray-50/60 p-4 dark:bg-black/20">
          <p>{profile.aboutMe}</p>
        </div>
      </div>

      {/* Additional Information */}
      {profile.additionalInformation && (
        <div className="space-y-2">
          <div className="flex flex-row items-center">
            <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">
              Additional Information
            </h2>
            <div className="ml-2 h-2 w-2 rounded-full bg-[#915EFF]" />
          </div>
          <div className="rounded-lg bg-gray-50/60 p-4 dark:bg-black/20">
            <p>{profile.additionalInformation}</p>
          </div>
        </div>
      )}
    </div>
  );

  const pages = [renderPersonalInfoPage, renderSkillsAndWorkPage, renderAboutMePage];

  const pageIndicators = ['Personal Info', 'Skills & Experience', 'About Me'];

  return (
    <div className="font-poppins mx-4 mt-16 max-w-7xl xl:mx-auto">
      <div className="flex h-screen flex-col xl:flex-row">
        <div className="hidden xl:block xl:w-1/2 xl:pr-8">
          <div className="flex h-3/4 items-center justify-center">
            <ProfileCard />
          </div>
        </div>

        {/* Right side - Profile Details */}
        <div className="w-full rounded-xl border p-4 xl:h-3/4 xl:w-1/2">
          <div className="flex h-full flex-col">
            <div className="flex flex-row items-start justify-between border-b">
              <h1 className="mb-4 xl:text-3xl text-2xl font-bold text-gray-800 dark:text-gray-200">
                {profile.firstName} {profile.lastName}
              </h1>
              <div className='flex flex-row gap-2'>
                <Button
                  className="flex flex-row items-center justify-center rounded-full bg-[#915EFF] group hover:bg-[#b594fd]"
                  onClick={handleEdit}
                >
                  Edit
                  <span>
                    <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" />
                  </span>
                </Button>
                <Button
                  className="flex flex-row items-center justify-center rounded-full bg-transparent hover:bg-transparent border border-[#915EFF]"
                  onClick={handleLogout}
                >
                  <span>
                    <LogOut className="text-black dark:text-white" />
                  </span>
                </Button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-grow overflow-y-auto">{pages[currentPage]()}</div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className={`flex items-center ${currentPage === 0 ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer text-black hover:text-black/40 dark:text-white'}`}
              >
                <ArrowLeft />
              </button>

              <div className="flex space-x-2">
                {pageIndicators.map((label, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 rounded-full ${currentPage === index ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-700'}`}
                    title={label}
                  />
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === 2}
                className={`flex items-center ${currentPage === 2 ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer text-black hover:text-black/40 dark:text-white'}`}
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
