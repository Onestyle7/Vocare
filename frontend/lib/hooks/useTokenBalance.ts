import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'https://localhost:5001';

export const useTokenBalance = () => {
  const [tokenBalance, setTokenBalance] = useState<number | string>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

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
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Optional: auto-refresh every 60s
  // useEffect(() => {
  //   const interval = setInterval(fetchBalance, 60000);
  //   return () => clearInterval(interval);
  // }, [fetchBalance]);

  return { tokenBalance, isLoading, error, refresh: fetchBalance };
};
