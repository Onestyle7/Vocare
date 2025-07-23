'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const GoogleCallbackPage = () => {
  const router = useRouter();

  useEffect(() => {
    const fetchGoogleLogin = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        toast.error('Brak kodu logowania Google');
        return router.push('/sign-in');
      }

      try {
        // 1. Zamień code na access_token (Google)
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!, 
            redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          toast.error('Błąd podczas pobierania tokenu Google');
          return router.push('/sign-in');
        }

        // 2. Wyślij access_token do backendu
        const verifyRes = await fetch('http://localhost:8080/api/auth/google-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });

        const result = await verifyRes.json();

        if (result.userId && result.email) {
          localStorage.setItem('token', result.token); // jeśli zwraca JWT
          localStorage.setItem('userId', result.userId);
          localStorage.setItem('userEmail', result.email);

          toast.success('Zalogowano przez Google!');
          router.push('/');
        } else {
          toast.error(result.message || 'Logowanie nieudane');
          router.push('/sign-in');
        }
      } catch (err) {
        toast.error('Błąd połączenia z serwerem');
        router.push('/sign-in');
      }
    };

    fetchGoogleLogin();
  }, []);

  return (
    <div className="p-6 text-center text-gray-500">
      Logowanie przez Google... 🔄
    </div>
  );
};

export default GoogleCallbackPage;
