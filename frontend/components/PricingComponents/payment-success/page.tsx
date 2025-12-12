'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { buildApiUrl } from '@/lib/config';

const PaymentSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pobierz aktualny stan tokenów
    const fetchTokenBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/sign-in');
          return;
        }

        const response = await fetch(buildApiUrl('/api/Billing/get-token-balance'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTokenBalance(data.tokenBalance);
        }
      } catch (error) {
        console.error('Failed to fetch token balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenBalance();

    // Wyczyść informację o pending purchase
    sessionStorage.removeItem('pendingPurchase');

    // Pokaż toast z sukcesem
    toast.success('Payment successful!', {
      description: 'Your tokens have been added to your account.',
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="mb-4 text-3xl font-bold">Payment Successful!</h1>

          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Thank you for your purchase. Your tokens have been added to your account.
          </p>

          {!loading && tokenBalance !== null && (
            <div className="mb-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold text-[#915EFF]">{tokenBalance} tokens</p>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard')} className="w-full" size="lg">
              Go to Dashboard
            </Button>

            <Button onClick={() => router.push('/')} variant="outline" className="w-full" size="lg">
              Back to Home
            </Button>
          </div>
        </div>

        {/* Informacje o fakturze */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>A receipt has been sent to your email address.</p>
          <p className="mt-2">Session ID: {searchParams.get('session_id')?.slice(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
