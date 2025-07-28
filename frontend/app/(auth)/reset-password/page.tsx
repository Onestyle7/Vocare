'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  resetPasswordSchema,
  ResetPasswordFormType,
} from '@/lib/schemas/passwordSchema';
import { resetPassword, validateResetToken } from '@/lib/auth';
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
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import Link from 'next/link';

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordFormType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token || !email) return setIsValid(false);
    const validate = async () => {
      try {
        const { isValid } = await validateResetToken(token, email);
        setIsValid(isValid);
        if (!isValid) toast.error('Invalid or expired token');
      } catch (err) {
        console.error(err);
        toast.error('Invalid or expired token');
        setIsValid(false);
      }
    };
    validate();
  }, [token, email]);

  const onSubmit = async (values: ResetPasswordFormType) => {
    setIsLoading(true);
    try {
      await resetPassword(values);
      toast.success('Password reset successfully');
      router.push('/sign-in');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValid === false) {
    return (
      <div className="flex flex-col items-center justify-center">
        <p className="mb-4 text-center text-red-500">Invalid or expired token.</p>
        <Link href="/forgot-password" className="text-[#915EFF] underline">
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <h1 className="form-title">Set New Password</h1>
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form-label">New Password</FormLabel>
              <FormControl>
                <Input type="password" className="input-profile" {...field} />
              </FormControl>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form-label">Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" className="input-profile" {...field} />
              </FormControl>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />
        <ButtonForm
          type="submit"
          className="group form-button"
          disabled={isLoading}
        >
          Reset Password
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
      </form>
    </Form>
  );
};

export default ResetPasswordPage;
