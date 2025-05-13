'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CreateProfileFormType } from '@/lib/schemas/profileSchema';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface StepFourProps {
  form: UseFormReturn<CreateProfileFormType>;
  onBack: () => void;
  onSubmit: (data: CreateProfileFormType) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
  handleDelete: () => Promise<void>;
}

export default function StepFour({
  form,
  onBack,
  onSubmit,
  isLoading,
  isEditMode,
  handleDelete,
}: StepFourProps) {
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
                placeholder="Additional informations that you want to share..."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-col space-y-4 pt-6">
        <div className="flex flex-row items-center justify-center space-x-4">
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
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="font-poppins group h-[46px] w-[45%] rounded-full bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
          >
            <span className="flex flex-row items-center justify-center">
              Save
              <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" />
            </span>
          </Button>
        </div>
      </div>

      {isEditMode && (
        <div className="flex items-center justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="font-poppins group h-[46px] w-[95%] rounded-full border border-black bg-transparent text-lg text-black hover:bg-transparent sm:w-[93%] dark:border-[0.5px] dark:border-white dark:text-white"
              >
                <span className="flex flex-row items-center justify-center">
                  Delete Profile
                  <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" />
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="font-poppins">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your profile and all
                  related data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-destructive hover:bg-destructive/80 text-white"
                >
                  Yes, delete it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
