import { type CSSProperties, type KeyboardEvent, useId } from 'react';

import { cn } from '@/lib/utils';

import { productFeatures } from './data';
import styles from './product-showcase.module.css';
import Squircle, { TAB_NECK } from './Squircle';

type Props = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

const CHROME = 'var(--showcase-card)';

export default function ProductShowcaseTabs({ activeIndex, onSelect }: Props) {
  // Referenced from CSS url(), so keep only characters that never need escaping.
  const gooId = `tour-goo-${useId().replace(/[^\w-]/g, '')}`;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = productFeatures.length - 1;
    const nextIndex = {
      ArrowRight: (index + 1) % productFeatures.length,
      ArrowLeft: (index + lastIndex) % productFeatures.length,
      Home: 0,
      End: lastIndex,
    }[event.key];

    if (nextIndex === undefined) return;
    event.preventDefault();
    const tabs =
      event.currentTarget.parentElement?.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]'
      );
    tabs?.[nextIndex].focus({ preventScroll: true });
    onSelect(nextIndex);
  };

  return (
    <div
      role="tablist"
      aria-label="Poznaj możliwości Vocare"
      className={cn(
        styles.tabs,
        'relative mx-auto flex w-fit max-w-full items-end justify-center gap-1.75 px-2 sm:gap-2 sm:px-3'
      )}
      data-tour-tabs
    >
      {productFeatures.map(({ id, label, icon: Icon, colors }, index) => (
        <div key={id} className="relative z-10">
          <button
            type="button"
            role="tab"
            id={`tour-tab-${id}`}
            aria-label={label}
            aria-controls={`tour-panel-${id}`}
            aria-selected={index === activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => onSelect(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            style={{ '--tab-accent': colors.accent } as CSSProperties}
            className={cn(
              styles.tab,
              'relative grid size-12 cursor-pointer place-items-center sm:size-14'
            )}
          >
            <span aria-hidden="true" className="absolute inset-0">
              <Squircle fill={CHROME} />
              <span className={styles.tabConnector} style={{ filter: `url(#${gooId})` }}>
                <Squircle fill={CHROME} />
                <svg
                  viewBox="0 0 32 14"
                  preserveAspectRatio="none"
                  className="absolute top-full left-1/2 h-3.5 w-8 -translate-x-1/2"
                >
                  <path d={TAB_NECK} fill={CHROME} />
                </svg>
                <span className="absolute top-[calc(100%+14px)] left-1/2 h-12 w-8 -translate-x-1/2 bg-(--showcase-card)" />
              </span>
            </span>
            <span aria-hidden="true" className="absolute inset-[7.15%]">
              <Squircle fill="currentColor" className={styles.tabFill} />
            </span>
            <Icon
              aria-hidden="true"
              strokeWidth={2.25}
              className={cn(styles.tabGlyph, 'relative size-5.5 sm:size-6.5')}
            />
          </button>
        </div>
      ))}
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0">
        <defs>
          <filter id={gooId} x="-20%" y="-50%" width="140%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
            <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
