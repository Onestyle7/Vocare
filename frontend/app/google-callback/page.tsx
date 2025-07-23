'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const GoogleCallbackPage = () => {
  const router = useRouter();
  
  useEffect(() => {
    const fetchGoogleLogin = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const googleLogin = urlParams.get('googleLogin');
      const userId = urlParams.get('userId');

      if (googleLogin !== 'success' || !userId) {
        toast.error('Błędny callback z Google');
        return router.push('/sign-in');
      }

      try {
        const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Auth/google-get-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!tokenRes.ok) {
          toast.error('Błąd podczas pobierania tokenu Google');
          return router.push('/sign-in');
        }

        const authHeader = tokenRes.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        const data = await tokenRes.json();

        if (!token) {
          toast.error('Brak tokenu w odpowiedzi');
          return router.push('/sign-in');
        }

        localStorage.setItem('token', token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', data.email);
        toast.success('Zalogowano przez Google!');
        router.push('/');
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