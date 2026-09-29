import type { StepStatus } from '@/lib/types/roadmap';

import { roadmap } from '../persona';

// Same status borders as the roadmap canvas tiles; phases only turn green once done.
const statusBorder: Record<StepStatus, string> = {
  NotStarted: 'border-slate-300 border-l-slate-500',
  InProgress: 'border-amber-300 border-l-amber-500',
  Completed: 'border-emerald-300 border-l-emerald-500',
};
const EDGE = '#2f6fd6';

const steps = roadmap.phases.flatMap((phase) => phase.steps);
const progress = Math.round(
  (steps.filter(({ status }) => status === 'Completed').length / steps.length) * 100
);
const currentIndex = roadmap.phases.findIndex((phase) =>
  phase.steps.some(({ status }) => status !== 'Completed')
);
const current = roadmap.phases[currentIndex];

// Fixed tile heights keep the branch lines aligned with the tiles they connect.
const TILE = 32;
const PHASE_GAP = 10;
const STEP_GAP = 6;
const phasesHeight = roadmap.phases.length * (TILE + PHASE_GAP) - PHASE_GAP;
const stepsHeight = current.steps.length * (TILE + STEP_GAP) - STEP_GAP;
const rowHeight = Math.max(phasesHeight, stepsHeight);
const toPercent = (total: number, index: number, gap: number) =>
  (((rowHeight - total) / 2 + index * (TILE + gap) + TILE / 2) / rowHeight) * 100;
const branchFrom = toPercent(phasesHeight, currentIndex, PHASE_GAP);

function Tile({ title, status }: { title: string; status?: StepStatus }) {
  return (
    <div
      style={{ height: TILE }}
      className={`font-poppins flex items-center justify-center rounded-md border border-l-[3px] bg-white px-1.5 text-center text-[9px] leading-tight font-semibold ${status ? statusBorder[status] : 'border-[#11162f]'}`}
    >
      <span className="line-clamp-2">{title}</span>
    </div>
  );
}

// Miniature of the roadmap canvas: the phase chain and the steps of the current phase.
export default function RoadmapPreview() {
  return (
    <div className="font-grotesk text-[#11162f]">
      <div
        data-tour-reveal
        className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 pb-2"
      >
        <div className="min-w-0">
          <p className="w-fit rounded-[3px] bg-gray-200 px-1.5 text-[8.5px] font-semibold">
            Roadmap
          </p>
          <p className="font-poppins mt-0.5 text-[12.5px] leading-tight font-semibold">
            {roadmap.careerPathName}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[8.5px] text-slate-500">
            {roadmap.timeHorizonMonths} mies. · postęp {progress}%
          </p>
          <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-100">
            <div style={{ width: `${progress}%` }} className="h-full">
              <div data-tour-bar className="h-full origin-left rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>
      <div
        data-tour-reveal
        className="mt-2 grid grid-cols-1 items-center rounded-lg bg-[radial-gradient(#949cb4_0.75px,transparent_0.75px)] bg-size-[12px_12px] p-2.5 @xs:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]"
      >
        <ol>
          {roadmap.phases.map((phase, index) => (
            <li key={phase.title}>
              {index > 0 && (
                <span
                  aria-hidden="true"
                  style={{ height: PHASE_GAP, background: EDGE }}
                  className="mx-auto block w-0.5"
                />
              )}
              <Tile
                title={phase.title}
                status={
                  phase.steps.every(({ status }) => status === 'Completed')
                    ? 'Completed'
                    : undefined
                }
              />
            </li>
          ))}
        </ol>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 100"
          preserveAspectRatio="none"
          style={{ height: rowHeight }}
          className="hidden w-full @xs:block"
        >
          {current.steps.map((step, index) => {
            const to = toPercent(stepsHeight, index, STEP_GAP);
            return (
              <path
                key={step.title}
                d={`M0 ${branchFrom} C12 ${branchFrom} 12 ${to} 24 ${to}`}
                fill="none"
                stroke={EDGE}
                strokeWidth={1.5}
                strokeDasharray={step.stepType === 'Optional' ? '1 4' : undefined}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <ul className="hidden flex-col @xs:flex" style={{ gap: STEP_GAP }}>
          {current.steps.map((step) => (
            <li key={step.title}>
              <Tile title={step.title} status={step.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
