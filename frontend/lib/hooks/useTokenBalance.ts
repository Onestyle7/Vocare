import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useTokenBalance = () => {
  const [tokenBalance, setTokenBalance] = useState<number | string>(0);
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
      const response = await axios.get(`${API_URL}/api/Billing/get-token-balance`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = response.data;
      if (typeof data === 'object') {
        if ('tokenBalance' in data) setTokenBalance(data.tokenBalance);
        else if ('balance' in data) setTokenBalance(data.balance);
        else if ('tokens' in data) setTokenBalance(data.tokens);
        else {
          console.log('Unexpected format:', data);
          setTokenBalance('?');
        }
      } else {
        setTokenBalance(data);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch token balance');
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

  return { tokenBalance, isLoading, error, refresh };
};
