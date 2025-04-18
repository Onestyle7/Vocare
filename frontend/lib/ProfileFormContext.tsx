// lib/ProfileFormContext.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileFormType } from '@/schemas/profileSchema';
import { getUserProfile } from '@/lib/profile';
import { useRouter } from 'next/navigation';

const FormContext = createContext<any>(null);

export const FormProvider = ({ children }: { children: React.ReactNode }) => {
  const [isEditMode, setEditMode] = useState(false);
  const form = useForm<ProfileFormType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      country: '',
      address: '',
      phoneNumber: '',
      education: '',
      workExperience: [],
      skills: [],
      certificates: [],
      languages: [],
      additionalInformation: '',
      aboutMe: '',
    },
  });

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const profileData = await getUserProfile(token);
        form.reset(profileData);
        setEditMode(true);
      } catch (e) {
        console.log('No profile found or failed to fetch');
      }
    };
    loadData();
  }, [form]);

  return <FormContext.Provider value={{ form, isEditMode }}>{children}</FormContext.Provider>;
};

export const useProfileForm = () => useContext(FormContext);
