'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';

interface SubscriptionStatusIndicatorProps {
  className?: string;
  buttonClassName?: string;
  tooltipPosition?: 'top' | 'bottom';
}

const API_BASE = API_BASE_URL;

const SubscriptionStatusIndicator = ({
  className,
  buttonClassName,
  tooltipPosition = 'top',
}: SubscriptionStatusIndicatorProps) => {
  const { isAuthenticated } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !API_BASE) {
      setSubscriptionStatus(null);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setSubscriptionStatus(null);
      return;
    }

    let ignore = false;

    const fetchSubscriptionStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/Billing/subscription-status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            if (!ignore) setSubscriptionStatus('None');
            return;
          }
          throw new Error('Failed to fetch subscription status');
        }

        const data = await res.json();
        if (!ignore) setSubscriptionStatus(data?.subscriptionStatus ?? 'None');
      } catch (error) {
        if (!ignore) {
          console.error('Failed to fetch subscription status:', error);
          setSubscriptionStatus(null);
        }
      }
    };

    void fetchSubscriptionStatus();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const isSubscribed = Boolean(subscriptionStatus && subscriptionStatus !== 'None');

  const toggleTheme = () => {
    if (!mounted) return;
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const tooltipText = !isAuthenticated
    ? 'Sign in to view subscription'
    : isSubscribed
      ? 'Subscription active'
      : 'No active subscription';

  const tooltipPlacementClasses = tooltipPosition === 'top' ? '-top-10' : '-bottom-10';

  return (
    <div className={cn('relative inline-flex', className)}>
      <div className="group relative inline-flex">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={tooltipText}
          title={tooltipText}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 focus:ring-2 focus:ring-[#915EFF]/50 focus:outline-none',
            isSubscribed
              ? 'border-[#915EFF] bg-[#915EFF]/10 text-[#915EFF] hover:bg-[#915EFF]/20'
              : 'border-gray-400 bg-gray-300/30 text-gray-400 hover:bg-gray-400/30 dark:border-gray-600 dark:bg-gray-700/30 dark:text-gray-500',
            buttonClassName
          )}
        >
          <Star
            className="h-5 w-5"
            strokeWidth={isSubscribed ? 0 : 2}
            fill={isSubscribed ? 'currentColor' : 'none'}
            color={isSubscribed ? '#915EFF' : undefined}
          />
        </button>
        <span
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-md bg-black px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow transition-opacity duration-200 group-hover:opacity-100 dark:bg-white dark:text-black',
            tooltipPlacementClasses
          )}
        >
          {tooltipText}
        </span>
      </div>
    </div>
  );
};

export default SubscriptionStatusIndicator;
