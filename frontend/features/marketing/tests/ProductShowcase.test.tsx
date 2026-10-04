import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cv,
  market,
  persona,
  recommendation,
  roadmap,
} from '@/app/(marketing)/main-components/product-showcase/persona';
import ProductShowcase from '@/app/(marketing)/main-components/product-showcase/ProductShowcase';
import {
  EDGE_SCROLL,
  FEATURE_SCROLL,
} from '@/app/(marketing)/main-components/product-showcase/useProductShowcase';

vi.mock('@/app/(marketing)/main-components/product-showcase/product-showcase.module.css', () => ({
  default: {},
}));

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    }
  );
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') || query.includes('max-width'),
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal('scrollTo', vi.fn());
  // jsdom has no 2D canvas; the backdrop simply stays its fallback color.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  // jsdom has no media playback.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// Viewport that fits the whole stage: the pinned, expanding tour is active.
const renderTour = () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('min-width: 768px'),
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
  vi.stubGlobal('innerHeight', 1000);
  vi.stubGlobal('scrollTo', (_x: number, y: number) => {
    vi.stubGlobal('pageYOffset', y);
    vi.stubGlobal('scrollY', y);
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1168);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(700);
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1440);

  const view = render(<ProductShowcase />);
  const pin = ScrollTrigger.getById('product-showcase')!;
  const scrollPin = (position: number) =>
    act(() => {
      pin.scroll(position);
      ScrollTrigger.update();
    });
  const featureAt = (index: number) => pin.start + EDGE_SCROLL + index * FEATURE_SCROLL;
  // jsdom lays everything out at 0, so start just above the pin like a visitor arriving,
  // with the collapse settled instantly.
  scrollPin(pin.start - 10);
  act(() => ScrollTrigger.refresh());
  return { ...view, pin, scrollPin, featureAt };
};

