'use client';

import React from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { ProfileFormType } from '@/schemas/profileSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { CountryCombobox } from '@/components/CountryCombobox';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StepTwoProps {
  form: UseFormReturn<ProfileFormType>;
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
      <h2 className="mb-6 text-2xl font-bold">Contact Information</h2>

      {/* Country */}
      <FormField
        control={form.control}
        name="country"
        render={() => (
          <FormItem>
            <FormLabel>Country</FormLabel>
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
            <FormLabel>Adress</FormLabel>
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

      {/* Phone Number */}
      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone number</FormLabel>
            <FormControl>
              <Controller
                control={form.control}
                name="phoneNumber"
                render={({ field: { onChange, value } }) => (
                  <InputOTP
                    maxLength={9}
                    value={value}
                    onChange={(newValue) => onChange(newValue)}
                    className="max-lg:scale-50"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={6} />
                      <InputOTPSlot index={7} />
                      <InputOTPSlot index={8} />
                    </InputOTPGroup>
                  </InputOTP>
                )}
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
