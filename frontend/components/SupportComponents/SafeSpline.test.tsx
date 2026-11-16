import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SafeSpline } from '@/components/SupportComponents/SafeSpline';

const spline = vi.hoisted(() => ({ fail: false, imported: vi.fn() }));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span data-testid="spinner">{alt}</span>,
}));

vi.mock('@splinetool/react-spline', () => {
  spline.imported();
  return {
    default: function SplineScene() {
      // Spline's real failure: no WebGL context although the check passed
      if (spline.fail) throw new Error('Error creating WebGL context.');
      return <div data-testid="scene">scene</div>;
    },
  };
});

const fakeWebGLContext = { getExtension: () => ({ loseContext: vi.fn() }) };

const renderOnPage = () =>
  render(
    <main>
      <h1>Zaloguj się</h1>
      <SafeSpline scene="https://example.test/scene.splinecode" />
    </main>
  );

describe('SafeSpline', () => {
  beforeEach(() => {
    spline.fail = false;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // React also reports errors caught by a boundary
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the scene when the browser has WebGL', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeWebGLContext as unknown as RenderingContext
    );

    renderOnPage();

    expect(await screen.findByTestId('scene')).toBeTruthy();
  });

  it('skips the scene without WebGL and keeps the rest of the page', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    renderOnPage();

    await waitFor(() => expect(screen.queryByTestId('spinner')).toBeNull());
    expect(screen.queryByTestId('scene')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Zaloguj się' })).toBeTruthy();
  });

  it('keeps the page when the scene fails anyway, instead of the app error page', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeWebGLContext as unknown as RenderingContext
    );
    spline.fail = true;

    renderOnPage();

    await waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(screen.queryByTestId('scene')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Zaloguj się' })).toBeTruthy();
  });
});
