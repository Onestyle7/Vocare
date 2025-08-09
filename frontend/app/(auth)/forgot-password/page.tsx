'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
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
import { forgotPassword } from '@/lib/auth';
import { toast } from 'sonner';
import { loader, spinner_terminal } from '@/app/constants';

// Schema walidacji
const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await forgotPassword({ email: values.email });
      
      // Backend zawsze zwraca sukces dla bezpieczeństwa
      console.log('Password reset response:', response);
      
      setOpenDialog(true);
      setTimer(60); // start 60-second countdown
      
      // Opcjonalnie: pokaż toast z sukcesem
      toast.success('Reset link sent successfully');
      
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      // Wyświetl konkretny błąd jeśli jest dostępny
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0] || 
                          'Failed to send reset email. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (timer > 0) return; // Zabezpieczenie przed wielokrotnym kliknięciem
    
    const email = form.getValues('email');
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }

    try {
      await forgotPassword({ email });
      setTimer(60); // restart timer
      toast.success('Reset link sent again');
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error('Failed to resend email. Please try again.');
    }
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title">Reset Password</h1>
          
          {/* Wyświetl błąd globalny */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
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
            disabled={isLoading || !form.watch('email') || !!form.formState.errors.email}
          >
            {isLoading ? 'Sending...' : 'Reset Password'}
            <span className="arrow-animation">
              <ArrowRight />
            </span>
            {isLoading && (
              <Image
                src={spinner_terminal}
                alt="loader"
                width={24}
                height={24}
                className="ml-2 animate-spin dark:invert"
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

      {/* Success Dialog */}
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
              disabled={timer > 0}
            >
              {timer > 0 ? `Send again in ${timer}s` : `Email didn't arrive? Send again`}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ForgotPasswordForm;