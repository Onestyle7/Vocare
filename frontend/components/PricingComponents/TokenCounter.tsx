import { useTokenBalanceContext } from '@/lib/contexts/TokenBalanceContext';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const TokenCounter = () => {
  const {
    tokenBalance,
    subscriptionStatus, // np. 'active' | 'canceled' | ...
    hasActiveSubscription, // boolean
    isLoading,
    error,
  } = useTokenBalanceContext();

  const displayBalance = isLoading ? '...' : error ? '0' : String(tokenBalance ?? '0');
  const isSubscribed = !!hasActiveSubscription && !isLoading;
  const statusLabel = isLoading ? '...' : isSubscribed ? 'PRO' : 'FREE';

  return (
    <Link href="/pricing" className="block xl:mr-8">
      <div className="group relative mx-auto flex w-fit flex-col items-center">
        {/* Górny „badge” z tokenami */}
        <div className="text-md flex items-center gap-4 rounded-full border border-[#1f2026] bg-[#0f1014] px-5 py-2 transition hover:cursor-pointer hover:border-[#2a2b33]">
          <div className="flex items-center">
            Tokens:
            <span className="font-poppins ml-2 font-semibold text-[#915EFF]">{displayBalance}</span>
          </div>

          <div className="absolute -right-8 hidden h-8 w-8 items-center justify-center rounded-full border border-[#915EFF] opacity-0 transition-all duration-300 group-hover:right-[-2.5rem] group-hover:opacity-100 xl:flex">
            <Plus
              className="text-[#915EFF] transition-transform duration-300 group-hover:rotate-90"
              size={14}
            />
          </div>
        </div>

        {/* Pasek statusu subskrypcji – zawsze równy, bez nachodzenia */}
        <div
          className={`-z-10 -mt-[10px] flex h-9 w-[85%] items-center justify-center rounded-b-2xl border border-t-0 bg-[#12131a] text-xs font-semibold tracking-wider uppercase ${isSubscribed ? 'text-[#915EFF]' : 'text-gray-400'} `}
        >
          <p className="mt-2">{statusLabel}</p>
        </div>

        {/* A11y: szczegółowy status dla screen readerów */}
        {subscriptionStatus && !isLoading && (
          <span className="sr-only">Subscription status: {subscriptionStatus}</span>
        )}
      </div>
    </Link>
  );
};
