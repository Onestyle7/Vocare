'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreateProfileFormType, UpdateProfileFormType } from '@/lib/schemas/profileSchema';
import { Button } from '@/components/ui/button';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { TagInput } from '@/components/TagInput';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LanguageInput } from '@/components/LanguageInput';
import { EducationInput } from '@/components/EducationInput';
import { WorkExperienceInput } from '@/components/WorkExperienceInput';
import { CertificateInput } from '@/components/CertificateInput';

interface StepThreeProps {
  form: UseFormReturn<CreateProfileFormType | UpdateProfileFormType>;
  onNext: () => void;
  onBack: () => void;
}

export default function StepThree({ form, onNext, onBack }: StepThreeProps) {
  const validateStep = async () => {
    const result = await form.trigger([
      'education',
      'workExperience',
      'skills',
      'languages',
      'certificates',
    ]);
    if (result) onNext();
  };

  return (
    <div className="font-poppins space-y-6">
      <h2 className="mb-6 text-2xl font-bold">Experience and Skills</h2>

      {/* Skills */}
      <FormField
        control={form.control}
        name="skills"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Skills</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add a skill (e.g., JavaScript)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Languages */}
      <FormField
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Languages</FormLabel>
            <FormControl>
              <LanguageInput value={field.value || []} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Work Experience */}
      <FormField
  control={form.control}
  name="workExperience"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Professional Experience</FormLabel>
      <FormControl>
        <WorkExperienceInput
          value={field.value || []}
          onChange={field.onChange}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


      {/* Education */}
      <FormField
  control={form.control}
  name="education"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Education</FormLabel>
      <FormControl>
        <EducationInput value={field.value || []} onChange={field.onChange} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

      {/* Certificates */}
      <FormField
  control={form.control}
  name="certificates"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Certificates</FormLabel>
      <FormControl>
        <CertificateInput
          value={field.value || []}
          onChange={field.onChange}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


      {/* Navigation Buttons */}
      <div className="flex items-center justify-between space-x-2 pt-6">
        <Button
          type="button"
          onClick={onBack}
          className="font-poppins group h-[46px] w-[45%] rounded-full bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
        >
          <span className="flex flex-row items-center justify-center">
            <ArrowLeft className="mr-2 transition-transform duration-300 group-hover:-translate-x-2" />
            Back
          </span>
        </Button>
        <Button
          type="button"
          onClick={validateStep}
          className="font-poppins group h-[46px] w-[45%] rounded-full bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
        >
          <span className="flex flex-row items-center justify-center">
            Continue
            <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" />
          </span>
        </Button>
      </div>
    </div>
  );
}
