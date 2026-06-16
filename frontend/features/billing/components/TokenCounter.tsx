import { cva, type VariantProps } from 'class-variance-authority';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { useTokenBalanceContext } from '@/features/billing/components/SubscriptionTokenProvider';
import { cn } from '@/lib/utils';

const tokenBoxVariants = cva(
  'flex items-center rounded-full border border-[#1f2026] bg-[#0f1014] transition hover:cursor-pointer hover:border-[#2a2b33]',
  {
    variants: {
      size: {
        default: 'text-md gap-4 px-5 py-2',
        small: 'gap-2 px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const badgeVariants = cva(
  '-z-10 flex items-center justify-center rounded-b-2xl border border-t-0 bg-[#12131a] font-semibold tracking-wider uppercase',
  {
    variants: {
      size: {
        default: '-mt-2.5 h-9 w-[85%] text-xs',
        small: '-mt-2 h-6 w-[75%] text-[12px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

interface TokenCounterProps extends VariantProps<typeof tokenBoxVariants> {
  showAnimation?: boolean;
}

export const TokenCounter = ({
  showAnimation = true,
  size,
  className,
}: TokenCounterProps & React.ComponentProps<'a'>) => {
  const { tokenBalance, subscriptionStatus } = useTokenBalanceContext();

  const displayBalance = String(tokenBalance ?? '0');
  const isSubscribed = subscriptionStatus === 'Active' || subscriptionStatus === 'Trialing';
  const statusLabel = isSubscribed ? 'PRO' : 'FREE';

  return (
    <Link href="/pricing" className={cn('block', showAnimation && 'xl:mr-8', className)}>
      <div className="group relative mx-auto flex w-fit flex-col items-center">
        <div className={cn(tokenBoxVariants({ size }))}>
          <div className="flex items-center">
            Tokeny:
            <span className="font-poppins ml-2 font-semibold text-[#915EFF]">{displayBalance}</span>
          </div>
          {showAnimation && (
            <div className="absolute -right-8 hidden h-8 w-8 items-center justify-center rounded-full border border-[#915EFF] opacity-0 transition-all duration-300 group-hover:-right-10 group-hover:opacity-100 xl:flex">
              <Plus
                className="text-[#915EFF] transition-transform duration-300 group-hover:rotate-90"
                size={14}
              />
            </div>
          )}
        </div>

        <div
          className={cn(badgeVariants({ size }), isSubscribed ? 'text-[#915EFF]' : 'text-gray-400')}
        >
          <p className={cn(size === 'small' ? 'mt-1' : 'mt-2')}>{statusLabel}</p>
        </div>

        {subscriptionStatus && (
          <span className="sr-only">Subscription status: {subscriptionStatus}</span>
        )}
      </div>
    </Link>
  );
};
