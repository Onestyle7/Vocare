import { ChartNoAxesCombined, Check, Plus } from 'lucide-react';

const salaries = [
  { label: 'Junior', range: '5–7 tys. zł', scale: 0.45 },
  { label: 'Mid', range: '8–11 tys. zł', scale: 0.7 },
  { label: 'Senior', range: '12–16 tys. zł', scale: 1 },
];

const skills = [
  { label: 'Komunikacja z klientem', ready: true },
  { label: 'Praca w CRM', ready: true },
  { label: 'Onboarding B2B', ready: false },
];

export default function MarketPreview() {
  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1">
        <p
          data-tour-reveal
          className="flex items-center gap-1.5 text-[11px] font-medium text-(--feature-ink)"
        >
          <ChartNoAxesCombined size={13} aria-hidden="true" /> Wynagrodzenie a doświadczenie
        </p>
        <h4 data-tour-reveal className="mt-2 text-[13px] font-medium">
          Customer Success Specialist
        </h4>
        <div data-tour-reveal className="mt-3 space-y-2.5">
          {salaries.map(({ label, range, scale }) => (
            <div
              key={label}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-[10px]"
            >
              <span className="text-(--showcase-muted)">{label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-(--feature-tint)">
                <div style={{ transform: `scaleX(${scale})` }} className="h-full origin-left">
                  <div
                    data-tour-bar
                    className="h-full origin-left rounded-full bg-(--feature-accent)"
                  />
                </div>
              </div>
              <span className="text-right font-medium">{range}</span>
            </div>
          ))}
        </div>
        <p data-tour-reveal className="mt-3 text-[9.5px] text-(--showcase-muted)">
          Przykładowe widełki, nie aktualny raport płacowy.
        </p>
      </div>
      <div className="hidden w-[38%] shrink-0 flex-col @xs:flex">
        <p className="text-[10px] font-medium text-(--showcase-muted)">Kompetencje na start</p>
        <ul className="mt-2 space-y-2">
          {skills.map(({ label, ready }) => (
            <li
              key={label}
              data-tour-reveal
              className="flex items-center gap-1.5 rounded-lg bg-(--feature-tint) px-2.5 py-2 text-[10.5px] leading-tight font-medium"
            >
              {ready ? (
                <Check size={12} className="shrink-0 text-(--feature-ink)" aria-hidden="true" />
              ) : (
                <Plus size={12} className="shrink-0 text-(--feature-ink)" aria-hidden="true" />
              )}
              <span className={ready ? undefined : 'text-(--feature-ink)'}>
                {ready ? label : `Do rozwinięcia: ${label}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
