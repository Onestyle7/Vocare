'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function GridBackgroundDemo() {
  const [maskPosition, setMaskPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMaskPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    // Fixed and negative z-index so the grid never overlays content
    <div className="pointer-events-none fixed inset-0 -z-10 h-full w-full overflow-hidden">
      <div
        className={cn(
          'absolute inset-0',
          '[background-size:80px_80px]',
          '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
          'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]'
        )}
        style={{
          WebkitMaskImage: `radial-gradient(180px at ${maskPosition.x}px ${maskPosition.y}px, black 0%, transparent 100%)`,
          maskImage: `radial-gradient(180px at ${maskPosition.x}px ${maskPosition.y}px, black 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}
