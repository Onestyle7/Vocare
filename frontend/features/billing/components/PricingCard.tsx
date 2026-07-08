import { Undo2 } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { pricingPlans } from '../constants';
import { BillingType } from '../dal/api';

type PricingPlanType = (typeof pricingPlans)[number];

interface PricingCardProps {
  plan: PricingPlanType;
  onSelect: (priceId: string, type: BillingType) => void;
  isPending: boolean;
  icon: string;
}

export function PricingCard({ plan, onSelect, isPending, icon }: PricingCardProps) {
  const isPopular = plan.popular;

  const wrapperClasses = isPopular
    ? 'relative rounded-[28px] bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] px-1 pt-16 pb-1'
    : 'relative z-30 flex h-full flex-col justify-between rounded-3xl border bg-[linear-gradient(to_top_right,rgba(9,13,22,1)_20%,rgba(9,13,22,0.2)_100%)] p-6 backdrop-blur-md sm:h-[87%] dark:border-gray-500/40';

  const innerCardClasses = isPopular
    ? 'relative z-30 flex flex-col justify-between rounded-3xl border p-6 backdrop-blur-md dark:border-gray-500/40 dark:bg-[#090d16]'
    : '';

  return (
    <div className={wrapperClasses}>
      {isPopular && (
        <div className="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
          <Undo2 className="h-5 w-5 -rotate-90 text-white" />
          <span className="text-lg font-semibold text-white">Best Deal</span>
        </div>
      )}

      <div className={innerCardClasses}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-white/25 via-white/10 to-transparent dark:from-white/10 dark:via-white/5"
        />

        <div className="relative">
          <div className="relative flex w-full flex-row items-start justify-between">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border bg-white/20 shadow-xl backdrop-blur-md dark:bg-white/10">
              <Image
                src={icon}
                alt="icon"
                width={32}
                height={32}
                className={plan.type === 'individual' ? 'scale-80' : ''}
              />
            </div>

            {plan.save && (
              <div className="font-grotesk flex h-8 w-fit items-center justify-center rounded-full bg-[#818fff] px-4 py-2 text-xs font-semibold text-white">
                <p>Oszczędź {plan.save}</p>
              </div>
            )}
          </div>

          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {plan.name}
          </h3>
          <p className="font-grotesk mb-4 text-gray-700 dark:text-gray-300">{plan.description}</p>

          <div className="font-grotesk mb-6 text-4xl font-bold text-gray-900 dark:text-white">
            {plan.price}
            <sup className="align-super text-sm">zł</sup>
            <span className="text-xl font-normal text-gray-600 dark:text-gray-300">
              {plan.type === 'tokens'
                ? '/500 tokenów'
                : plan.type === 'subscription'
                  ? '/miesiąc'
                  : ''}
            </span>
          </div>

          <ul className="mb-6 space-y-3 text-gray-900 dark:text-gray-100">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5 text-[#915EFF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Button
          className={cn(
            'relative mt-auto h-12 w-full rounded-full font-bold',
            isPopular
              ? 'bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] text-white'
              : ''
          )}
          variant={isPopular ? 'default' : 'outline'}
          onClick={() => onSelect(plan.priceId, plan.type as BillingType)}
          disabled={isPending}
        >
          {plan.type === 'tokens'
            ? 'Wybierz plan'
            : plan.type === 'subscription'
              ? 'Zasubskrybuj'
              : 'Skontaktuj się'}
        </Button>
      </div>
    </div>
  );
}
