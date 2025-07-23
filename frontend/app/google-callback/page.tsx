'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const GoogleCallbackPage = () => {
  const router = useRouter();
  
  useEffect(() => {
    const fetchGoogleLogin = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      console.log('📦 URL Params:', urlParams.toString());

      const googleLogin = urlParams.get('googleLogin');
      const userId = urlParams.get('userId');

      if (googleLogin !== 'success' || !userId) {
        toast.error('Nieprawidłowe dane logowania Google');
        return router.push('/sign-in');
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const tokenRes = await fetch(`${apiUrl}/api/Auth/google-get-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const tokenData = await tokenRes.json();
        console.log('📥 Odpowiedź z /google-get-token (status', tokenRes.status, '):', tokenData);

        if (!tokenRes.ok) {
          console.error('❌ Błąd walidacji w /google-get-token:', tokenData);
          toast.error('Błąd podczas pobierania tokenu Google');
          return router.push('/sign-in');
        }

        const authHeader = tokenRes.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
          console.error('❌ Brak nagłówka Authorization');
          toast.error('Nieprawidłowy token Google');
          return router.push('/sign-in');
        }

        localStorage.setItem('token', token);
        localStorage.setItem('userId', tokenData.userId);
        localStorage.setItem('userEmail', tokenData.email);
        toast.success('Zalogowano przez Google!');
        router.push('/');
      } catch (err) {
        console.error('💥 Google login error:', err);
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
