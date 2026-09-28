'use client';

import { X } from 'lucide-react';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

import { BACKDROP_HEIGHT, BACKDROP_WIDTH } from './backdrop';
import { productFeatures } from './data';
import styles from './product-showcase.module.css';
import ProductShowcaseContent from './ProductShowcaseContent';
import ProductShowcasePreview from './ProductShowcasePreview';
import ProductShowcaseTabs from './ProductShowcaseTabs';
import { useProductShowcase } from './useProductShowcase';

export default function ProductShowcase() {
  const { sectionRef, activeIndex, selectFeature, closeTour } = useProductShowcase();

  return (
    <section
      ref={sectionRef}
      id="product-showcase"
      aria-labelledby="product-showcase-title"
      className={cn(styles.section, 'font-poppins px-4 py-12 sm:px-8 sm:py-16 lg:py-20')}
    >
      <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
        <p className="mb-3 text-[11px] font-medium tracking-[0.18em] text-[#9296FD] uppercase sm:text-xs">
          Poznaj swoje miejsce w Vocare
        </p>
        <h2
          id="product-showcase-title"
          className="text-[26px] leading-[1.15] font-light text-balance text-[#F1F4FF] sm:text-[34px] lg:text-[40px]"
        >
          Od pierwszego pytania do gotowego CV.
        </h2>
      </div>
      <div
        data-tour-stage
        className="relative mx-auto max-w-300 px-4 py-8 sm:px-7.5 sm:py-10 xl:pt-12 xl:pb-16"
      >
        <div data-tour-veil aria-hidden="true" className={styles.veil} />
        <div data-tour-backdrop className={styles.backdrop}>
          <canvas
            data-tour-track
            aria-hidden="true"
            width={BACKDROP_WIDTH}
            height={BACKDROP_HEIGHT}
            className={styles.track}
            style={{ width: `${productFeatures.length * 100}%` }}
          />
          <button
            type="button"
            data-tour-close
            aria-label="Zamknij prezentację i przewiń dalej"
            onClick={closeTour}
            className={cn(
              styles.close,
              'absolute top-6 right-6 z-20 grid size-12 cursor-pointer place-items-center rounded-xl md:top-10 md:right-10'
            )}
          >
            <X aria-hidden="true" size={24} strokeWidth={2} />
          </button>
        </div>
        <div
          data-tour-content
          className={cn(
            styles.content,
            'relative z-10 mx-auto w-full max-w-85.5 sm:max-w-149 lg:max-w-249'
          )}
        >
          <ProductShowcaseTabs activeIndex={activeIndex} onSelect={selectFeature} />
          <div
            data-tour-card
            className={cn(
              styles.card,
              'relative z-10 mt-3.5 grid rounded-3xl bg-(--showcase-card) p-8 text-(--showcase-ink) sm:p-14 lg:p-16 xl:p-12'
            )}
          >
            {productFeatures.map((feature, index) => (
              <div
                key={feature.id}
                id={`tour-panel-${feature.id}`}
                role="tabpanel"
                aria-labelledby={`tour-tab-${feature.id}`}
                aria-hidden={index !== activeIndex}
                inert={index !== activeIndex}
                tabIndex={index === activeIndex ? 0 : -1}
                data-tour-panel
                style={
                  {
                    '--feature-accent': feature.colors.accent,
                    '--feature-soft': feature.colors.soft,
                    '--feature-tint': feature.colors.tint,
                    '--feature-ink': feature.colors.ink,
                  } as CSSProperties
                }
                className={cn(
                  styles.panel,
                  'grid content-center items-center gap-6 rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-(--showcase-focus) sm:gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[320px_minmax(0,516px)] xl:gap-16',
                  index === activeIndex ? 'visible' : 'invisible'
                )}
              >
                <ProductShowcaseContent feature={feature} />
                <ProductShowcasePreview feature={feature} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-[11px] text-[#F1F4FF]/45">
        Przykładowe dane · Twój wynik zależy od profilu
      </p>
    </section>
  );
}
