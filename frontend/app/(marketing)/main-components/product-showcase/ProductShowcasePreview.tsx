import { memo } from 'react';

import { cn } from '@/lib/utils';

import type { ProductFeature } from './data';
import CareerPreview from './previews/CareerPreview';
import MarketPreview from './previews/MarketPreview';
import ResumePreview from './previews/ResumePreview';
import RoadmapPreview from './previews/RoadmapPreview';
import styles from './product-showcase.module.css';

const previews = {
  direction: CareerPreview,
  market: MarketPreview,
  roadmap: RoadmapPreview,
  resume: ResumePreview,
};

// Features are constants, so a tab change never re-renders the preview.
function ProductShowcasePreview({ feature }: { feature: ProductFeature }) {
  const Preview = previews[feature.id];

  return (
    <div
      role="group"
      aria-label={feature.screen}
      className="relative flex aspect-[278/172.314] w-full min-w-0 items-center justify-center rounded-[20px] bg-(--feature-soft) py-5 sm:aspect-484/300 lg:aspect-516/333"
    >
      <div aria-hidden="true" className={styles.ghosts}>
        <span className={cn(styles.ghost, styles.ghostFar, styles.ghostLeft)} />
        <span className={cn(styles.ghost, styles.ghostLeft)} />
        <span className={cn(styles.ghost, styles.ghostRight)} />
        <span className={cn(styles.ghost, styles.ghostFar, styles.ghostRight)} />
      </div>
      <div
        data-tour-visual
        className="@container relative w-[calc(100%-2rem)] max-w-110 rounded-[14px] bg-white p-4 shadow-[0_1px_2px_rgb(7_26_49/0.06),0_14px_32px_-12px_rgb(7_26_49/0.28)] sm:p-5"
      >
        <Preview />
      </div>
    </div>
  );
}

export default memo(ProductShowcasePreview);
