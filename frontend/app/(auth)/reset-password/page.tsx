'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ButtonForm } from '@/components/ui/button-form';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { resetPassword, validateResetToken } from '@/lib/auth';
import {
  resetPasswordSchema,
  type ResetPasswordForm,
} from '@/lib/schemas/resetPasswordSchema';
import Image from 'next/image';

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';
  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const validate = async () => {
      try {
        await validateResetToken(token, email);
        setTokenValid(true);
      } catch {
        toast.error('Invalid or expired token');
      } finally {
        setChecking(false);
      }
    };
    if (token && email) validate();
    else setChecking(false);
  }, [token, email]);

  const onSubmit = async (values: ResetPasswordForm) => {
    try {
      await resetPassword({
        email,
        token,
        newPassword: values.password,
        confirmPassword: values.confirmPassword,
      });
      toast.success('Password reset successfully');
      router.push('/sign-in');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  if (checking) {
    return (
      <div className="flex h-full items-center justify-center">
        <Image
          src="/assets/icons/loader.svg"
          alt="loader"
          width={24}
          height={24}
          className="animate-spin"
        />
      </div>
    );
  }

  if (!tokenValid) {
    return <p className="error-message">Token is invalid or expired.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <h1 className="form-title">Set New Password</h1>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" className="input-profile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" className="input-profile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ButtonForm type="submit" className="group form-button">
          Reset Password
          <span className="arrow-animation">
            <ArrowRight />
          </span>
        </ButtonForm>
      </form>
    </Form>
  );
};

export default ResetPasswordPage;
