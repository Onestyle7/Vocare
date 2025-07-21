'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const GoogleAuthHandler = () => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const googleLogin = params.get('googleLogin');
    const userId = params.get('userId');

    if (googleLogin === 'success' && userId) {
      const fetchToken = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-get-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });

          if (response.ok) {
            let token: string | null = null;
            const authHeader = response.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
              token = authHeader.replace('Bearer ', '');
            } else {
              try {
                const data = await response.clone().json();
                token = data.accessToken || data.token || null;
              } catch {
                // ignore json parse errors
              }
            }

            if (token) {
              localStorage.setItem('token', token);
            }
          }
        } catch (err) {
          console.error('Google auth token error', err);
        } finally {
          params.delete('googleLogin');
          params.delete('userId');
          const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
          router.replace(newUrl);
        }
      };

      fetchToken();
    }
  }, [router]);

  return null;
};

export default GoogleAuthHandler;
