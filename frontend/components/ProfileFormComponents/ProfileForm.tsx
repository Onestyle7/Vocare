'use client';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getUserProfile,
} from '@/lib/profile';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import StepOne from '@/app/(root)/steps/StepOne';
import StepTwo from '@/app/(root)/steps/StepTwo';
import StepThree from '@/app/(root)/steps/StepThree';
import StepFour from '@/app/(root)/steps/StepFour';
import StepFive from '@/app/(root)/steps/StepFive';
import StepProgress from '@/app/(root)/steps/ProgressBar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CreateProfileFormType } from '@/lib/schemas/profileSchema';
import { createProfileSchema } from '@/lib/schemas/profileSchema';
import { UserProfile } from '@/lib/types/profile';
import { Risk } from '@/lib/enums/risk';
import { PersonalityType } from '@/lib/enums/personalityTypes';

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
  const totalSteps = 5;
  const router = useRouter();

  const form = useForm<CreateProfileFormType>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      country: '',
      address: '',
      phoneNumber: '',
      education: [],
      workExperience: [],
      skills: [],
      softSkills: [],
      certificates: [],
      languages: [],
      additionalInformation: '',
      aboutMe: '',
      personalityType: undefined,
      financialSurvey: {
        currentSalary: undefined,
        desiredSalary: undefined,
        hasLoans: false,
        loanDetails: '',
        riskAppetite: 5,
        willingToRelocate: false,
      },
    },
  });

  const formatDateIfNeeded = (date?: string) => {
    if (!date) return undefined;
    try {
      return new Date(date).toISOString();
    } catch {
      return undefined;
    }
  };

  const formatProfileDates = useCallback(
    (data: UserProfile): UserProfile => ({
      ...data,
      certificates:
        data.certificates?.map((cert) => ({
          name: cert.name,
          issuer: cert.issuer ?? '',
          issueDate: formatDateIfNeeded(cert.issueDate) ?? '',
          expiryDate: formatDateIfNeeded(cert.expiryDate) ?? '',
          noExpiry: cert.noExpiry ?? false,
        })) ?? [],

      education:
        data.education?.map((edu) => ({
          ...edu,
          degree: edu.degree ?? '',
          field: edu.field ?? '',
          startDate: formatDateIfNeeded(edu.startDate) ?? '',
          endDate: formatDateIfNeeded(edu.endDate) ?? '',
          current: edu.current ?? false,
        })) ?? [],

      workExperience:
        data.workExperience?.map((work) => ({
          ...work,
          startDate: formatDateIfNeeded(work.startDate),
          endDate: formatDateIfNeeded(work.endDate),
          description: work.description ?? '',
          responsibilities: work.responsibilities ?? [],
          current: work.current ?? false,
        })) ?? [],
      phoneNumber: data.phoneNumber ?? '',
      additionalInformation: data.additionalInformation ?? '',
      aboutMe: data.aboutMe ?? '',
      skills: data.skills ?? [],
      softSkills: data.softSkills ?? [],
      languages: data.languages ?? [],
      personalityType:
        typeof data.personalityType === 'string'
          ? isNaN(Number(data.personalityType))
            ? (PersonalityType[data.personalityType as keyof typeof PersonalityType] ??
              PersonalityType.Unknown)
            : Number(data.personalityType)
          : (data.personalityType ?? PersonalityType.Unknown),
      financialSurvey: {
        currentSalary: data.financialSurvey?.currentSalary,
        desiredSalary: data.financialSurvey?.desiredSalary,
        hasLoans: data.financialSurvey?.hasLoans ?? false,
        loanDetails: data.financialSurvey?.loanDetails ?? '',
        riskAppetite:
          typeof data.financialSurvey?.riskAppetite === 'string'
            ? isNaN(Number(data.financialSurvey?.riskAppetite))
              ? (Risk[data.financialSurvey?.riskAppetite as keyof typeof Risk] ?? Risk.Unknown)
              : Number(data.financialSurvey?.riskAppetite)
            : (data.financialSurvey?.riskAppetite ?? Risk.Unknown),
        willingToRelocate: data.financialSurvey?.willingToRelocate ?? false,
      },
    }),
    []
  );

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
        form.reset(formatProfileDates(initialData));
        setLoading(false);
        return;
      }
      try {
        const profileData = await getUserProfile();
        if (profileData) {
          setEditMode(true);
          form.reset(formatProfileDates(profileData));
        }
      } catch (err) {
        console.error('No existing profile found or error fetching data', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [form, initialData, router, formatProfileDates]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data: CreateProfileFormType) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required', { description: 'Please sign in to continue.' });
      router.push('/sign-in');
      return;
    }
    const formattedData = formatProfileDates(data);
    console.log('Certificates:', formattedData.certificates);
    try {
      let profileData;
      if (isEditMode) {
        profileData = await updateUserProfile(formattedData);
        toast.success('Profile updated successfully!');
      } else {
        console.log('DATA SENT TO BACKEND:', formattedData);
        profileData = await createUserProfile(formattedData);
        toast.success('Profile created successfully!');
        setEditMode(true);
      }
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      router.push('/assistant');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Please try again.';
      toast.error('An error occurred', {
        description: errorMessage,
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
      await deleteUserProfile();
      localStorage.removeItem('userProfile');
      toast.success('Profile deleted successfully!');
      router.push('/');
    } catch (err) {
      console.error(err);
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
    const sharedProps = { form, onNext: nextStep, onBack: prevStep };
    switch (currentStep) {
      case 1:
        return (
          <>
            <StepOne {...sharedProps} />
            <div className="mt-6 flex justify-center">
              <CancelButton />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <StepTwo {...sharedProps} />
            <div className="mt-6 flex justify-end">
              <CancelButton />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <StepThree {...sharedProps} />
            <div className="mt-6 flex justify-end">
              <CancelButton />
            </div>
          </>
        );
      case 4:
        return (
          <>
            <StepFour form={form} onBack={prevStep} onNext={nextStep} />
            <div className="mt-6 flex justify-end">
              <CancelButton />
            </div>
          </>
        );
      case 5:
        return (
          <>
            <StepFive
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
          </>
        );
      default:
        return <StepOne form={form} onNext={nextStep} />;
    }
  };

  return (
    <div className="relative mx-auto max-w-2xl rounded-xl border bg-[#f3f3f3] p-8 lg:mt-10 dark:bg-[#0e100f]">
      <div className="relative z-30">
        <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
        <Form {...form}>{renderStep()}</Form>
      </div>
      {/* <ScrollParallax isAbsolutelyPositioned zIndex={10}>
       * <div className="absolute top-1/4 -left-35 hidden xl:block">
       * <Image src={shape1} alt="shape" width={78} height={78} className="-rotate-20" />
       * </div>
       * </ScrollParallax> */}
    </div>
  );
}
