'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CreateProfileFormType } from '@/lib/schemas/profileSchema';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StepFourProps {
  form: UseFormReturn<CreateProfileFormType>;
  onBack: () => void;
  onNext: () => void;
}

export default function StepFour({ form, onBack, onNext }: StepFourProps) {
  return (
    <div className="font-poppins space-y-6">
      <h2 className="mb-6 text-2xl font-bold">Additional Information</h2>

      {/* About Me */}
      <FormField
        control={form.control}
        name="aboutMe"
        render={({ field }) => (
          <FormItem>
            <FormLabel>About me</FormLabel>
            <FormControl>
              <Textarea placeholder="Tell about yourself..." className="min-h-[120px]" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Additional Information */}
      <FormField
        control={form.control}
        name="additionalInformation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Information</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Additional information that you want to share..."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-col space-y-4 pt-6">
        <div className="flex flex-row items-center justify-between">
          <Button
            type="button"
            onClick={onBack}
            className="font-poppins group h-[46px] w-[45%] rounded-lg bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
          >
            <span className="flex flex-row items-center justify-center">
              <ArrowLeft className="mr-2 transition-transform duration-300 group-hover:-translate-x-2" />
              Back
            </span>
          </Button>
          <Button
            type="button"
            onClick={onNext}
            className="font-poppins group h-[46px] w-[45%] rounded-lg bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
          >
            <span className="flex flex-row items-center justify-center">
              Continue
              <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
