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
import { riskLabels } from '@/lib/enums/risk';
import { CreateProfileFormType } from '@/lib/schemas/profileSchema';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

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
      <h2 className="mb-6 text-2xl font-bold">Finanse</h2>

      <FormField
        control={form.control}
        name="financialSurvey.currentSalary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Obecne wynagrodzenie</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="np. 3500"
                value={field.value ?? ''}
                onChange={field.onChange}
                className="rounded-lg border"
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
            <FormLabel>Oczekiwane wynagrodzenie</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="np. 5000"
                value={field.value ?? ''}
                onChange={field.onChange}
                className="rounded-lg border"
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
          <FormItem>
            <FormLabel>Czy masz kredyt?</FormLabel>
            <FormControl>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={`h-12 flex-1 rounded-lg transition-all ${
                    field.value === true
                      ? 'bg-[#915EFF] text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] dark:hover:bg-[#713ae8]'
                      : 'border bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-gray-400/30'
                  }`}
                >
                  Tak
                </Button>
                <Button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={`h-12 flex-1 rounded-lg transition-all ${
                    field.value === false
                      ? 'bg-[#915EFF] text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] dark:hover:bg-[#713ae8]'
                      : 'border bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-gray-400/30'
                  }`}
                >
                  Nie
                </Button>
              </div>
            </FormControl>
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
              <FormLabel>Szczegóły kredytu</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Opisz szczegóły kredytu..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="financialSurvey.willingToRelocate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Czy chcesz się przeprowadzić?</FormLabel>
            <FormControl>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={`h-12 flex-1 rounded-lg transition-all ${
                    field.value === true
                      ? 'bg-[#915EFF] text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] dark:hover:bg-[#713ae8]'
                      : 'border bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-gray-400/30'
                  }`}
                >
                  Tak
                </Button>
                <Button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={`h-12 flex-1 rounded-lg transition-all ${
                    field.value === false
                      ? 'bg-[#915EFF] text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] dark:hover:bg-[#713ae8]'
                      : 'border bg-gray-200 text-gray-700 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-gray-400/30'
                  }`}
                >
                  Nie
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="willingToRebrand"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Czy chcesz się przebranżowić?</FormLabel>
            <FormControl>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={`h-12 flex-1 rounded-lg transition-all ${
                    field.value === true
                      ? 'bg-[#915EFF] text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] dark:hover:bg-[#713ae8]'
                      : 'border bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-gray-400/30'
                  }`}
                >
                  Tak
                </Button>
                <Button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={`h-12 flex-1 rounded-lg transition-all ${
                    field.value === false
                      ? 'bg-[#915EFF] text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] dark:hover:bg-[#713ae8]'
                      : 'border bg-gray-200 text-gray-700 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-gray-400/30'
                  }`}
                >
                  Nie
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="financialSurvey.riskAppetite"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Skłonność do ryzyka</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              value={field.value != null ? field.value.toString() : ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz poziom ryzyka" />
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

      <div className="flex flex-col space-y-4 pt-6">
        <div className="flex flex-row items-center justify-center space-x-4">
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
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="font-poppins group h-[46px] w-[45%] rounded-lg bg-[#915EFF] text-lg text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)] hover:bg-[#713ae8]"
          >
            <span className="flex flex-row items-center justify-center">
              Zapisz
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
                className="font-poppins group h-[46px] w-[95%] rounded-lg border border-black bg-transparent text-lg text-black hover:bg-transparent sm:w-[93%] dark:border-[0.5px] dark:border-white dark:text-white"
              >
                <span className="flex flex-row items-center justify-center">
                  Usuń profil
                  <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-2" />
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="font-poppins">
              <AlertDialogHeader>
                <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tej akcji nie można cofnąć. Twoj profil i dane zostąną prenamentnie usunięte.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-destructive hover:bg-destructive/80 text-white"
                >
                  Tak, usuń konto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
