import { cn } from '@/lib/utils';

import type { BillingPeriod } from '../constants';

interface BillingPeriodSwitchProps {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
}

const OPTIONS: { value: BillingPeriod; label: string; badge?: string }[] = [
  { value: 'monthly', label: 'Miesięcznie' },
  { value: 'quarterly', label: 'Kwartalnie', badge: '-21%' },
];

export function BillingPeriodSwitch({ value, onChange }: BillingPeriodSwitchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Okres rozliczeniowy"
      className="grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1 text-sm font-medium dark:bg-white/10"
    >
      {OPTIONS.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#915EFF] focus-visible:outline-none',
              isSelected
                ? 'bg-white text-gray-900 shadow-sm dark:bg-[#2A2D38] dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            )}
          >
            {option.label}
            {option.badge && (
              <span className="rounded-full bg-[#915EFF]/15 px-1.5 py-0.5 text-xs font-semibold text-[#915EFF] dark:text-[#C7A9FE]">
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
