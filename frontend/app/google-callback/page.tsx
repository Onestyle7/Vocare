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
      const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

      console.log('📦 URL Params:', urlParams.toString());
      console.log('🔑 Google code:', code);
      console.log('🌐 Redirect URI (from env):', redirectUri);

      if (!code) {
        toast.error('Brak kodu logowania Google');
        return router.push('/sign-in');
      }

      try {
        const payload = {
          code,
          redirectUri,
        };

        console.log('📤 Wysyłam kod do backendu (POST /google-get-token):', payload);

        const tokenRes = await fetch('http://localhost:8080/api/Auth/google-get-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const tokenData = await tokenRes.json();

        console.log('📥 Odpowiedź z /google-get-token (status', tokenRes.status, '):', tokenData);

        if (!tokenRes.ok) {
          console.error('❌ Błąd walidacji w /google-get-token:', tokenData);
          toast.error('Błąd podczas pobierania tokenu Google');
          return router.push('/sign-in');
        }

        if (!tokenData.success || !tokenData.accessToken) {
          console.warn('⚠️ Brak sukcesu lub accessToken:', tokenData);
          toast.error('Nieprawidłowy token Google');
          return router.push('/sign-in');
        }

        const accessToken = tokenData.accessToken;

        console.log('🔐 Weryfikuję accessToken (POST /google-verify):', { accessToken });

        const verifyRes = await fetch('http://localhost:8080/api/Auth/google-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });

        const result = await verifyRes.json();

        console.log('📥 Odpowiedź z /google-verify (status', verifyRes.status, '):', result);

        if (!verifyRes.ok) {
          console.error('❌ Weryfikacja tokenu Google nie powiodła się:', result);
          toast.error(result.message || 'Błąd weryfikacji tokenu Google');
          return router.push('/sign-in');
        }

        if (result.success && result.token) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('userId', result.userId);
          localStorage.setItem('userEmail', result.email);
          toast.success('Zalogowano przez Google!');
          return router.push('/');
        } else {
          console.warn('⚠️ Nieudana weryfikacja konta Google:', result);
          toast.error(result.message || 'Logowanie nieudane');
          return router.push('/sign-in');
        }
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
