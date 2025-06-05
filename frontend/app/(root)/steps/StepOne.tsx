'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreateProfileFormType, UpdateProfileFormType } from '@/lib/schemas/profileSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import { personalityTypeLabels } from '@/lib/enums/personalityTypes';

interface StepOneProps {
  form: UseFormReturn<CreateProfileFormType | UpdateProfileFormType>;
  onNext: () => void;
}

export default function StepOne({ form, onNext }: StepOneProps) {
  const validateStep = async () => {
    const result = await form.trigger(['firstName', 'lastName', 'personalityType']);
    if (result) onNext();
  };

  return (
    <div className="font-poppins space-y-6">
      <h2 className="mb-6 text-2xl font-bold">Basic Information</h2>

      {/* First Name */}
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Joe" {...field} className="input-profile" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Last Name */}
      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Surname</FormLabel>
            <FormControl>
              <Input placeholder="Doe" {...field} className="input-profile font-poppins" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Personality Type */}
      <FormField
        control={form.control}
        name="personalityType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Personality type</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              value={field.value != null ? field.value.toString() : ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your personality type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(personalityTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Continue Button */}
      <div className="pt-6">
        <Button
          type="button"
          onClick={validateStep}
          className="font-poppins group h-[46px] w-full rounded-full bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
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
