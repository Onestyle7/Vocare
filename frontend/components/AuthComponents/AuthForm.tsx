'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInSchema,
  signUpSchema,
  SignInFormType,
  SignUpFormType,
} from '@/lib/schemas/authSchema';
import { registerUser, loginUser, googleVerify } from '@/lib/auth';
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
import { WindowWithGoogle, GoogleTokenResponse, GoogleTokenClient } from '@/lib/types/google-oauth';

type FormType = 'sign-in' | 'sign-up';
type FormDataMap = {
  'sign-in': SignInFormType;
  'sign-up': SignUpFormType;
};

interface AuthFormProps {
  type: FormType;
}

const AuthForm = ({ type }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const isSignUp = type === 'sign-up';
  const resolver = zodResolver(isSignUp ? signUpSchema : signInSchema);
  const form = useForm<FormDataMap[FormType]>({
    resolver,
    defaultValues: isSignUp
      ? {
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
        }
      : {
          email: '',
          password: '',
        },
  });

  async function onSubmit(values: SignInFormType | SignUpFormType) {
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { email, password, confirmPassword } = values as SignUpFormType;
        await registerUser({
          email,
          password,
          confirmPassword,
        });
        toast.success('Registration successful!', {
          description: 'You have successfully created an account. Please sign in.',
        });
        router.push('/sign-in');
      } else {
        const { email, password } = values as SignInFormType;
        const data = await loginUser({
          email,
          password,
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

      if (status === 429) {
        toast.error('Too many login attempts', {
          description: 'Please wait a few minutes before trying again.',
        });
      } else if (
        status === 400 ||
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

  const handleGoogleSignIn = () => {
    const windowWithGoogle = window as WindowWithGoogle;

    if (!windowWithGoogle.google?.accounts?.oauth2) {
      toast.error('Google SDK not loaded');
      return;
    }

    const client: GoogleTokenClient = windowWithGoogle.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'openid profile email',
      callback: async (tokenResponse: GoogleTokenResponse) => {
        if (tokenResponse.error) {
          toast.error('Google authentication failed');
          return;
        }

        setIsLoading(true);
        try {
          await googleVerify(tokenResponse.access_token);
          toast.success('Login successful!', { description: 'Welcome back!' });
          router.push('/');
        } catch (err) {
          console.error(err);
          toast.error('Google login failed');
        } finally {
          setIsLoading(false);
        }
      },
    });

    client.requestAccessToken();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form font-poppins">
        <h1 className="form-title">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>

        {isSignUp && (
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

        {isSignUp && (
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
          {isSignUp ? 'Join Vocare' : 'Sign In'}
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
            <p>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</p>
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="relative ml-2 font-semibold text-[#915EFF] transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#915EFF] after:transition-all after:duration-300 after:content-[''] hover:after:w-full"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Link>
          </div>

          {!isSignUp && (
            <Link
              href="/forgot-password"
              className="relative ml-2 font-medium text-gray-500 transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gray-500 after:transition-all after:duration-300 after:content-[''] hover:after:w-full"
            >
              Forgot Password?
            </Link>
          )}
        </div>

        {!isSignUp && (
          <div className="flex w-full flex-col items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex w-full items-center">
              <div className="h-[0.5px] w-full bg-gray-500/80" />
              <span className="mx-4 whitespace-nowrap text-gray-500">or login with</span>
              <div className="h-[0.5px] w-full bg-gray-500/80" />
            </div>

            <div className="tems-center mt-4 flex w-full flex-row justify-center gap-2">
              <OAuthButton icon={google} label="Login with Google" onClick={handleGoogleSignIn} />
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

export default AuthForm;
