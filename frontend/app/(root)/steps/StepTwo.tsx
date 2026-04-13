'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreateProfileFormType, UpdateProfileFormType } from '@/lib/schemas/profileSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { CountryCombobox } from '@/components/SupportComponents/CountryCombobox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StepTwoProps {
  form: UseFormReturn<CreateProfileFormType | UpdateProfileFormType>;
  onNext: () => void;
  onBack: () => void;
}

export default function StepTwo({ form, onNext, onBack }: StepTwoProps) {
  const validateStep = async () => {
    const result = await form.trigger(['country', 'address', 'phoneNumber']);
    if (result) onNext();
  };

  return (
    <div className="font-poppins flex flex-col justify-center space-y-6">
      <h2 className="mb-6 text-2xl font-bold">Informacje kontaktowe</h2>

      {/* Country */}
      <FormField
        control={form.control}
        name="country"
        render={() => (
          <FormItem>
            <FormLabel>Kraj</FormLabel>
            <CountryCombobox form={form} name="country" />
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address */}
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Addres</FormLabel> {/* poprawiona literówka */}
            <FormControl>
              <Input
                placeholder="ul. Marszałkowska 1, 00-001 Warszawa"
                {...field}
                className="input-profile"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Numer telefonu</FormLabel>
            <FormControl>
              <InputOTP
                maxLength={9}
                value={field.value || ''}
                onChange={(newValue) => field.onChange(newValue)}
              >
                {Array.from({ length: 3 }).map((_, groupIndex) => (
                  <InputOTPGroup key={`otp-group-${groupIndex}`} className="max-w-27">
                    {Array.from({ length: 3 }).map((__, slotIndex) => {
                      const index = groupIndex * 3 + slotIndex;
                      return (
                        <InputOTPSlot key={`otp-slot-${index}`} index={index} className="max-w-9" />
                      );
                    })}
                  </InputOTPGroup>
                ))}
              </InputOTP>
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
          className="font-poppins group h-[46px] w-[45%] rounded-lg bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
        >
          <span className="flex flex-row items-center justify-center">
            <ArrowLeft className="mr-2 transition-transform duration-300 group-hover:-translate-x-2" />
            Powrót
          </span>
        </Button>
        <Button
          type="button"
          onClick={validateStep}
          className="font-poppins group h-[46px] w-[45%] rounded-lg bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
        >
          <span className="flex flex-row items-center justify-center">
            Dalej
            <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" />
          </span>
        </Button>
      </div>
    </div>
  );
}
