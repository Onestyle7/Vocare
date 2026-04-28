'use client';

import { useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';
import type { FC, MouseEvent } from 'react';

import type { NoteThemeId, RoadmapNodeData } from '@/components/roadmap/RoadmapTileNode';

type Props = {
  id: string;
  data: RoadmapNodeData;
  selected?: boolean;
};

type NoteThemeStyles = {
  surface: string;
  surfaceSoft: string;
  border: string;
  text: string;
  body: string;
  pill: string;
  icon: string;
  shadow: string;
};

const noteThemes: Record<NoteThemeId, NoteThemeStyles> = {
  rose: {
    surface: 'bg-[#f7d6da]',
    surfaceSoft: 'bg-[#f9dfe2]',
    border: 'border-[#efc2c8]',
    text: 'text-[#a3171b]',
    body: 'text-[#b0282c]',
    pill: 'bg-[#f2b9bf] text-[#b1161b]',
    icon: 'text-[#b1161b]',
    shadow: 'shadow-[0_20px_34px_-28px_rgba(156,36,42,0.45)]',
  },
  amber: {
    surface: 'bg-[#f4da96]',
    surfaceSoft: 'bg-[#f7e2aa]',
    border: 'border-[#ebcf81]',
    text: 'text-[#9a6511]',
    body: 'text-[#a26e18]',
    pill: 'bg-[#efcf7c] text-[#99600a]',
    icon: 'text-[#99600a]',
    shadow: 'shadow-[0_20px_34px_-28px_rgba(143,99,18,0.45)]',
  },
  mint: {
    surface: 'bg-[#b8ebb8]',
    surfaceSoft: 'bg-[#c7f1c6]',
    border: 'border-[#a7dca7]',
    text: 'text-[#129553]',
    body: 'text-[#1a9b58]',
    pill: 'bg-[#a3e3a4] text-[#168d4c]',
    icon: 'text-[#168d4c]',
    shadow: 'shadow-[0_20px_34px_-28px_rgba(26,125,71,0.42)]',
  },
  sky: {
    surface: 'bg-[#a9e5f3]',
    surfaceSoft: 'bg-[#b8ebf6]',
    border: 'border-[#96d7e8]',
    text: 'text-[#2e5f9e]',
    body: 'text-[#3568a9]',
    pill: 'bg-[#9fd9eb] text-[#325e97]',
    icon: 'text-[#325e97]',
    shadow: 'shadow-[0_20px_34px_-28px_rgba(48,98,149,0.4)]',
  },
};

export const RoadmapNoteNode: FC<Props> = ({ id, data, selected }) => {
  const { deleteElements } = useReactFlow();
  const theme = noteThemes[data.noteTheme ?? 'rose'];
  const rotation = data.noteRotation ?? -1.8;

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void deleteElements({
      nodes: [{ id }],
    });
  };

  return (
    <div
      className="relative px-2 py-2"
      style={{
        width: data.width,
        minHeight: data.height,
      }}
    >
      <article
        className={[
          'relative min-h-full overflow-hidden rounded-[22px] border backdrop-blur-[0.2px]',
          theme.surface,
          theme.border,
          theme.shadow,
          selected ? 'ring-4 ring-black/10' : '',
        ].join(' ')}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className={['absolute inset-0 opacity-55', theme.surfaceSoft].join(' ')} aria-hidden />

        <div
          className={[
            'relative flex items-center justify-between gap-3 border-b px-4 py-3',
            theme.border,
          ].join(' ')}
        >
          <div
            className={['font-poppins truncate text-[13px] font-semibold', theme.text].join(' ')}
          >
            {data.title || 'Nowa notatka'}
          </div>

          <div className="flex items-center gap-2">
            <div className={['h-5 w-px opacity-35', theme.border].join(' ')} />
            <button
              type="button"
              aria-label="Usuń notatkę"
              className={[
                'nodrag nopan inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                'hover:bg-white/30',
                theme.icon,
              ].join(' ')}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={handleDelete}
            >
              <X className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>

        <div className="relative px-4 py-4">
          <div
            className={[
              'font-poppins break-words whitespace-pre-wrap',
              data.summary.trim().length > 52
                ? 'text-[26px] leading-[1.12] font-medium'
                : 'text-[20px] leading-[1.18] font-medium',
              theme.body,
            ].join(' ')}
          >
            {data.summary || 'Dodaj treść notatki.'}
          </div>
        </div>
      </article>
    </div>
  );
};
