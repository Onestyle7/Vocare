import { ArrowUpRight, Check, Compass } from 'lucide-react';

const skills = ['Obsługa klienta', 'CRM'];
const alternatives = ['Account Manager', 'Wsparcie sprzedaży', 'Customer Support'];

export default function CareerPreview() {
  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1">
        <p
          data-tour-reveal
          className="flex items-center gap-1.5 text-[11px] font-medium text-(--feature-ink)"
        >
          <Compass size={13} aria-hidden="true" /> Główna rekomendacja
        </p>
        <div data-tour-reveal>
          <h4 className="mt-2 text-[15px] leading-snug font-medium">Customer Success Specialist</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-(--showcase-muted)">
            Doświadczenie z obsługi klienta wykorzystasz we wdrażaniu klientów biznesowych.
          </p>
        </div>
        <div data-tour-reveal className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-(--feature-tint) px-2 py-0.5 text-[10px] text-(--feature-ink)"
            >
              {skill}
            </span>
          ))}
        </div>
        <p data-tour-reveal className="mt-3 flex items-center gap-1.5 text-[11px]">
          <Check size={13} className="shrink-0 text-(--feature-ink)" aria-hidden="true" />
          Kolejny krok: onboarding klienta
        </p>
      </div>
      <div className="hidden w-[38%] shrink-0 flex-col @xs:flex">
        <p className="text-[10px] font-medium text-(--showcase-muted)">Inne kierunki</p>
        <ul className="mt-2 space-y-2">
          {alternatives.map((path) => (
            <li
              key={path}
              data-tour-reveal
              className="flex items-center justify-between gap-1 rounded-lg bg-(--feature-tint) px-2.5 py-2 text-[11px] leading-tight font-medium"
            >
              {path}
              <ArrowUpRight
                size={12}
                className="shrink-0 text-(--feature-ink)"
                aria-hidden="true"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
