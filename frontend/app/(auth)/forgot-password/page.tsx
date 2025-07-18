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
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
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

  const handleResendEmail = () => {
    // Logic to resend email
    console.log('Resending email to:', form.getValues('email'));
  };

  return (
    <>
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
        <AlertDialogContent className="font-poppins w-[30%]">
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
              className="cursor-pointer text-sm text-gray-600 underline transition-colors duration-200 hover:text-[#915EFF]"
            >
              Email didn&apos;t arrive? Send again
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ForgotPasswordForm;
