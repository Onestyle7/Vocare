'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { spinner_terminal } from '@/app/constants';
import { ButtonForm } from '@/components/ui/button-form';
import { linkedinVerify } from '@/lib/auth';
import {
  clearLinkedInOAuthState,
  getLinkedInRedirectUri,
  getStoredLinkedInOAuthState,
} from '@/lib/linkedin-oauth';

const getLinkedInCallbackErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'LinkedIn login failed.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'LinkedIn login failed.';
};

const LinkedInCallbackContent = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current) {
      return;
    }

    hasHandledCallback.current = true;

    const fail = (message: string) => {
      clearLinkedInOAuthState();
      setErrorMessage(message);
      toast.error('LinkedIn login failed', {
        description: message,
      });
    };

    const completeLinkedInLogin = async () => {
      const providerError = searchParams.get('error');
      const providerErrorDescription = searchParams.get('error_description');

      if (providerError) {
        fail(providerErrorDescription || 'LinkedIn authorization was declined.');
        return;
      }

      const code = searchParams.get('code');
      const returnedState = searchParams.get('state');

      if (!code || !returnedState) {
        fail('Missing LinkedIn authorization parameters.');
        return;
      }

      const storedState = getStoredLinkedInOAuthState();
      clearLinkedInOAuthState();

      if (!storedState || storedState !== returnedState) {
        fail('LinkedIn login could not be verified. Please try again.');
        return;
      }

      try {
        const redirectUri = getLinkedInRedirectUri(window.location.origin);
        console.log('callback redirectUri skibidi:', redirectUri);
        const response = await linkedinVerify(code, redirectUri);

        toast.success(response.isNewUser ? 'Account created!' : 'Login successful!', {
          description: response.isNewUser ? 'Welcome to Vocare.' : 'Welcome back!',
        });

        router.replace('/');
      } catch (error) {
        fail(getLinkedInCallbackErrorMessage(error));
      }
    };

    void completeLinkedInLogin();
  }, [router, searchParams]);

  if (errorMessage) {
    return (
      <div className="auth-form text-center">
        <span className="flex items-center justify-center">
          <ShieldAlert className="h-24 w-24" />
        </span>
        <h1 className="text-3xl font-bold">Logowanie za pomocą Linkedin nie powiodło się</h1>
        <p className="mb-6 text-gray-600">{errorMessage}</p>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Link href="/sign-in">
            <ButtonForm className="group form-button">
              Powrót do logowania
              <span className="arrow-animation mx-2">
                <ArrowRight />
              </span>
            </ButtonForm>
          </Link>
          <Link
            href="/sign-in"
            className="font-poppins relative ml-2 font-semibold text-[#915EFF] transition duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#915EFF] after:transition-all after:duration-300 after:content-[''] hover:after:w-full"
          >
            Powrót do logowania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form font-poppins flex flex-col items-center justify-center">
      <Image
        src={spinner_terminal}
        alt="Completing LinkedIn sign in..."
        width={48}
        height={48}
        className="animate-spin"
      />
      <h1 className="mt-6 text-3xl font-bold">Łączenie z Linkedin</h1>
      <p className="mt-4 text-center text-sm text-gray-600">
        Finalizowanie Twojej sesji Vocare. To może chwilę potrwać.
      </p>
    </div>
  );
};

const LinkedInCallbackPage = () => {
  return (
    <Suspense
      fallback={
        <div className="auth-form flex items-center justify-center">
          <Image
            src={spinner_terminal}
            alt="Loading..."
            width={48}
            height={48}
            className="animate-spin"
          />
        </div>
      }
    >
      <LinkedInCallbackContent />
    </Suspense>
  );
};

export default LinkedInCallbackPage;
