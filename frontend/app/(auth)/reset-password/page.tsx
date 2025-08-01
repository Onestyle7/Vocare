'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ButtonForm } from '@/components/ui/button-form';
import { ArrowRight, Eye, EyeOff, Check, X, ClockAlert } from 'lucide-react';
import { resetPassword, validateResetToken } from '@/lib/auth';
import { toast } from 'sonner';

// Schema walidacji
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPasswordContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Walidacja tokena przy załadowaniu komponenetu
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setTokenValid(false);
        setError('Invalid reset link. Please request a new password reset.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await validateResetToken({ token, email });
        setTokenValid(response.isValid);
        if (!response.isValid) {
          setError(response.message || 'Reset token has expired or is invalid.');
        }
      } catch (error: any) {
        console.error('Token validation error:', error);
        setTokenValid(false);
        setError('Failed to validate reset token. Please try again.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, email]);

  const onSubmit = async (values: ResetPasswordForm) => {
    if (!token || !email) {
      toast.error('Invalid reset parameters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await resetPassword({
        email,
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      console.log('Password reset successful:', response);
      setSuccess(true);
      toast.success('Password has been reset successfully!');
      
      // Przekieruj na stronę logowania po 3 sekundach
      setTimeout(() => {
        router.push('/sign-in');
      }, 3000);

    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0] || 
                          'Failed to reset password. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    const checks = [
      { test: password.length >= 6, label: 'At least 6 characters' },
      { test: /[a-z]/.test(password), label: 'One lowercase letter' },
      { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
      { test: /\d/.test(password), label: 'One number' },
    ];
    
    return checks;
  };

  const passwordValue = form.watch('newPassword');
  const passwordChecks = getPasswordStrength(passwordValue || '');

  // Loading state podczas walidacji tokena
  if (isValidating) {
    return (
      <div className="auth-form flex flex-col items-center justify-center">
        <Image
          src="/assets/icons/loader.svg"
          alt="Validating..."
          width={48}
          height={48}
          className="animate-spin"
        />
        <p className="mt-4 text-sm text-gray-600">Validating reset link...</p>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
  return (
    <div className="auth-form text-center">
      <span className='items-center justify-center flex'>
        <ClockAlert className='h-24 w-24'/>
      </span>
      <h1 className="text-3xl font-bold">Invalid Reset Link</h1>
      <p className="mb-6 text-gray-600">
        {'This password reset link is invalid or has expired.'}
      </p>
      <div className="space-y-4 flex-col flex items-center justify-center">
        <Link href="/forgot-password">
          <ButtonForm className="group form-button">
            Request new reset link
            <span className="arrow-animation mx-2">
          <ArrowRight />
        </span>
          </ButtonForm>
        </Link>
         <Link href="/forgot-password" className="relative ml-2 font-semibold text-[#915EFF] transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#915EFF] after:transition-all after:duration-300 after:content-[''] hover:after:w-full">
            Back to Sign In
        </Link>
      </div>
    </div>
  );
}
  // Success state
  if (success) {
    return (
      <div className="auth-form text-center">
        <div className="mb-6">
          <Check className="mx-auto h-16 w-16 text-green-500" />
        </div>
        <h1 className="flex items-center justify-center text-3xl">Password Reset Successful!</h1>
        <p className="mb-6 text-gray-600">
          Your password has been successfully updated. You will be redirected to the sign-in page.
        </p>
        <Link
          href="/sign-in"
          className="inline-block rounded-md bg-[#915EFF] px-6 py-3 text-white transition-colors duration-200 hover:bg-[#7C3AED]"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // Main reset password form
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <h1 className="items-center justify-center flex text-3xl font-bold">Set New Password</h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Enter your new password for <span className="font-semibold text-[#915EFF]">{email}</span>
        </p>

        {/* Display global error */}
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* New Password Field */}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
              
              {/* Password strength indicators */}
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

        {/* Confirm Password Field */}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
          disabled={isLoading || !form.formState.isValid}
        >
          {isLoading ? 'Updating Password...' : 'Update Password'}
          <span className="arrow-animation">
            <ArrowRight />
          </span>
          {isLoading && (
            <Image
              src="/assets/icons/loader.svg"
              alt="loader"
              width={24}
              height={24}
              className="ml-2 animate-spin"
            />
          )}
        </ButtonForm>

        <div className="flex items-center justify-center">
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
};

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="auth-form flex items-center justify-center">
        <Image
          src="/assets/icons/loader.svg"
          alt="Loading..."
          width={48}
          height={48}
          className="animate-spin"
        />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;