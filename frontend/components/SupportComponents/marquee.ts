import { gsap } from 'gsap';

interface MarqueeConfig {
  repeat?: number;
  speed?: number;
  paddingRight?: number;
}

export function setupMarqueeAnimation(): gsap.core.Timeline | null {
  const marqueeItems = gsap.utils.toArray<HTMLElement>('.marquee h1');

  if (marqueeItems.length > 0) {
    const tl = horizontalLoop(marqueeItems, {
      repeat: -1,
      paddingRight: 30,
    });
    return tl;
  }

  return null;
}

function horizontalLoop(
  items: HTMLElement[] | string,
  config: MarqueeConfig = {}
): gsap.core.Timeline {
  const itemsArray = gsap.utils.toArray<HTMLElement>(items);

  const tl = gsap.timeline({
    repeat: config.repeat || 0,
    defaults: { ease: 'none' },
  });

  const length = itemsArray.length;
  const startX = itemsArray[0].offsetLeft;
  const widths: number[] = [];
  const xPercents: number[] = [];
  const pixelsPerSecond = (config.speed || 1) * 100;

  let curX: number;
  let distanceToStart: number;
  let distanceToLoop: number;
  let item: HTMLElement;

  // Set initial xPercent values
  gsap.set(itemsArray, {
    xPercent: (i: number, el: HTMLElement) => {
      const w = parseFloat(gsap.getProperty(el, 'width', 'px') as string);
      widths[i] = w;

      const xValue = parseFloat(gsap.getProperty(el, 'x', 'px') as string);
      const xPercentValue = gsap.getProperty(el, 'xPercent') as number;

      xPercents[i] = (xValue / w) * 100 + xPercentValue;
      return xPercents[i];
    },
  });

  // Reset x position
  gsap.set(itemsArray, { x: 0 });

  // Calculate total width
  const lastItem = itemsArray[length - 1];
  const lastItemScaleX = gsap.getProperty(lastItem, 'scaleX') as number;

  const totalWidth =
    lastItem.offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    lastItem.offsetWidth * lastItemScaleX +
    parseFloat(config.paddingRight?.toString() || '0');

  // Create animation for each item
  for (let i = 0; i < length; i++) {
    item = itemsArray[i];
    curX = (xPercents[i] / 100) * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop = distanceToStart + widths[i] * (gsap.getProperty(item, 'scaleX') as number);

    tl.to(
      item,
      {
        xPercent: ((curX - distanceToLoop) / widths[i]) * 100,
        duration: distanceToLoop / pixelsPerSecond,
      },
      0
    ).fromTo(
      item,
      {
        xPercent: ((curX - distanceToLoop + totalWidth) / widths[i]) * 100,
      },
      {
        xPercent: xPercents[i],
        duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
        immediateRender: false,
      },
      distanceToLoop / pixelsPerSecond
    );
  }

  // Initialize timeline
  tl.progress(1, true).progress(0, true);

  return tl;
}
