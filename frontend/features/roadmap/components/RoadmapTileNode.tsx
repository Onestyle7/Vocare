'use client';

import { Handle, Position, useStore } from '@xyflow/react';
import type { FC } from 'react';
import { useState } from 'react';

import type { RoadmapPhaseStepMeta, StepStatus, StepType } from '@/lib/types/roadmap';

type NodeTone = 'main' | 'cream' | 'neutral';
export type NoteThemeId = 'rose' | 'amber' | 'mint' | 'sky';
export type RoadmapNodeKind = 'phase' | 'step' | 'text' | 'note';

type StoreConnection = {
  from?: { nodeId?: string | null } | null;
  source?: string | null;
};

export type RoadmapNodeData = {
  phase: string;
  title: string;
  timeline: string;
  summary: string;
  parentStepId?: string | null;
  stepOrderIndex?: number;
  subtitle?: string;
  description?: string;
  topics?: string[];
  tone?: NodeTone;
  width?: number;
  height?: number;
  noteTheme?: NoteThemeId;
  noteRotation?: number;
  nodeKind?: RoadmapNodeKind;
  phaseTitle?: string;
  timeLabel?: string;
  timeStartMonth?: number;
  timeEndMonth?: number;
  totalMonths?: number;
  stepType?: StepType;
  stepStatus?: StepStatus;
  phaseStepCount?: number;
  phaseRequiredCount?: number;
  phaseOptionalCount?: number;
  phaseSteps?: RoadmapPhaseStepMeta[];
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

const stepStatusBorderClassNames = {
  NotStarted: 'border-slate-300 border-l-slate-500',
  InProgress: 'border-amber-300 border-l-amber-500',
  Completed: 'border-emerald-300 border-l-emerald-500',
} as const;

const isPhaseComplete = (phaseSteps?: RoadmapPhaseStepMeta[]) => {
  if (!phaseSteps?.length) return false;

  const requiredSteps = phaseSteps.filter((step) => step.stepType === 'Required');
  if (!requiredSteps.length) return false;

  return requiredSteps.every((step) => step.status === 'Completed');
};

const handleBase = 'overflow-visible !h-3 !w-3 !border-0 !bg-transparent';

const handleHidden = 'pointer-events-none';

const handleVisible = 'pointer-events-auto';

const handleAnim = 'transition-all duration-150 ease-out';

const handleIndicatorBase =
  'absolute block h-3 w-3 rounded-full border-2 border-[#11162f] bg-white';

const handleIndicatorPos = {
  left: 'right-[calc(100%+12px)] top-1/2 -translate-y-1/2',
  right: 'left-[calc(100%+8px)] top-1/2 -translate-y-1/2',
  top: 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2',
  bottom: 'top-[calc(100%+8px)] left-1/2 -translate-x-1/2',
} as const;

const handleIndicatorHidden = 'opacity-0 scale-75';

const handleIndicatorVisible = 'opacity-100 scale-100';

const handlePos = {
  left: { left: 0, top: '50%', transform: 'translate(0, -50%)' },
  right: { right: 0, top: '50%', transform: 'translate(0, -50%)' },
  top: { top: 0, left: '50%', transform: 'translate(-50%, 0)' },
  bottom: { bottom: 0, left: '50%', transform: 'translate(-50%, 0)' },
} as const;

export const RoadmapTileNode: FC<Props> = ({ id, data, selected }) => {
  const tone = data.tone ?? 'cream';
  const resolvedStepStatus = data.nodeKind === 'step' ? (data.stepStatus ?? 'NotStarted') : null;
  const resolvedPhaseStatus =
    data.nodeKind === 'phase' && isPhaseComplete(data.phaseSteps) ? 'Completed' : null;
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

  const handleIndicatorClassName = `${handleIndicatorBase} ${handleAnim} ${
    shouldShowHandles ? handleIndicatorVisible : handleIndicatorHidden
  }`;
  const resolvedStatus: StepStatus | null = resolvedStepStatus ?? resolvedPhaseStatus;
  const statusBorderClassName = resolvedStatus
    ? stepStatusBorderClassNames[resolvedStatus]
    : 'border-[#11162f]';

  return (
    <div
      className={[
        'relative cursor-pointer rounded-xl border border-l-6 px-4 py-3',
        'text-[#11162f] shadow-none',
        'flex items-center gap-3 transition-shadow hover:shadow-[0_18px_40px_-32px_rgba(17,22,47,0.42)]',
        toneClasses[tone],
        statusBorderClassName,
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
      >
        <span aria-hidden className={`${handleIndicatorClassName} ${handleIndicatorPos.left}`} />
      </Handle>
      <Handle
        id="t-right"
        type="target"
        position={Position.Right}
        className={handleClassName}
        style={handlePos.right}
      >
        <span aria-hidden className={`${handleIndicatorClassName} ${handleIndicatorPos.right}`} />
      </Handle>
      <Handle
        id="t-top"
        type="target"
        position={Position.Top}
        className={handleClassName}
        style={handlePos.top}
      >
        <span aria-hidden className={`${handleIndicatorClassName} ${handleIndicatorPos.top}`} />
      </Handle>
      <Handle
        id="t-bottom"
        type="target"
        position={Position.Bottom}
        className={handleClassName}
        style={handlePos.bottom}
      >
        <span aria-hidden className={`${handleIndicatorClassName} ${handleIndicatorPos.bottom}`} />
      </Handle>

      {/* SOURCES (wyjścia) */}
      <Handle
        id="s-left"
        type="source"
        position={Position.Left}
        className={handleClassName}
        style={handlePos.left}
      >
        <span aria-hidden className={`${handleIndicatorClassName} ${handleIndicatorPos.left}`} />
      </Handle>
      <Handle
        id="s-right"
        type="source"
        position={Position.Right}
        className={handleClassName}
        style={handlePos.right}
      >
        <span aria-hidden className={`${handleIndicatorClassName} ${handleIndicatorPos.right}`} />
      </Handle>
      <Handle
        id="s-top"
        type="source"
        position={Position.Top}
        className={handleClassName}
        style={handlePos.top}
      >
        <span aria-hidden className={`${handleIndicatorClassName} ${handleIndicatorPos.top}`} />
      </Handle>
      <Handle
        id="s-bottom"
        type="source"
        position={Position.Bottom}
        className={handleClassName}
        style={handlePos.bottom}
      >
        <span aria-hidden className={`${handleIndicatorClassName} ${handleIndicatorPos.bottom}`} />
      </Handle>

      <div className="min-w-0 flex-1 text-center">
        <div className="font-poppins [display:-webkit-box] overflow-hidden text-[18px] leading-[1.25] font-semibold [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {data.title}
        </div>
      </div>
    </div>
  );
};
