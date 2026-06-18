'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
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
import OAuthButton from '@/features/auth/components/OAuthButton';
import { OAuthSignIn, signIn } from '@/features/auth/dal/commands';
import { google } from '@/features/marketing/constants';

import { SignInFormType, signInSchema } from '../dal/schemas';

export function SignInFrom({ reason, callbackUrl }: { reason?: string; callbackUrl?: string }) {
  const [isLoginPending, startTransition] = useTransition();
  const router = useRouter();

  const resolver = zodResolver(signInSchema);
  const form = useForm<SignInFormType>({
    resolver,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async () => {
    console.log('Initiated google sign-in');
    startTransition(async () => {
      await OAuthSignIn('google');
    });
  };

  const handleSignIn = async (formValues: SignInFormType) => {
    startTransition(async () => {
      const [error] = await signIn(formValues);
      if (error) {
        switch (error.type) {
          case 'InvalidCredentials': {
            form.setError('email', { type: 'manual' });
            form.setError('password', { type: 'manual', message: error.message });
          }
        }
        toast.error(error.message, { position: 'top-center' });
        return;
      }

      router.push(callbackUrl ? callbackUrl : '/dashboard');
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSignIn)} className="auth-form font-poppins">
        <h1 className="form-title">Zaloguj się</h1>
        <p className="text-red-500">{reason}</p>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="joedoe@gmail.com.." {...field} className="input-profile" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hasło</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Hasło" {...field} className="input-profile" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ButtonForm type="submit" disabled={isLoginPending} className="group form-button">
          Zaloguj
          <span className="arrow-animation">
            <ArrowRight />
          </span>
          {isLoginPending && (
            <Image
              src="/svg/loader.svg"
              alt="loader"
              width={24}
              height={24}
              className="ml-2 animate-spin"
            />
          )}
        </ButtonForm>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <p>Nie masz konta?</p>
            <Link
              href="/sign-up"
              className="relative ml-2 font-semibold text-[#915EFF] transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#915EFF] after:transition-all after:duration-300 after:content-[''] hover:after:w-full"
            >
              Utwórz konto
            </Link>
          </div>

          <Link
            href="/forgot-password"
            className="relative ml-2 font-medium text-gray-500 transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gray-500 after:transition-all after:duration-300 after:content-[''] hover:after:w-full"
          >
            Nie pamiętasz hasła?
          </Link>
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-4 text-sm text-gray-400">
          <div className="flex w-full items-center">
            <div className="h-[0.5px] w-full bg-gray-500/80" />
            <span className="mx-4 whitespace-nowrap text-gray-500">lub zaloguj się za pomocą</span>
            <div className="h-[0.5px] w-full bg-gray-500/80" />
          </div>

          <div className="tems-center mt-4 flex w-full flex-row justify-center gap-2">
            <OAuthButton icon={google} label="Zaloguj się Google" onClick={handleGoogleSignIn} />
          </div>
        </div>
      </form>
    </Form>
  );
}
