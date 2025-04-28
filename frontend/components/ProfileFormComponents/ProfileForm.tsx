'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileFormType } from '@/lib/schemas/profileSchema';
import {
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getUserProfile,
} from '@/lib/profile';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/app/types/profile';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import StepOne from '@/app/(root)/steps/StepOne';
import StepTwo from '@/app/(root)/steps/StepTwo';
import StepThree from '@/app/(root)/steps/StepThree';
import StepFour from '@/app/(root)/steps/StepFour';
import StepProgress from '@/app/(root)/steps/ProgressBar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { getErrorMessage } from '../SupportComponents/ErrorFunction';

export default function ProfileForm({
  initialData,
  onCancel,
}: {
  initialData?: UserProfile;
  onCancel?: () => void;
}) {
  const [isLoading, setLoading] = useState(false);
  const [isEditMode, setEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const router = useRouter();

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
      personalityType: undefined,
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/sign-in');
        return;
      }

      if (initialData) {
        setEditMode(true);
        form.reset(initialData);
        setLoading(false);
        return;
      }

      try {
        const profileData = await getUserProfile(token);
        if (profileData) {
          setEditMode(true);
          form.reset(profileData);
        }
      } catch (error) {
        console.error('No existing profile found or error fetching data', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [form, initialData, router]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data: ProfileFormType) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required', { description: 'Please sign in to continue.' });
      router.push('/sign-in');
      return;
    }

    const formattedData: UserProfile = {
      ...data,
      certificates: data.certificates ?? [],
      phoneNumber: data.phoneNumber ?? '',
      additionalInformation: data.additionalInformation ?? '',
    };

    try {
      let profileData;
      if (isEditMode) {
        profileData = await updateUserProfile(formattedData, token);
        toast.success('Profile updated successfully!');
      } else {
        profileData = await createUserProfile(formattedData, token);
        toast.success('Profile created successfully!');
        setEditMode(true);
      }

      localStorage.setItem('userProfile', JSON.stringify(profileData));
      router.push('/assistant');
    } catch (error: unknown) {
      console.error(error);
      toast.error('An error occurred', {
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required', { description: 'Please sign in to continue.' });
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    try {
      await deleteUserProfile(token);
      toast.success('Profile deleted successfully!');
      router.push('/');
    } catch (error) {
      console.error(error);
      toast.error('An error occurred', {
        description: 'Failed to delete profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const CancelButton = () => {
    const [open, setOpen] = useState(false);

    if (!onCancel) return null;

    return (
      <>
        {form.formState.isDirty ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="font-poppins rounded-full">
                Cancel
              </Button>
            </PopoverTrigger>
            <PopoverContent className="font-poppins w-80 space-y-6 p-6 text-center">
              <p className="text-base">Are you sure you want to discard changes?</p>
              <div className="flex justify-center gap-4">
                <Button variant="destructive" onClick={onCancel} className="px-6">
                  Yes, I&apos;m sure
                </Button>
                <Button variant="secondary" onClick={() => setOpen(false)} className="px-6">
                  No
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="font-poppins rounded-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </>
    );
  };

  const renderStep = () => {
    const sharedProps = {
      form,
      onNext: nextStep,
      onBack: prevStep,
    };

    switch (currentStep) {
      case 1:
        return (
          <div>
            <StepOne {...sharedProps} />
            <div className="mt-6 flex justify-center">
              <CancelButton />
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <StepTwo {...sharedProps} />
            <div className="mt-6 flex justify-end">
              <CancelButton />
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <StepThree {...sharedProps} />
            <div className="mt-6 flex justify-end">
              <CancelButton />
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <StepFour
              form={form}
              onBack={prevStep}
              onSubmit={onSubmit}
              isLoading={isLoading}
              isEditMode={isEditMode}
              handleDelete={handleDelete}
            />
            <div className="mt-6 flex justify-end">
              <CancelButton />
            </div>
          </div>
        );
      default:
        return <StepOne form={form} onNext={nextStep} />;
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-xl border p-8 lg:mt-10">
      <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
      <Form {...form}>{renderStep()}</Form>
    </div>
  );
}
