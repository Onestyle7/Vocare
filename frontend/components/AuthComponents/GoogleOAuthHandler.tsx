'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const GoogleOAuthHandler = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const googleLogin = searchParams.get('googleLogin');
    const userId = searchParams.get('userId');

    if (googleLogin === 'success' && userId) {
      const fetchToken = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-get-token`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
              credentials: 'include',
            }
          );

          if (!response.ok) {
            throw new Error('Token request failed');
          }

          const authHeader = response.headers.get('Authorization');
          const token = authHeader?.replace('Bearer ', '');

          if (token) {
            localStorage.setItem('token', token);
            toast.success('Logged in with Google');
          } else {
            throw new Error('Token missing in response');
          }
        } catch (error) {
          console.error('Google OAuth error:', error);
          toast.error('Google login failed');
        } finally {
          router.replace('/');
        }
      };

      fetchToken();
    }
  }, [searchParams, router]);

  return null;
};

export default GoogleOAuthHandler;
