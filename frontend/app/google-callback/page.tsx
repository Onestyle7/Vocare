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
        // 1. Wyślij kod do backendu żeby otrzymać token
        const tokenRes = await fetch('http://localhost:8080/api/Auth/google-get-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code,
            redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI 
          }),
        });

        const tokenData = await tokenRes.json();
        
        if (!tokenData.success || !tokenData.accessToken) {
          toast.error('Błąd podczas pobierania tokenu Google');
          return router.push('/sign-in');
        }

        // 2. Zweryfikuj token
        const verifyRes = await fetch('http://localhost:8080/api/Auth/google-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenData.accessToken }),
        });

        const result = await verifyRes.json();

        if (result.success && result.token) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('userId', result.userId);
          localStorage.setItem('userEmail', result.email);
          toast.success('Zalogowano przez Google!');
          router.push('/');
        } else {
          toast.error(result.message || 'Logowanie nieudane');
          router.push('/sign-in');
        }
      } catch (err) {
        console.error('Google login error:', err);
        toast.error('Błąd połączenia z serwerem');
        router.push('/sign-in');
      }
    };

    fetchGoogleLogin();
  }, [router]);

  return (
    <div className="p-6 text-center text-gray-500">
      Logowanie przez Google... 🔄
    </div>
  );
};

export default GoogleCallbackPage;