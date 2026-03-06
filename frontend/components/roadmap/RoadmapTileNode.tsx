'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { Handle, Position, useStore } from '@xyflow/react';

type NodeTone = 'main' | 'cream' | 'neutral';

type StoreConnection = {
  from?: { nodeId?: string | null } | null;
  source?: string | null;
};

export type RoadmapNodeData = {
  phase: string;
  title: string;
  timeline: string;
  summary: string;
  tone?: NodeTone;
  width?: number;
  height?: number;
};

type Props = {
  id: string;
  data: RoadmapNodeData;
  selected?: boolean;
};

const toneClasses: Record<NodeTone, string> = {
  main: 'bg-white',
  cream: 'bg-white',
  neutral: 'bg-white',
};

const handleBase = '!h-3 !w-3 !border-2 !border-[#11162f] !bg-white';

const handleHidden = 'opacity-0 scale-75 pointer-events-none';

const handleVisible = 'opacity-100 scale-100 pointer-events-auto';

const handleAnim = 'transition-all duration-150 ease-out';

const handlePos = {
  left: { left: -7, top: '50%', transform: 'translateY(-50%)' },
  right: { right: -7, top: '50%', transform: 'translateY(-50%)' },
  top: { top: -7, left: '50%', transform: 'translateX(-50%)' },
  bottom: { bottom: -7, left: '50%', transform: 'translateX(-50%)' },
} as const;

export const RoadmapTileNode: FC<Props> = ({ id, data, selected }) => {
  const tone = data.tone ?? 'cream';
  const [isHovered, setIsHovered] = useState(false);

  const storeConnection = useStore((s) => s.connection as StoreConnection | null);
  const connectionNodeId = useStore(
    (s) => (s as unknown as { connectionNodeId?: string | null }).connectionNodeId ?? null
  );

  const isConnecting = Boolean(storeConnection) || Boolean(connectionNodeId);

  // kto jest “source” podczas łączenia
  const fromNodeId =
    storeConnection?.from?.nodeId ?? storeConnection?.source ?? connectionNodeId ?? null;

  const isSourceNode = isConnecting && fromNodeId === id;

  /**
   * Wymagania:
   * - domyślnie ukryte
   * - pokazuj na klikniętym nodzie
   * - podczas connect: pokazuj na "drugim" dopiero gdy dojedziesz (hover)
   */
  const shouldShowHandles =
    Boolean(selected) || // kliknięty node
    Boolean(isSourceNode) || // node, z którego ciągniesz połączenie
    (Boolean(isConnecting) && Boolean(isHovered) && !isSourceNode); // docelowy node dopiero po najechaniu

  const handleClassName = `${handleBase} ${handleAnim} ${
    shouldShowHandles ? handleVisible : handleHidden
  }`;

  return (
    <div
      className={[
        'relative rounded-xl border border-l-6 border-[#11162f] px-4 py-3',
        'text-[#11162f] shadow-none',
        'flex items-center gap-3',
        toneClasses[tone],
        selected ? 'ring-4 ring-sky-500/40' : '',
      ].join(' ')}
      style={{
        width: data.width,
        minHeight: data.height,
      }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* TARGETS (wejścia) */}
      <Handle
        id="t-left"
        type="target"
        position={Position.Left}
        className={handleClassName}
        style={handlePos.left}
      />
      <Handle
        id="t-right"
        type="target"
        position={Position.Right}
        className={handleClassName}
        style={handlePos.right}
      />
      <Handle
        id="t-top"
        type="target"
        position={Position.Top}
        className={handleClassName}
        style={handlePos.top}
      />
      <Handle
        id="t-bottom"
        type="target"
        position={Position.Bottom}
        className={handleClassName}
        style={handlePos.bottom}
      />

      {/* SOURCES (wyjścia) */}
      <Handle
        id="s-left"
        type="source"
        position={Position.Left}
        className={handleClassName}
        style={handlePos.left}
      />
      <Handle
        id="s-right"
        type="source"
        position={Position.Right}
        className={handleClassName}
        style={handlePos.right}
      />
      <Handle
        id="s-top"
        type="source"
        position={Position.Top}
        className={handleClassName}
        style={handlePos.top}
      />
      <Handle
        id="s-bottom"
        type="source"
        position={Position.Bottom}
        className={handleClassName}
        style={handlePos.bottom}
      />

      <div className="min-w-0 flex-1 text-center">
        <div className="font-poppins overflow-hidden text-[18px] leading-tight font-semibold text-ellipsis whitespace-nowrap">
          {data.title}
        </div>

        {(data.phase || data.timeline) && (
          <div className="mt-1 flex flex-wrap justify-center gap-x-2 text-[13px] font-semibold text-slate-800/75">
            {data.phase ? <span className="tracking-[0.14em] uppercase">{data.phase}</span> : null}
            {data.timeline ? <span>{data.timeline}</span> : null}
          </div>
        )}
      </div>
    </div>
  );
};
