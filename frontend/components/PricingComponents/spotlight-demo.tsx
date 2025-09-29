'use client';
import React from 'react';
import { Spotlight, GridBackground } from '@/components/blocks/spotlight-new';

export function SpotlightNewDemo() {
  return (
    <div className="bg-grid-white/[0.02] relative flex h-[40rem] w-full overflow-hidden rounded-md bg-black/[0.96] antialiased md:items-center md:justify-center">
      <GridBackground />
      <Spotlight />
      <div className="relative z-10 mx-auto w-full max-w-7xl p-4 pt-20 md:pt-0">
        <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-4xl font-bold text-transparent md:text-7xl">
          Spotlight <br /> which is not overused.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-base font-normal text-neutral-300">
          A subtle yet effective spotlight effect, because the previous version is used a bit too
          much these days.
        </p>
      </div>
    </div>
  );
}
