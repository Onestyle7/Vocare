'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFormSchema, AuthFormType } from '@/lib/schemas/authSchema';
import { registerUser, loginUser } from '@/lib/auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { ButtonForm } from '../ui/button-form';
import { AxiosError } from 'axios';
import OAuthButton from './OAuthButton';
import { google } from '@/app/constants';

type FormType = 'sign-in' | 'sign-up';

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

const handleGoogleRedirect = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  window.location.href = `${apiUrl}/api/Auth/google-signin`;
};

  const formSchema = authFormSchema(type);
  const form = useForm<AuthFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: AuthFormType) {
    setIsLoading(true);
    try {
      if (type === 'sign-up') {
        await registerUser({
          email: values.email,
          password: values.password,
        });
        toast.success('Registration successful!', {
          description: 'You have successfully created an account. Please sign in.',
        });
        router.push('/sign-in');
      } else {
        const data = await loginUser({
          email: values.email,
          password: values.password,
        });
        localStorage.setItem('token', data.accessToken);
        toast.success('Login successful!', {
          description: 'Welcome back!',
        });
        router.push('/');
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      let status: number | undefined;

      if (error instanceof AxiosError) {
        errorMessage = error.message.toLowerCase();
        status = error.response?.status;
      } else if (error instanceof Error) {
        errorMessage = error.message.toLowerCase();
      }

      console.error('Error:', error);

      if (
        status === 401 ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('unauthorized')
      ) {
        toast.error('Invalid credentials', {
          description: 'Please check your email or password and try again.',
        });
      } else if (
        errorMessage.includes('network') ||
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('service unavailable')
      ) {
        toast.error('Connection error', {
          description: 'Unable to connect to the server. Please try again later.',
        });
      } else {
        toast.error('An error occurred', {
          description: errorMessage || 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form font-poppins">
        <h1 className="form-title">{type === 'sign-in' ? 'Sign In' : 'Sign Up'}</h1>
        {type === 'sign-up' && (
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Joe Doe.." {...field} className="input-profile" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Password"
                  {...field}
                  className="input-profile"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === 'sign-up' && (
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    {...field}
                    className="input-profile"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <ButtonForm type="submit" disabled={isLoading} className="group form-button">
          {type === 'sign-in' ? 'Sign In' : 'Join Vocare'}
          <span className="arrow-animation">
            <ArrowRight />
          </span>
          {isLoading && (
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
            <p>{type === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}</p>
            <Link
              href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
              className="relative ml-2 font-semibold text-[#915EFF] transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#915EFF] after:transition-all after:duration-300 after:content-[''] hover:after:w-full"
            >
              {type === 'sign-in' ? 'Sign Up' : 'Sign In'}
            </Link>
          </div>

          {type === 'sign-in' && (
            <Link href="/forgot-password" className="text-gray-500">
              Forgot Password?
            </Link>
          )}
        </div>

        {type === 'sign-in' && (
          <div className="flex w-full flex-col items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex w-full items-center">
              <div className="h-[0.5px] w-full bg-gray-500/80" />
              <span className="mx-4 whitespace-nowrap text-gray-500">or login with</span>
              <div className="h-[0.5px] w-full bg-gray-500/80" />
            </div>

            <div className="tems-center mt-4 flex w-full flex-row justify-center gap-2">
              <OAuthButton
  icon={google}
  label="Login with Google"
  onClick={() => handleGoogleRedirect()}
/>

            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

export default AuthForm;