'use client';

import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Image from 'next/image';
import { ButtonForm } from '@/components/ui/button-form';
import { ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import Link from 'next/link';

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: { email: string }) => {
    setIsLoading(true);
    console.log(values);
    setIsLoading(false);
    setOpenDialog(true);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <h1 className="form-title">Reset Password</h1>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="shad-form-item">
                <FormLabel className="shad-form-label mb-2">E-mail</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Your e-mail" className="input-profile" {...field} />
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />
        <ButtonForm
          type="submit"
          className="group form-button"
          disabled={isLoading || !form.watch('email')}
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

        <div className="flex items-center justify-center">
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
      <AlertDialogContent className="font-poppins">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            Sprawdź e-mail
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Na adres{' '}
            <span className="font-semibold text-[#915EFF]">
              {form.getValues('email')}
            </span>{' '}
            został wysłany kod OTP. Wprowadź go poniżej.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-4 flex w-full justify-center">
          <InputOTP maxLength={6} className="" containerClassName="" >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ForgotPasswordForm;
