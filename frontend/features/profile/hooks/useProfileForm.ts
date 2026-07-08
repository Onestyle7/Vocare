// TODO: REMOVE IN NEXT REFACTOR ITERATION!!!
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { useUnauthorizedToast } from '@/lib/hooks/useUnauthorizedToast';
import { PersonalityType } from '@/lib/types/personalityTypes';
import { UserProfile } from '@/lib/types/profile';
import { Risk } from '@/lib/types/risk';

import { clearProfileCommand, createProfileCommand, updateProfileCommand } from '../dal/commands';
import { CreateProfileFormType } from '../profileSchema';

// Normalizuje daty do formatu YYYY-MM-DD, bez strefy czasowej/ czasu
export const formatDateIfNeeded = (date?: string) => {
  if (!date) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  if (/^\d{4}-\d{2}-\d{2}T/.test(date)) return date.slice(0, 10);
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return undefined;
  }
};

export function useProfileForm(
  form: UseFormReturn<CreateProfileFormType>,
  setIsEditing: (isEditing: boolean) => void,
  initialData?: UserProfile
) {
  const [isPending, startTransition] = useTransition();
  const [isEditMode, setEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showRecommendDialog, setShowRecommendDialog] = useState(false);
  const { unauthorizedToast } = useUnauthorizedToast();
  const totalSteps = 5;
  const router = useRouter();

  const formatProfileDates = useCallback(
    (data: any): UserProfile => ({
      ...data,
      certificates:
        data.certificates?.map((cert: any) => ({
          name: cert.name,
          issuer: cert.issuer ?? '',
          issueDate: formatDateIfNeeded(cert.issueDate) ?? '',
          expiryDate: formatDateIfNeeded(cert.expiryDate) ?? '',
          noExpiry: cert.noExpiry ?? false,
        })) ?? [],

      education:
        data.education?.map((edu: any) => {
          const normalizedEndDate = formatDateIfNeeded(edu.endDate) ?? '';
          return {
            ...edu,
            degree: edu.degree ?? '',
            field: edu.field ?? '',
            startDate: formatDateIfNeeded(edu.startDate) ?? '',
            endDate: normalizedEndDate,
            current: edu.current === true || normalizedEndDate === '',
          };
        }) ?? [],

      workExperience:
        data.workExperience?.map((work: any) => {
          const normalizedEndDate = formatDateIfNeeded(work.endDate) ?? '';
          return {
            ...work,
            startDate: formatDateIfNeeded(work.startDate),
            endDate: normalizedEndDate,
            description: work.description ?? '',
            responsibilities: work.responsibilities ?? [],
            current: work.current === true || normalizedEndDate === '',
          };
        }) ?? [],
      phoneNumber: data.phoneNumber ?? '',
      additionalInformation: data.additionalInformation ?? '',
      aboutMe: data.aboutMe ?? '',
      willingToRebrand: data.willingToRebrand ?? false,
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
    if (initialData) {
      setEditMode(true);
      form.reset(formatProfileDates(initialData));
    }
  }, [form, initialData, formatProfileDates]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = (data: CreateProfileFormType) => {
    const wasDirty = form.formState.isDirty;
    const formattedData = formatProfileDates(data);

    startTransition(async () => {
      let error;
      if (isEditMode) {
        [error] = await updateProfileCommand(formattedData);
      } else {
        [error] = await createProfileCommand(formattedData);
      }

      if (error) {
        if (error.type === 'Unauthorized') {
          unauthorizedToast();
        } else {
          toast.error('Wystąpił błąd', { description: error.message });
        }
        return;
      }

      toast.success(
        isEditMode ? 'Profil zaktualizowany pomyślnie!' : 'Profil utworzony pomyślnie!'
      );

      if (!isEditMode) {
        setEditMode(true);
      }

      if (wasDirty) {
        setShowRecommendDialog(true);
      } else {
        setIsEditing(false);
      }
    });
  };

  const closeRecommendDialog = () => {
    setShowRecommendDialog(false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const [error] = await clearProfileCommand();

      if (error) {
        if (error.type === 'Unauthorized') {
          unauthorizedToast();
        } else {
          toast.error('Błąd usuwania profilu', { description: error.message });
        }
        return;
      }

      setIsEditing(false);
      toast.success('Profil wyczyszczony pomyślnie!');
      router.push('/dashboard/profile');
    });
  };

  return {
    isPending,
    isEditMode,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    onSubmit,
    handleDelete,
    showRecommendDialog,
    closeRecommendDialog,
  };
}
