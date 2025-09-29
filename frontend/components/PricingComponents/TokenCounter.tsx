import { useTokenBalanceContext } from '@/lib/contexts/TokenBalanceContext';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const TokenCounter = () => {
  const { tokenBalance, isLoading, error } = useTokenBalanceContext();

  return (
    <Link href="/pricing">
      <div className="group text-md relative flex flex-row items-center gap-4 rounded-full border px-4 py-2 transition hover:cursor-pointer xl:mr-8">
        <div className="flex items-center">
          Tokens:
          <span className="font-poppins ml-2 font-semibold text-[#915EFF]">
            {isLoading ? '...' : error ? '0' : String(tokenBalance)}
          </span>
        </div>
        <div className="absolute -right-8 hidden h-8 w-8 items-center justify-center rounded-full border border-[#915EFF] opacity-0 transition-all duration-300 group-hover:right-[-2.5rem] group-hover:opacity-100 xl:flex">
          <Plus
            className="text-[#915EFF] transition-transform duration-300 group-hover:rotate-90"
            size={14}
          />
        </div>
      </div>
    </Link>
  );
};
