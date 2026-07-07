'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Eye, EyeOff, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ButtonForm } from '@/components/ui/button-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { resetPassword } from '@/features/auth/dal/commands';
import { spinner_terminal } from '@/features/marketing/constants';

import { ResetPasswordFormType, resetPasswordSchema } from '../dal/schemas';

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const router = useRouter();

  const form = useForm<ResetPasswordFormType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormType) => {
    setServerError(null);

    startTransition(async () => {
      const [error] = await resetPassword({
        email,
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      if (error) {
        setServerError(error.message);
        toast.error(error.message);
        return;
      }

      toast.success('Pomyślnie zresetowano hasło', { position: 'top-center' });

      setTimeout(() => {
        router.push('/sign-in');
      }, 2000);
    });
  };

  const getPasswordStrength = (password: string) => {
    return [
      { test: password.length >= 6, label: 'At least 6 characters' },
      { test: /[a-z]/.test(password), label: 'One lowercase letter' },
      { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
      { test: /\d/.test(password), label: 'One number' },
      {
        test: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
        label: 'One special character',
      },
    ];
  };

  const passwordValue = form.watch('newPassword');
  const passwordChecks = getPasswordStrength(passwordValue || '');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form font-poppins">
        <h1 className="form-title flex items-center justify-center text-3xl font-bold">
          Set New Password
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Enter your new password for <br />{' '}
          <span className="font-semibold text-[#915EFF]">{email}</span>
        </p>

        {serverError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <div className="shad-form-item">
                <FormLabel className="shad-form-label mb-2">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter new password"
                      className="input-profile pr-10"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />

              {passwordValue && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check, index) => (
                    <div key={index} className="flex items-center text-xs">
                      {check.test ? (
                        <Check className="mr-2 h-3 w-3 text-green-500" />
                      ) : (
                        <X className="mr-2 h-3 w-3 text-red-500" />
                      )}
                      <span className={check.test ? 'text-green-600' : 'text-red-600'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <div className="shad-form-item">
                <FormLabel className="shad-form-label mb-2">Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Confirm new password"
                      className="input-profile pr-10"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />

        <ButtonForm
          type="submit"
          className="group form-button"
          disabled={isPending || !form.formState.isValid}
        >
          {isPending ? 'Updating Password...' : 'Update Password'}
          <span className="arrow-animation">
            <ArrowRight />
          </span>
          {isPending && (
            <Image
              src={spinner_terminal}
              alt="loader"
              width={24}
              height={24}
              className="ml-2 animate-spin dark:invert"
            />
          )}
        </ButtonForm>

        <div className="mt-4 flex items-center justify-center">
          <Link
            href="/sign-in"
            className="relative ml-2 font-semibold text-[#915EFF] transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#915EFF] after:transition-all after:duration-300 after:content-[''] hover:after:w-full"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </Form>
  );
}
