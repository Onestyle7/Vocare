'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormType } from '@/schemas/profileSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { TagInput } from '@/components/TagInput';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StepThreeProps {
  form: UseFormReturn<ProfileFormType>;
  onNext: () => void;
  onBack: () => void;
}

export default function StepThree({ form, onNext, onBack }: StepThreeProps) {
  const validateStep = async () => {
    const result = await form.trigger(['education', 'workExperience', 'languages', 'certificates']);
    if (result) onNext();
  };

  return (
    <div className="font-poppins space-y-6">
      <h2 className="mb-6 text-2xl font-bold">Experience and Skills</h2>

      {/* Education */}
      <FormField
        control={form.control}
        name="education"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Education</FormLabel>
            <FormControl>
              <Input placeholder="Master's Degree" {...field} className="input-profile" />
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
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add experience (e.g., Developer at XYZ 2020–2023)"
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
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add language (e.g., English C1)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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

      {/* Certificates */}
      <FormField
        control={form.control}
        name="certificates"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Certificates</FormLabel>
            <FormControl>
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add certificate (e.g., AWS Certified Developer)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
