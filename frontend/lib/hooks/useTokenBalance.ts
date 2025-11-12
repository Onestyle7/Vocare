import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const subscriptionStatusMap: Record<number, string> = {
  0: 'None',
  1: 'Active',
  2: 'Trialing',
  3: 'Canceled',
  4: 'PastDue',
};

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export const useTokenBalance = () => {
  const [tokenBalance, setTokenBalance] = useState<number | string>(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Dodajemy stan dla aktualnego tokena autoryzacji
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Śledzenie tokena autoryzacji
  useEffect(() => {
    // Funkcja do pobrania aktualnego tokena
    const getAuthToken = () => {
      const token = localStorage.getItem('token');
      setAuthToken(token);
    };

    // Pobiera token przy inicjalizacji
    getAuthToken();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        getAuthToken();
      }
    };

    // Czeka na zmiany w localStorage
    window.addEventListener('storage', handleStorageChange);

    // Interwał czasowy aby dodatkowo sprawdzał zmiany w ilości tokenów
    const intervalCheck = setInterval(getAuthToken, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalCheck);
    };
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      // Użycie aktualnego tokena ze stanu zamiast pobierać go ponownie
      const token = authToken || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}api/Billing/access-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = response.data;
      let parsedBalance: number | string = '?';
      let parsedStatus: string | null = null;

      if (typeof data === 'object' && data !== null) {
        const rawBalance =
          'tokenBalance' in data
            ? (data as Record<string, unknown>).tokenBalance
            : 'balance' in data
              ? (data as Record<string, unknown>).balance
              : 'tokens' in data
                ? (data as Record<string, unknown>).tokens
                : null;

        if (typeof rawBalance === 'number') parsedBalance = rawBalance;
        else if (typeof rawBalance === 'string' && rawBalance.trim() !== '') {
          const numeric = Number(rawBalance);
          parsedBalance = Number.isFinite(numeric) ? numeric : rawBalance;
        } else if (rawBalance !== null) {
          parsedBalance = rawBalance as string;
        }

        const rawStatus = (data as Record<string, unknown>).subscriptionStatus;
        if (typeof rawStatus === 'number') {
          parsedStatus = subscriptionStatusMap[rawStatus] ?? null;
        } else if (typeof rawStatus === 'string' && rawStatus.trim() !== '') {
          parsedStatus = rawStatus;
        }
      } else {
        parsedBalance = data;
      }

      setTokenBalance(parsedBalance);
      setSubscriptionStatus(parsedStatus);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch token balance');
      setSubscriptionStatus(null);
      setTokenBalance('?');
    } finally {
      setIsLoading(false);
    }
  }, [authToken]); // authToken jako -> zależność

  // Odpalany jest fetchBalance, gdy zmieni się token autoryzacji
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, authToken]);

  // Funkcję refreshu dla integracji z komponentami
  const refresh = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  const hasActiveSubscription = useMemo(() => {
    if (!subscriptionStatus) return false;
    return ACTIVE_STATUSES.has(subscriptionStatus.toLowerCase());
  }, [subscriptionStatus]);

  return {
    tokenBalance,
    subscriptionStatus,
    hasActiveSubscription,
    isLoading,
    error,
    refresh,
  };
};
