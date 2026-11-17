'use client';

import Image from 'next/image';
import { Component, lazy, type ReactNode, Suspense, useEffect, useState } from 'react';

import { Spinner } from '@/features/marketing/constants';

const LazySpline = lazy(() => import('@splinetool/react-spline'));

/**
 * Whether the browser can create a WebGL context, which Spline needs. It can't with hardware
 * acceleration turned off, on some older devices and in some locked-down company browsers.
 */
export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    // Browsers allow only a few live contexts, so this test one is released right away
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('3D scene unavailable, showing the page without it.', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface SafeSplineProps {
  scene: string;
  className?: string;
}

/**
 * A Spline scene that is only decoration: without WebGL it isn't loaded at all, and if it still
 * fails, the error stays inside this component. Without that, Spline's "Error creating WebGL
 * context" reached the app's error page and took the whole sign-in page down with it.
 */
export function SafeSpline({ scene, className }: SafeSplineProps) {
  const [webGL, setWebGL] = useState<boolean | null>(null);
  const spinner = <Image src={Spinner} alt="spinner" width={60} height={60} />;

  useEffect(() => {
    setWebGL(canUseWebGL());
  }, []);

  if (webGL === null) return spinner;
  if (!webGL) return null;

  return (
    <SceneErrorBoundary>
      <Suspense fallback={spinner}>
        <LazySpline scene={scene} className={className} />
      </Suspense>
    </SceneErrorBoundary>
  );
}
