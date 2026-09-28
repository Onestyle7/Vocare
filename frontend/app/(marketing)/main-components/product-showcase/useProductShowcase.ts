'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, useState } from 'react';

import { paintBackdrop } from './backdrop';
import { productFeatures } from './data';

const FEATURE_COUNT = productFeatures.length;
// Native scroll that belongs to one feature while the stage is expanded: a short swipe or
// a flick of the wheel (calendly.com uses 600px, which drags on a mouse wheel).
export const FEATURE_SCROLL = 480;
// Each feature owns FEATURE_SCROLL centered on its position, so the first and last features
// also get their full share between the pin's edges.
export const EDGE_SCROLL = FEATURE_SCROLL / 2;
// Past a boundary by this share of FEATURE_SCROLL before switching; hovering on it never flickers.
const SWITCH_HYSTERESIS = 0.1;
const EXPAND_DURATION = 0.5;
const TOUR_MIN_WIDTH = 768;
// Margin between the expanded stage and the viewport edges; shrinks on short viewports.
const TOUR_GAP = 24;
const TOUR_MIN_GAP = 8;

type Box = { left: number; top: number; width: number; height: number };

export function useProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const selectRef = useRef<(index: number) => void>(() => {});
  const closeRef = useRef<() => void>(() => {});
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
      const find = (selector: string) => section.querySelector<HTMLElement>(selector)!;
      const stage = find('[data-tour-stage]');
      const veil = find('[data-tour-veil]');
      const backdrop = find('[data-tour-backdrop]');
      const track = find('[data-tour-track]') as HTMLCanvasElement;
      const content = find('[data-tour-content]');
      const close = find('[data-tour-close]');
      const panels = gsap.utils.toArray<HTMLElement>('[data-tour-panel]', section);
      const tabs = gsap.utils.toArray<HTMLButtonElement>('[role="tab"]', section);
      let media: gsap.MatchMedia | undefined;
      let minimumHeight = 0;
      let resizeFrame = 0;
      // Measured from the content: the pin gives the stage itself a fixed, rounded height.
      const getMinimumHeight = () => {
        const { paddingTop, paddingBottom } = getComputedStyle(stage);
        const padding = (parseFloat(paddingTop) || 0) + (parseFloat(paddingBottom) || 0);
        return Math.ceil(content.offsetHeight + padding + TOUR_MIN_GAP * 2);
      };
      const getTrackOffset = (index: number) => (-100 * index) / FEATURE_COUNT;

      // Once painted, the backdrop has nothing of its own to repaint while it resizes.
      if (paintBackdrop(track)) backdrop.dataset.painted = 'true';

      const configureMedia = () => {
        media?.revert();
        media = gsap.matchMedia();
        minimumHeight = getMinimumHeight();
        media.add(
          {
            tour: `(min-width: ${TOUR_MIN_WIDTH}px) and (min-height: ${minimumHeight}px)`,
            compact: `(max-width: ${TOUR_MIN_WIDTH - 1}px), (max-height: ${minimumHeight - 1}px)`,
            reduced: '(prefers-reduced-motion: reduce)',
          },
          (mediaContext) => {
            const reduced = Boolean(mediaContext.conditions?.reduced);
            let transition: gsap.core.Timeline | undefined;
            let preview: gsap.core.Timeline | undefined;
            let trackTween: gsap.core.Tween | undefined;
            let expandTween: gsap.core.Timeline | undefined;
            let scrollTween: gsap.core.Tween | undefined;
            let isNavigating = false;
            let pin: ScrollTrigger | undefined;

            gsap.set(track, { xPercent: getTrackOffset(activeRef.current) });
            // Hidden also removes it from the tab order and the accessibility tree.
            gsap.set(close, { autoAlpha: 0 });

            // Bind callbacks to this media context, not its parent useGSAP context.
            // That also reverts event-created animations when a media query changes.
            const revealPreview = mediaContext.add('revealPreview', (index: number) => {
              preview?.kill();
              if (reduced) return;
              const panel = panels[index];
              preview = gsap
                .timeline({ defaults: { ease: 'power2.out' } })
                .fromTo(
                  panel.querySelectorAll('[data-tour-reveal]'),
                  { opacity: 0, y: 6 },
                  { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 },
                  0.1
                );
              const bars = panel.querySelectorAll('[data-tour-bar]');
              if (bars.length) {
                preview.fromTo(
                  bars,
                  { scaleX: 0 },
                  { scaleX: 1, duration: 0.7, stagger: 0.1 },
                  0.2
                );
              }
            });

            const activate = mediaContext.add('activate', (index: number) => {
              if (index === activeRef.current) return;
              const previous = panels[activeRef.current];
              const next = panels[index];
              transition?.kill();
              preview?.kill();
              trackTween?.kill();

              // Never leave keyboard focus inside a panel that is becoming inert.
              if (previous.contains(document.activeElement)) {
                tabs[index].focus({ preventScroll: true });
              }
              activeRef.current = index;
              setActiveIndex(index); // Only a feature boundary changes React state.

              const inactive = panels.filter((panel) => panel !== previous && panel !== next);
              gsap.set(inactive, { autoAlpha: 0 });
              if (reduced) {
                gsap.set(previous, { autoAlpha: 0 });
                gsap.set(next, { autoAlpha: 1 });
                gsap.set(track, { xPercent: getTrackOffset(index) });
                return;
              }

              trackTween = gsap.to(track, {
                xPercent: getTrackOffset(index),
                duration: 0.8,
                ease: 'power2.inOut',
              });
              transition = gsap
                .timeline({ defaults: { ease: 'power1.inOut' } })
                .to(previous, { autoAlpha: 0, duration: 0.2 }, 0)
                .fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.12);
              revealPreview(index);
            });

            selectRef.current = (index) => activate(index);

            if (!reduced) {
              gsap
                .timeline({
                  defaults: { ease: 'power2.out' },
                  scrollTrigger: { trigger: stage, start: 'top 85%', once: true },
                  onStart: () => revealPreview(activeRef.current),
                })
                .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.8 })
                .fromTo(
                  section.querySelector('[data-tour-card]'),
                  { opacity: 0, y: 24 },
                  { opacity: 1, y: 0, duration: 0.7 },
                  0.08
                )
                .fromTo(
                  section.querySelector('[data-tour-tabs]'),
                  { opacity: 0, y: 10 },
                  { opacity: 1, y: 0, duration: 0.5 },
                  0.22
                );
            }

            // The tour needs the whole stage on screen; otherwise the tabs alone switch features.
            if (mediaContext.conditions?.tour && !reduced) {
              section.dataset.tourPinned = 'true';
              let compact: Box = { left: 0, top: 0, width: 0, height: 0 };
              let expanded = compact;
              let contentShift = 0;

              // Both boxes are relative to the stage, which the pin keeps centered on the
              // viewport: the backdrop grows from the stage to the viewport minus the gap.
              const measure = () => {
                const viewportWidth = document.documentElement.clientWidth;
                const viewportHeight = window.innerHeight;
                const stageWidth = stage.offsetWidth;
                const stageHeight = stage.offsetHeight;
                const gap = gsap.utils.clamp(
                  TOUR_MIN_GAP,
                  TOUR_GAP,
                  (viewportHeight - stageHeight) / 2
                );
                const { paddingTop, paddingBottom } = getComputedStyle(stage);

                compact = { left: 0, top: 0, width: stageWidth, height: stageHeight };
                expanded = {
                  left: gap - (viewportWidth - stageWidth) / 2,
                  top: gap - (viewportHeight - stageHeight) / 2,
                  width: viewportWidth - gap * 2,
                  height: viewportHeight - gap * 2,
                };
                // Stage padding is taller at the bottom; center the content in the viewport.
                contentShift =
                  ((parseFloat(paddingBottom) || 0) - (parseFloat(paddingTop) || 0)) / 2;
                gsap.set(veil, {
                  left: (stageWidth - viewportWidth) / 2,
                  top: (stageHeight - viewportHeight) / 2,
                  width: viewportWidth,
                  height: viewportHeight,
                  right: 'auto',
                  bottom: 'auto',
                });
              };

              // Like calendly.com, the backdrop's own box grows: its rounded overflow clip
              // over the canvas layer stays cheap, and the color field stretches with it.
              const expand = mediaContext.add(
                'expand',
                (isExpanded: boolean, duration = EXPAND_DURATION) => {
                  expandTween?.kill();
                  if (isExpanded) section.dataset.tourExpanded = 'true';
                  const settle = () => {
                    if (!isExpanded) delete section.dataset.tourExpanded;
                  };
                  const vars = {
                    backdrop: {
                      ...(isExpanded ? expanded : compact),
                      right: 'auto',
                      bottom: 'auto',
                    },
                    content: { y: isExpanded ? contentShift : 0 },
                    overlay: { autoAlpha: isExpanded ? 1 : 0 },
                  };

                  if (!duration) {
                    gsap.set(backdrop, vars.backdrop);
                    gsap.set(content, vars.content);
                    gsap.set([veil, close], vars.overlay);
                    settle();
                    return;
                  }

                  expandTween = gsap
                    .timeline({
                      defaults: { duration, ease: 'power3.inOut' },
                      onComplete: settle,
                    })
                    .to(backdrop, vars.backdrop, 0)
                    .to(content, vars.content, 0)
                    .to(veil, vars.overlay, 0)
                    .to(
                      close,
                      { ...vars.overlay, duration: duration * 0.6 },
                      isExpanded ? duration * 0.4 : 0
                    );
                }
              );

              // Direction-aware rounding: a boundary is crossed only once the page is clearly
              // past it, so resting on it never flickers between two features.
              const getFeatureIndex = (self: ScrollTrigger) => {
                const position = (self.scroll() - self.start - EDGE_SCROLL) / FEATURE_SCROLL;
                const index =
                  self.direction < 0
                    ? Math.ceil(position - 0.5 + SWITCH_HYSTERESIS)
                    : Math.floor(position + 0.5 - SWITCH_HYSTERESIS);
                return gsap.utils.clamp(0, FEATURE_COUNT - 1, index);
              };

              pin = ScrollTrigger.create({
                id: 'product-showcase',
                trigger: stage,
                start: 'center center',
                end: () => `+=${EDGE_SCROLL * 2 + (FEATURE_COUNT - 1) * FEATURE_SCROLL}`,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onRefresh: (self) => {
                  measure();
                  expand(self.isActive, 0);
                },
                onToggle: (self) => expand(self.isActive),
                onUpdate: (self) => {
                  // All input stays native: scroll position walks through the features, and
                  // crossing either end of the pin releases the page immediately.
                  if (!isNavigating) activate(getFeatureIndex(self));
                },
              });

              const scrollPageTo = (y: number, duration: number, onDone?: () => void) => {
                scrollTween?.kill();
                isNavigating = true;
                const finish = () => {
                  if (!isNavigating) return;
                  isNavigating = false;
                  onDone?.();
                };
                scrollTween = gsap.to(window, {
                  scrollTo: { y, autoKill: true },
                  duration,
                  ease: 'power2.inOut',
                  onComplete: finish,
                  onInterrupt: finish,
                });
              };

              // Like calendly.com, a tab always scrolls to its feature, which also pins the stage.
              const navigate = mediaContext.add('navigate', (index: number) => {
                if (!pin) return;
                activate(index);
                scrollPageTo(pin.start + EDGE_SCROLL + index * FEATURE_SCROLL, 0.6, () => {
                  if (pin?.isActive) activate(getFeatureIndex(pin));
                });
              });
              selectRef.current = (index) => navigate(index);

              // Like calendly.com, closing skips the rest of the tour to the next section.
              const skipTour = mediaContext.add('skipTour', () => {
                if (!pin) return;
                const next = section.nextElementSibling;
                const target = next
                  ? next.getBoundingClientRect().top + window.scrollY
                  : pin.end + 1;
                if (close.contains(document.activeElement)) close.blur();
                scrollPageTo(target, 0.9);
              });
              closeRef.current = () => skipTour();
            }

            return () => {
              selectRef.current = () => {};
              closeRef.current = () => {};
              isNavigating = false;
              scrollTween?.kill();
              transition?.kill();
              preview?.kill();
              trackTween?.kill();
              expandTween?.kill();
              delete section.dataset.tourPinned;
              delete section.dataset.tourExpanded;
              // Interrupted transitions can restore an earlier tween's intermediate styles.
              // Reset only our animated properties before reduced motion or a new layout.
              mediaContext.ignore(() => {
                gsap.set(
                  section.querySelectorAll(
                    '[data-tour-panel], [data-tour-reveal], [data-tour-bar], [data-tour-card], [data-tour-tabs]'
                  ),
                  { clearProps: 'transform,opacity,visibility' }
                );
                gsap.set([veil, backdrop, content], { clearProps: 'all' });
              });
            };
          }
        );
      };

      configureMedia();
      // Recalculate the fit query when wrapping/fonts change the actual content size, and
      // re-measure the pin when the page settles to another width than the pin was made at
      // (other sections can widen the page while loading). matchMedia handles viewport changes.
      let sectionWidth = section.clientWidth;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        if (section.clientWidth !== sectionWidth) {
          sectionWidth = section.clientWidth;
          resizeFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
        } else if (getMinimumHeight() !== minimumHeight) {
          resizeFrame = requestAnimationFrame(configureMedia);
        }
      });
      observer.observe(content);
      observer.observe(section);

      return () => {
        observer.disconnect();
        cancelAnimationFrame(resizeFrame);
        media?.revert();
      };
    },
    { scope: sectionRef }
  );

  return {
    sectionRef,
    activeIndex,
    selectFeature: (index: number) => selectRef.current(index),
    closeTour: () => closeRef.current(),
  };
}
