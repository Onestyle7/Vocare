'use client';

import type { FC } from 'react';

import type { RoadmapNodeData } from '@/components/roadmap/RoadmapTileNode';

type Props = {
  data: RoadmapNodeData;
  selected?: boolean;
};

export const RoadmapNoteNode: FC<Props> = ({ data, selected }) => {
  return (
    <div
      className={[
        'rounded-2xl border border-[#dbc779] bg-[#fff1ad] px-4 py-4 text-[#4d3f14] shadow-[0_18px_30px_-24px_rgba(120,91,17,0.45)]',
        selected ? 'ring-4 ring-amber-400/25' : '',
      ].join(' ')}
      style={{
        width: data.width,
        minHeight: data.height,
      }}
    >
      <div className="text-[10px] font-semibold tracking-[0.22em] text-[#876707] uppercase">
        Notatka
      </div>
      <div className="font-poppins mt-2 break-words text-[16px] leading-snug font-semibold">
        {data.title || 'Nowa notatka'}
      </div>
      {data.summary ? (
        <div className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-5 text-[#5a4c21]">
          {data.summary}
        </div>
      ) : null}
    </div>
  );
};
