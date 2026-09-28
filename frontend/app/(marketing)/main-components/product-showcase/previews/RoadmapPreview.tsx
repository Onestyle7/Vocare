import { BookOpen, Check, ListChecks } from 'lucide-react';

const steps = [
  { title: 'Poznaj cykl życia klienta', status: 'Ukończone', icon: Check },
  { title: 'Przećwicz onboarding', status: 'W trakcie', icon: BookOpen },
  { title: 'Zbuduj portfolio', status: 'Do zrobienia', icon: ListChecks },
];

// One of three stages done: a third of the ring's circumference.
const RING = 2 * Math.PI * 26;

export default function RoadmapPreview() {
  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1">
        <div data-tour-reveal className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] text-(--showcase-muted)">Cel: Customer Success</p>
            <h4 className="mt-0.5 text-[13px] font-medium">Twój plan rozwoju</h4>
          </div>
          <span className="shrink-0 rounded-full bg-(--feature-tint) px-2 py-1 text-[9.5px] text-(--feature-ink)">
            3 miesiące
          </span>
        </div>
        <ol className="mt-3 space-y-1.5">
          {steps.map(({ title, status, icon: Icon }) => (
            <li
              key={title}
              data-tour-reveal
              className="flex items-center gap-2 rounded-lg border border-(--feature-tint) px-2 py-1.5"
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-(--feature-tint) text-(--feature-ink)">
                <Icon size={11} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-[11px] leading-tight font-medium">{title}</span>
              <span className="shrink-0 text-[9.5px] text-(--feature-ink)">{status}</span>
            </li>
          ))}
        </ol>
      </div>
      <div
        data-tour-reveal
        className="hidden w-[34%] shrink-0 flex-col items-center justify-center rounded-xl bg-(--feature-tint) px-2 py-3 text-center @xs:flex"
      >
        <div className="relative size-16">
          <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="var(--feature-accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${RING / 3} ${RING}`}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[13px] font-medium">
            1/3
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-tight font-medium">etapów ukończonych</p>
        <p className="mt-1 text-[9.5px] leading-tight text-(--showcase-muted)">
          Każde zadanie przybliża Cię do celu
        </p>
      </div>
    </div>
  );
}
