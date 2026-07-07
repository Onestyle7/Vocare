'use client';

import type { FC } from 'react';

import type { RoadmapNodeData } from '@/features/roadmap/components/RoadmapTileNode';

type Props = {
  data: RoadmapNodeData;
  selected?: boolean;
};

export const RoadmapFreeTextNode: FC<Props> = ({ data, selected }) => {
  return (
    <div
      className={[
        'rounded-xl px-2 py-1 text-[#11162f]',
        selected ? 'ring-4 ring-sky-500/25' : '',
      ].join(' ')}
      style={{
        width: data.width,
        minHeight: data.height,
      }}
    >
      <div className="font-poppins text-[24px] leading-[1.15] font-semibold break-words whitespace-pre-wrap text-[#11162f]/88">
        {data.title || 'Nowy tekst'}
      </div>
    </div>
  );
};
