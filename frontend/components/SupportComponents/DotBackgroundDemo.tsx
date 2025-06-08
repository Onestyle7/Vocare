import { cn } from '@/lib/utils';
import React from 'react';

export function DotBackgroundDemo() {
  return (
    <div className="relative flex h-[50rem] w-full items-center justify-center">
      <div
        className={cn(
          'absolute inset-0',
          '[background-size:20px_20px]',
          '[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]',
          'dark:[background-image:radial-gradient(#dec9a7_1px,transparent_1px)]'
        )}
      />
    </div>
  );
}
