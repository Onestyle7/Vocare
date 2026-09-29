import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

import { type ProductFeature, productFeatures } from './data';
import Squircle from './Squircle';

type Props = { feature: ProductFeature; step: number };

// Features are constants, so a tab change never re-renders the copy.
function ProductShowcaseContent({ feature, step }: Props) {
  return (
    <div
      data-tour-copy
      className="flex w-full min-w-0 flex-col items-start gap-4 md:gap-5 lg:w-80 lg:gap-6"
    >
      <div className="flex w-full flex-col items-start gap-4 md:gap-5 lg:gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex h-6 items-center gap-1 text-base leading-none font-medium whitespace-nowrap">
            <span className="relative grid size-6 shrink-0 place-items-center">
              <Squircle fill={feature.colors.accent} />
              <feature.icon aria-hidden="true" strokeWidth={2.5} className="relative size-3.5" />
            </span>
            {feature.eyebrow}
          </p>
          <span className="rounded-[4px] bg-(--showcase-ink)/5 px-1.5 py-0.5 text-xs leading-[1.4] font-medium text-[#3d464e]">
            Krok {step} z {productFeatures.length}
          </span>
        </div>
        <div className="flex w-full flex-col items-start gap-3 md:gap-4">
          <h3 className="text-2xl leading-[1.1] font-medium text-balance md:text-[28px] md:tracking-[-1px] lg:text-4xl">
            {feature.title}
          </h3>
          <p className="text-sm leading-[1.4] text-(--showcase-muted) md:text-base">
            {feature.description}
          </p>
        </div>
      </div>
      <Link
        href={feature.href}
        className="inline-flex items-center gap-2 border-b-[1.5px] border-current px-[1.5px] pt-[9.5px] pb-2 text-sm leading-[1.4] font-medium transition-colors duration-150 hover:text-(--feature-ink) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--showcase-focus)"
      >
        {feature.cta}
        <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}

export default memo(ProductShowcaseContent);
