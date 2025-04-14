'use client';
import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/profile';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/app/types/profile';
import { toast } from 'sonner';
import ProfileCard from './ProfileFormComponents/ProfileCard';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import ProfileForm from './ProfileFormComponents/ProfileForm';

export default function ProfileDetails() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

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
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
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
      <div className="space-y-4 mt-4">
        <div className='flex flex-row items-center'>
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Personal Information
          </h2>
          <div className='rounded-full w-2 h-2 bg-[#915EFF] ml-2'/>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-lg flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-200">Country:</span>
            <span className="ml-2">{profile.country}</span>
          </div>
          <Separator />

          
          <div className="rounded-lg flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-200">Address:</span>
            <span className="ml-2">{profile.address}</span>
          </div>
          <Separator />

          
          <div className="rounded-lg flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-200">Phone:</span>
            <span className="ml-2">{profile.phoneNumber}</span>
          </div>
          <Separator />

          
          <div className="rounded-lg flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-200">Education:</span>
            <span className="ml-2">{profile.education}</span>
          </div>
        </div>
        <Separator />

      </div>
      
      {/* Languages */}
      <div className="space-y-2">
      <div className='flex flex-row items-center'>
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Languages
          </h2>
          <div className='rounded-full w-2 h-2 bg-[#915EFF] ml-2'/>
        </div>
        <div className="rounded-lg py-4">
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((lang, index) => (
              <span key={index} className="bg-[#efe7ff] text-[#915EFF] px-3 py-1 rounded-full text-sm">
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
      <div className="space-y-2 mt-4">
      <div className='flex flex-row items-center'>
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Skills
          </h2>
          <div className='rounded-full w-2 h-2 bg-[#915EFF] ml-2'/>
        </div>
        <div className="rounded-lg">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span key={index} className="bg-[#efe7ff] text-[#915EFF] px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Work Experience */}
      <div className="space-y-2">
      <div className='flex flex-row items-center'>
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Work Experience
          </h2>
          <div className='rounded-full w-2 h-2 bg-[#915EFF] ml-2'/>
        </div>
        <div className="p-4 rounded-lg">
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
      <div className='flex flex-row items-center'>
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Certificates
          </h2>
          <div className='rounded-full w-2 h-2 bg-[#915EFF] ml-2'/>
        </div>
        <div className="p-4 rounded-lg">
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
      <div className="space-y-2 mt-4">
      <div className='flex flex-row items-center'>
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">About Me
          </h2>
          <div className='rounded-full w-2 h-2 bg-[#915EFF] ml-2'/>
        </div>
        <div className="p-4 bg-gray-50/60 rounded-lg dark:bg-black/20 ">
          <p>{profile.aboutMe}</p>
        </div>
      </div>
      
      {/* Additional Information */}
      {profile.additionalInformation && (
        <div className="space-y-2">
          <div className='flex flex-row items-center'>
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200">Additional Information
          </h2>
          <div className='rounded-full w-2 h-2 bg-[#915EFF] ml-2'/>
        </div>
          <div className="p-4 bg-gray-50/60 dark:bg-black/20 rounded-lg">
            <p>{profile.additionalInformation}</p>
          </div>
        </div>
      )}
    </div>
  );

  // Array of page rendering functions
  const pages = [
    renderPersonalInfoPage,
    renderSkillsAndWorkPage,
    renderAboutMePage
  ];

  // Page indicators
  const pageIndicators = ["Personal Info", "Skills & Experience", "About Me"];

  return (
    <div className="mx-auto max-w-7xl mt-16 font-poppins">
      <div className="flex flex-col xl:flex-row h-screen">
        <div className="hidden xl:block xl:w-1/2 xl:pr-8">
          <div className="h-3/4 flex items-center justify-center">
            <ProfileCard />
          </div>
        </div>
        
        {/* Right side - Profile Details */}
        <div className="w-full xl:w-1/2 xl:h-3/4 max-lg:p-8 border rounded-xl p-4">
          <div className="h-full flex flex-col">
            <div className="flex flex-row justify-between items-start border-b group">
              <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                {profile.firstName} {profile.lastName}
              </h1>
              <Button className='flex flex-row items-center justify-center bg-[#915EFF] hover:bg-[#b594fd] rounded-full' onClick={handleEdit}>
                Edit
                <span><ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" /></span>
              </Button>

            </div>
            
            {/* Content area */}
            <div className="flex-grow overflow-y-auto">
              {pages[currentPage]()}
            </div>
            
            {/* Navigation */}
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <button 
                onClick={goToPreviousPage} 
                disabled={currentPage === 0}
                className={`flex items-center ${currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-black hover:text-black/40 cursor-pointer dark:text-white'}`}
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
                className={`flex items-center ${currentPage === 2 ? 'text-gray-300 cursor-not-allowed' : 'text-black hover:text-black/40 dark:text-white cursor-pointer'}`}
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