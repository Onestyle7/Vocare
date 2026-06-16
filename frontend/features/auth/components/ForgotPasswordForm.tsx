'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { forgotPassword } from '@/features/auth/dal/commands';
import { spinner_terminal } from '@/features/marketing/constants';

import { ForgotPasswordFormType, forgotPasswordSchema } from '../dal/schemas';

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [openDialog, setOpenDialog] = useState(false);
  const [timer, setTimer] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormType) => {
    setServerError(null);

    startTransition(async () => {
      const [error] = await forgotPassword(values);

      if (error) {
        setServerError(error.message);
        toast.error(error.message);
        return;
      }

      setOpenDialog(true);
      setTimer(60);
      toast.success('Reset link sent successfully');
    });
  };

  const handleResendEmail = async () => {
    if (timer > 0) return;

    const email = form.getValues('email');

    startTransition(async () => {
      const [error] = await forgotPassword({ email });

      if (error) {
        toast.error(error.message);
        return;
      }

      setTimer(60);
      toast.success('Reset link sent again');
    });
  };

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form font-poppins">
          <h1 className="form-title">Reset Password</h1>

          {serverError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label mb-2">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Your e-mail"
                      className="input-profile"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />

          <ButtonForm
            type="submit"
            className="group form-button"
            disabled={isPending || !form.watch('email') || !!form.formState.errors.email}
          >
            {isPending ? 'Sending...' : 'Reset Password'}
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
              I remember the password
            </Link>
          </div>
        </form>
      </Form>

      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent className="font-poppins w-[90%] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Check your inbox</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Reset link has been sent to <br />
              <span className="font-semibold text-[#915EFF]">{form.getValues('email')}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex w-full flex-col items-center space-y-4">
            <AlertDialogAction
              onClick={() => setOpenDialog(false)}
              className="w-full max-w-xs rounded-md bg-[#915EFF] px-12 py-3 text-white transition-colors duration-200 hover:bg-[#7C3AED]"
            >
              Got it
            </AlertDialogAction>

            <button
              type="button"
              onClick={handleResendEmail}
              className={`cursor-pointer text-sm underline transition-colors duration-200 ${
                timer === 0
                  ? 'text-gray-600 hover:text-[#915EFF]'
                  : 'cursor-not-allowed text-gray-400'
              }`}
              disabled={timer > 0 || isPending}
            >
              {timer > 0 ? `Send again in ${timer}s` : `Email didn't arrive? Send again`}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
