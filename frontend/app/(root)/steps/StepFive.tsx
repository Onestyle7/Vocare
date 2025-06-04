'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Risk, riskLabels } from '@/lib/enums/risk';
import { CreateProfileFormType } from '@/lib/schemas/profileSchema';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface StepFiveProps {
  form: UseFormReturn<CreateProfileFormType>;
  onBack: () => void;
  onSubmit: (data: CreateProfileFormType) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
  handleDelete: () => Promise<void>;
}

export default function StepFive({
  form,
  onBack,
  onSubmit,
  isLoading,
  isEditMode,
  handleDelete,
}: StepFiveProps) {
  const hasLoans = form.watch('financialSurvey.hasLoans');

  return (
    <div className="font-poppins space-y-6">
      <h2 className="mb-6 text-2xl font-bold">Financial Survey</h2>

      <FormField
        control={form.control}
        name="financialSurvey.currentSalary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current salary</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g., 3500"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="financialSurvey.desiredSalary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Desired salary</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="financialSurvey.hasLoans"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <input
                id="hasLoans"
                type="checkbox"
                checked={field.value ?? false}
                onChange={field.onChange}
              />
            </FormControl>
            <FormLabel htmlFor="hasLoans">Do you have any loans?</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasLoans && (
        <FormField
          control={form.control}
          name="financialSurvey.loanDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan details</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your loans..." className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="financialSurvey.riskAppetite"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Risk appetite</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              defaultValue={field.value?.toString()}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(riskLabels).map(([value, label]) => (
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

      <FormField
        control={form.control}
        name="financialSurvey.willingToRelocate"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <input
                id="willingToRelocate"
                type="checkbox"
                checked={field.value ?? false}
                onChange={field.onChange}
              />
            </FormControl>
            <FormLabel htmlFor="willingToRelocate">Willing to relocate?</FormLabel>
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

