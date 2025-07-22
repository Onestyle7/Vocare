'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyGoogleToken } from '@/lib/auth';
import { toast } from 'sonner';

const GoogleCallback = () => {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : '';
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    if (!token) {
      toast.error('Google login failed');
      router.replace('/sign-in');
      return;
    }
    verifyGoogleToken(token)
      .then(() => {
        toast.success('Login successful');
        router.replace('/');
      })
      .catch(() => {
        toast.error('Google login failed');
        router.replace('/sign-in');
      });
  }, [router]);

  return <p className="p-4">Processing Google login...</p>;
};

export default GoogleCallback;
