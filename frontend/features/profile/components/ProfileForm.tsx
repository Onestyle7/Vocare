'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import StepProgress from '@/components/SupportComponents/steps/ProgressBar';
import StepFive from '@/components/SupportComponents/steps/StepFive';
import StepFour from '@/components/SupportComponents/steps/StepFour';
import StepOne from '@/components/SupportComponents/steps/StepOne';
import StepThree from '@/components/SupportComponents/steps/StepThree';
import StepTwo from '@/components/SupportComponents/steps/StepTwo';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserProfile } from '@/lib/types/profile';

import { useProfileForm } from '../hooks/useProfileForm';
import { CreateProfileFormType, createProfileSchema } from '../profileSchema';

export default function ProfileForm({
  initialData,
  onCancel,
  setIsEditing,
}: {
  initialData?: UserProfile;
  onCancel?: () => void;
  setIsEditing: (isEditing: boolean) => void;
}) {
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
      willingToRebrand: false,
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

  const {
    isPending,
    isEditMode,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    onSubmit,
    handleDelete,
  } = useProfileForm(form, setIsEditing, initialData);

  const CancelButton = () => {
    const [open, setOpen] = useState(false);
    if (!onCancel) return null;
    return (
      <>
        {form.formState.isDirty ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="font-poppins rounded-sm">
                Anuluj
              </Button>
            </PopoverTrigger>
            <PopoverContent className="font-poppins w-80 space-y-6 p-6 text-center">
              <p className="text-base">Czy napewno chcesz porzucić zmiany?</p>
              <div className="flex justify-center gap-4">
                <Button variant="destructive" onClick={onCancel} className="px-6">
                  Tak, porzuć
                </Button>
                <Button variant="secondary" onClick={() => setOpen(false)} className="px-6">
                  Nie
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="font-poppins rounded-sm"
            onClick={onCancel}
          >
            Anuluj
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
              isLoading={isPending}
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
    <div className="relative mx-2 h-[620px] max-w-2xl overflow-y-auto rounded-xl border bg-[#f3f3f3] p-0 max-sm:mt-2 sm:mx-auto lg:mt-10 dark:bg-[#0e100f]">
      <div className="relative z-30">
        <div className="sticky top-0 z-40">
          <div className="bg-[#f3f3f3] px-6 pt-6 pb-2 dark:bg-[#0e100f]">
            <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
          </div>
        </div>

        <div className="px-6 pb-6">
          <Form {...form}>{renderStep()}</Form>
        </div>
      </div>
    </div>
  );
}
