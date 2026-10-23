import { Check, LoaderCircle, Undo2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { PricingPlan } from '../types';

interface PricingCardProps {
  plan: PricingPlan;
  onSelect: () => void;
  isPending: boolean;
  href?: string;
  ctaLabel?: string;
}

export function PricingCard({
  plan,
  onSelect,
  isPending,
  href,
  ctaLabel = plan.ctaLabel,
}: PricingCardProps) {
  const headingId = `pricing-${plan.type}-title`;
  const microcopyId = `pricing-${plan.type}-microcopy`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        'font-poppins relative isolate flex min-w-0 flex-col overflow-hidden rounded-[28px]',
        plan.popular
          ? 'self-start bg-[linear-gradient(90deg,#9296FD_0%,#8491FE_50%,#C7A9FE_100%)] p-[3px] lg:col-start-2 lg:row-span-2 lg:row-start-1'
          : 'bg-gray-200 p-[4px] lg:row-start-1 dark:bg-[#2A2D38]',
        plan.type === 'free' && 'lg:col-start-1',
        plan.type === 'tokens' && 'lg:col-start-3'
      )}
    >
      <div
        className={cn(
          'flex flex-col px-5 sm:px-6 xl:px-7',
          plan.popular ? 'gap-3 py-4 sm:py-5' : 'gap-1 py-5 sm:py-6'
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2
            id={headingId}
            className={cn(
              'text-lg font-medium xl:text-[20px]',
              plan.popular ? 'text-[#15162B]' : 'text-gray-900 dark:text-gray-100'
            )}
          >
            {plan.name}
          </h2>
          {plan.popular && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#15162B]/10 px-3 py-1.5 text-xs font-semibold text-[#15162B]">
              <Undo2 aria-hidden className="size-5 shrink-0 -rotate-90" />
              <span>Najczęściej wybierany</span>
            </div>
          )}
        </div>
        {!plan.popular && (
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {plan.description}
          </p>
        )}
      </div>

      <div
        className={cn(
          'relative flex flex-1 flex-col bg-white px-5 py-6 sm:px-6 sm:py-7 xl:px-7 xl:py-8 dark:bg-[#12151E]',
          plan.popular ? 'rounded-[25px]' : 'rounded-[23px]'
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-br from-gray-100/60 to-transparent dark:from-white/5"
        />

        <div className="relative">
          <p className="font-grotesk flex flex-wrap items-baseline gap-x-2 gap-y-1 text-gray-900 dark:text-white">
            <span className="text-4xl font-bold tracking-tight whitespace-nowrap">
              {plan.price.toLocaleString('pl-PL', { maximumFractionDigits: 2 })}{' '}
              <span className="text-xl font-semibold">zł</span>
            </span>
            <span className="text-base text-gray-600 dark:text-gray-300">{plan.priceLabel}</span>
          </p>

          {plan.popular && (
            <p className="mt-4 text-sm leading-relaxed font-semibold text-[#6267CE] dark:text-[#B5B8FF]">
              {plan.description}
            </p>
          )}

          {plan.featuresIntro && (
            <p className="mt-6 text-sm font-medium text-gray-900 dark:text-gray-100">
              {plan.featuresIntro}
            </p>
          )}

          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            {plan.features.map((feature) => (
              <li key={feature.text}>
                <div className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-[#9296FD]" />
                  <span>{feature.text}</span>
                </div>
                {feature.alternative && (
                  <span className="mt-2 ml-6.5 block text-left text-xs leading-5 font-normal text-gray-500 dark:text-gray-400">
                    lub
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* {plan.commitment && (
            <p className="mt-6 text-sm leading-relaxed font-bold text-gray-900 dark:text-gray-100">
              {plan.commitment}
            </p>
          )} */}
        </div>

        <div className="relative mt-auto pt-8">
          <Button
            className={cn(
              'h-auto min-h-12 w-full rounded-full px-4 py-3 text-sm font-semibold whitespace-normal',
              plan.popular &&
                'bg-[linear-gradient(90deg,#9296FD_0%,#8491FE_50%,#C7A9FE_100%)] text-[#15162B] hover:opacity-90'
            )}
            variant={plan.popular ? 'default' : 'outline'}
            aria-describedby={microcopyId}
            aria-busy={!href && isPending}
            {...(href
              ? { asChild: true }
              : { type: 'button', onClick: onSelect, disabled: isPending })}
          >
            {href ? (
              <Link href={href} className="font-medium!">
                {ctaLabel}
              </Link>
            ) : (
              <>
                {isPending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
                {ctaLabel}
              </>
            )}
          </Button>
          <p
            id={microcopyId}
            className={cn(
              'mt-3 text-center text-xs leading-5 text-gray-500 dark:text-gray-400',
              plan.popular && 'lg:min-h-15'
            )}
          >
            {plan.microcopyEmphasis && plan.microcopyEmphasisPosition === 'start' && (
              <>
                <strong className="font-bold">{plan.microcopyEmphasis}</strong>{' '}
              </>
            )}
            {plan.microcopy}
            {plan.microcopyEmphasis && plan.microcopyEmphasisPosition !== 'start' && (
              <>
                {' '}
                <strong className="font-bold">{plan.microcopyEmphasis}</strong>
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
