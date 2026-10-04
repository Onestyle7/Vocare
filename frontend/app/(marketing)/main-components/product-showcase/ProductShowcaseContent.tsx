import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

import { type ProductFeature, productFeatures } from './data';
import Squircle from './Squircle';

type Props = { feature: ProductFeature; step: number };

// Features are constants, so a tab change never re-renders the copy.
function ProductShowcaseContent({ feature, step }: Props) {
  // Same treatment as the Hero and Features headings: light text with a gradient highlight.
  const [before, after] = feature.title.split(feature.highlight);

  return (
    <div
      data-tour-copy
      className="flex w-full min-w-0 flex-col items-start gap-4 md:gap-5 lg:w-80 lg:gap-6"
    >
      <div className="flex w-full flex-col items-start gap-4 md:gap-5 lg:gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex h-6 items-center gap-1.5 text-base leading-none font-medium whitespace-nowrap">
            <span className="relative grid size-6 shrink-0 place-items-center text-[#0F1013]">
              <Squircle fill={feature.colors.accent} />
              <feature.icon aria-hidden="true" strokeWidth={2.5} className="relative size-3.5" />
            </span>
            {feature.eyebrow}
          </p>
          <span className="rounded-[5px] border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs leading-[1.4] text-(--showcase-muted)">
            Krok {step} z {productFeatures.length}
          </span>
        </div>
        <div className="flex w-full flex-col items-start gap-3 md:gap-4">
          <h3 className="text-2xl leading-[1.12] font-light text-balance md:text-[28px] lg:text-4xl">
            {before && <span className="opacity-[0.79]">{before}</span>}
            <span className="bg-[linear-gradient(180deg,var(--feature-accent)_0%,var(--feature-light)_100%)] [box-decoration-break:clone] bg-clip-text font-normal text-transparent">
              {feature.highlight}
            </span>
            {after && <span className="opacity-[0.79]">{after}</span>}
          </h3>
          <p className="text-sm leading-normal font-light text-(--showcase-muted) md:text-base">
            {feature.description}
          </p>
        </div>
      </div>
      <Link
        href={feature.href}
        className="inline-flex items-center gap-2 border-b border-white/30 px-px pt-2.5 pb-2 text-sm leading-[1.4] font-medium transition-colors duration-150 hover:border-(--feature-light) hover:text-(--feature-light) focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--showcase-focus)"
      >
        {feature.cta}
        <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}

export default memo(ProductShowcaseContent);