describe('ProductShowcase', () => {
  it('renders real product examples and the initial selection on the server', () => {
    const html = renderToString(<ProductShowcase />);

    // Every feature is a video; screen readers get what each one shows.
    expect(html).toContain('Główna rekomendacja');
    expect(html).toContain('Progresja wynagrodzeń');
    expect(html).toContain('Kurs HubSpot CRM (ukończono)');
    expect(html).toContain('wynik ogólny 86/100');
    for (const poster of ['doradca-kariery', 'analiza-rynku', 'roadmapa', 'kreator-cv']) {
      expect(html).toContain(`/videos/${poster}-poster.webp`);
    }
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html.match(/aria-hidden="false"/g)).toHaveLength(1);
  });

  it("follows one user's path from the recommendation to the CV", () => {
    const html = renderToString(<ProductShowcase />);

    for (const role of [market.careerName, roadmap.careerPathName, cv.targetPosition]) {
      expect(role).toBe(recommendation.primaryPath);
    }
    // What the market analysis says she lacks is what her CV finally lists.
    expect(cv.skills).toEqual(expect.arrayContaining(market.entryDifficulty.missingSkills));
    // She is named across the story, in any grammatical case (Marta, Marty, Martę).
    const stem = persona.firstName.slice(0, -1);
    expect(html.match(new RegExp(`${stem}[aęy]`, 'g'))?.length).toBeGreaterThanOrEqual(4);
  });

  it('supports arrow keys, wraparound, Home and End without exposing inactive panels', () => {
    render(<ProductShowcase />);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();

    for (const [key, index] of [
      ['ArrowLeft', 3],
      ['ArrowRight', 0],
      ['ArrowRight', 1],
      ['End', 3],
      ['Home', 0],
    ] as const) {
      fireEvent.keyDown(document.activeElement!, { key });

      expect(document.activeElement).toBe(tabs[index]);
      expect(tabs[index].getAttribute('aria-selected')).toBe('true');
      expect(tabs.filter((tab) => tab.tabIndex === 0)).toEqual([tabs[index]]);
      const panel = screen.getByRole('tabpanel');
      expect(panel.id).toBe(tabs[index].getAttribute('aria-controls'));
      expect(panel.getAttribute('aria-labelledby')).toBe(tabs[index].id);
      expect(panel.hasAttribute('inert')).toBe(false);
      expect(
        screen.getAllByRole('tabpanel', { hidden: true }).filter((el) => el.hasAttribute('inert'))
      ).toHaveLength(3);
    }
  });

  it('plays each walkthrough from the start whenever its tab is shown', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
    const { container } = render(<ProductShowcase />);
    const advisor = container.querySelector<HTMLVideoElement>('#tour-panel-direction video')!;
    const market = container.querySelector<HTMLVideoElement>('#tour-panel-market video')!;
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    const pause = vi.mocked(HTMLMediaElement.prototype.pause);
    expect(advisor.getAttribute('poster')).toContain('doradca-kariery-poster');
    expect(market.getAttribute('poster')).toContain('analiza-rynku-poster');
    expect(market.getAttribute('aria-hidden')).toBe('true');
    play.mockClear();
    pause.mockClear();

    fireEvent.click(screen.getByRole('tab', { name: 'Rynek' }));
    expect(play.mock.contexts).toEqual([market]);
    expect(pause.mock.contexts).toContain(advisor);
    expect(market.currentTime).toBe(0);

    play.mockClear();
    fireEvent.click(screen.getByRole('tab', { name: 'Kierunek' }));
    expect(play.mock.contexts).toEqual([advisor]);
    expect(pause.mock.contexts).toContain(market);

    // Each video is described for screen readers by what it shows.
    expect(container.querySelector('#tour-panel-direction')!.textContent).toContain(
      'Customer Success Manager'
    );
    expect(container.querySelector('#tour-panel-market')!.textContent).toContain(
      'Wynagrodzenia od 6 500 do 20 000 PLN'
    );
  });

  it('never plays the walkthrough in reduced motion', () => {
    render(<ProductShowcase />);
    fireEvent.click(screen.getByRole('tab', { name: 'Rynek' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Kierunek' }));

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it('shows a complete preview immediately without pinning in reduced motion', () => {
    const { container, unmount } = render(<ProductShowcase />);
    fireEvent.click(screen.getByRole('tab', { name: 'Rynek' }));

    expect(screen.getByRole('tabpanel').textContent).toContain('Progresja wynagrodzeń');
    expect(screen.getByRole('link', { name: 'Zobacz analizę rynku' }).getAttribute('href')).toBe(
      '/market-analysis'
    );
    expect(container.querySelector('.pin-spacer')).toBeNull();
    expect(container.querySelector('[data-tour-pinned="true"]')).toBeNull();
    expect(ScrollTrigger.getById('product-showcase')).toBeUndefined();
    expect(screen.queryByRole('button', { name: /Zamknij prezentację/ })).toBeNull();
    unmount();
    expect(ScrollTrigger.getById('product-showcase')).toBeUndefined();
  });

  it('keeps wheel and touch scrolling native at both ends and throughout the desktop tour', () => {
    const { pin, scrollPin, unmount } = renderTour();
    expect(pin).toBeDefined();

    for (const progress of [0, 0.01, 0.34, 0.67, 0.99, 1]) {
      scrollPin(pin.start + progress * (pin.end - pin.start));
      for (const deltaY of [60, 60, -60, -60]) {
        const wheel = new WheelEvent('wheel', { deltaY, cancelable: true, bubbles: true });
        fireEvent(window, wheel);
        expect(wheel.defaultPrevented).toBe(false);
      }
      const touchMove = new Event('touchmove', { cancelable: true, bubbles: true });
      fireEvent(window, touchMove);
      expect(touchMove.defaultPrevented).toBe(false);
    }
    unmount();
    expect(ScrollTrigger.getById('product-showcase')).toBeUndefined();
  });

  it('expands the stage and offers the close button only while the tour is pinned', () => {
    const { container, pin, scrollPin } = renderTour();
    const section = container.querySelector('section')!;
    const backdrop = container.querySelector<HTMLElement>('[data-tour-backdrop]')!;
    const closeButton = () => screen.queryByRole('button', { name: /Zamknij prezentację/ });
    // Settle the expand animation instantly, as a resize would.
    const settle = () => act(() => ScrollTrigger.refresh());

    expect(section.dataset.tourPinned).toBe('true');
    expect(closeButton()).toBeNull();

    scrollPin(pin.start + EDGE_SCROLL);
    expect(section.dataset.tourExpanded).toBe('true');
    settle();
    // Viewport 1440x1000 minus the 24px gap, centered on the 1168x700 stage.
    expect(backdrop.style.width).toBe('1392px');
    expect(backdrop.style.height).toBe('952px');
    expect(backdrop.style.left).toBe('-112px');
    expect(backdrop.style.top).toBe('-126px');
    expect(closeButton()).not.toBeNull();

    scrollPin(pin.start - 10);
    settle();
    expect(section.dataset.tourExpanded).toBeUndefined();
    expect(backdrop.style.width).toBe('1168px');
    expect(backdrop.style.left).toBe('0px');
    expect(closeButton()).toBeNull();
  });

  it('walks through all four features with continuous native scroll, both ways', () => {
    const { pin, scrollPin, featureAt } = renderTour();
    const selected = () => screen.getByRole('tab', { selected: true }).getAttribute('aria-label');
    const visited = (from: number, to: number) => {
      const labels: string[] = [];
      const step = Math.sign(to - from) * 40;
      for (let position = from; step > 0 ? position <= to : position >= to; position += step) {
        scrollPin(position);
        if (labels.at(-1) !== selected()) labels.push(selected()!);
      }
      return labels;
    };

    expect(pin.vars.snap).toBeUndefined();
    expect(visited(pin.start, pin.end - 1)).toEqual(['Kierunek', 'Rynek', 'Plan', 'CV']);
    expect(visited(pin.end - 1, pin.start + 1)).toEqual(['CV', 'Plan', 'Rynek', 'Kierunek']);

    // Each feature owns FEATURE_SCROLL; a boundary switches only once clearly crossed.
    scrollPin(featureAt(1) + FEATURE_SCROLL * 0.45);
    expect(selected()).toBe('Rynek');
    scrollPin(featureAt(1) + FEATURE_SCROLL * 0.65);
    expect(selected()).toBe('Plan');
    scrollPin(featureAt(1) + FEATURE_SCROLL * 0.55);
    expect(selected()).toBe('Plan');
    scrollPin(featureAt(1) + FEATURE_SCROLL * 0.35);
    expect(selected()).toBe('Rynek');
  });

  it('scrolls a clicked tab and the close button to their positions', () => {
    const { pin, featureAt } = renderTour();
    const scrollTo = vi.spyOn(gsap, 'to');

    fireEvent.click(screen.getByRole('tab', { name: 'Plan' }));
    expect(screen.getByRole('tab', { selected: true }).getAttribute('aria-label')).toBe('Plan');
    expect(scrollTo).toHaveBeenLastCalledWith(
      window,
      expect.objectContaining({ scrollTo: expect.objectContaining({ y: featureAt(2) }) })
    );

    act(() => {
      pin.scroll(featureAt(2));
      ScrollTrigger.update();
    });
    fireEvent.click(screen.getByLabelText(/Zamknij prezentację/));
    expect(scrollTo).toHaveBeenLastCalledWith(
      window,
      expect.objectContaining({ scrollTo: expect.objectContaining({ y: pin.end + 1 }) })
    );
  });
});
