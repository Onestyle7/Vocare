import { Check, Download, FileText } from 'lucide-react';

const skills = ['CRM', 'Komunikacja', 'Onboarding'];
const requirements = ['Onboarding klientów B2B', 'Praca w CRM', 'Budowanie relacji'];

export default function ResumePreview() {
  return (
    <div className="flex gap-4">
      <div data-tour-reveal className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 border-b border-(--feature-tint) pb-2.5">
          <div className="min-w-0">
            <p className="text-[13px] font-medium">Anna Kowalska</p>
            <p className="mt-0.5 text-[10px] text-(--showcase-muted)">
              Customer Success Specialist
            </p>
          </div>
          <FileText size={16} className="shrink-0 text-(--feature-ink)" aria-hidden="true" />
        </div>
        <p className="mt-2.5 text-[8.5px] font-medium tracking-wider uppercase">Doświadczenie</p>
        <p className="mt-1 text-[10.5px] font-medium">Specjalistka ds. obsługi klienta</p>
        <p className="mt-0.5 text-[10px] leading-snug text-(--showcase-muted)">
          Wsparcie klientów, zgłoszenia w CRM i współpraca z zespołem sprzedaży.
        </p>
        <p className="mt-2.5 text-[8.5px] font-medium tracking-wider uppercase">Umiejętności</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-(--feature-tint) px-2 py-0.5 text-[9.5px] text-(--feature-ink)"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="hidden w-[40%] shrink-0 flex-col @xs:flex">
        <div data-tour-reveal className="rounded-xl bg-(--feature-tint) p-2.5">
          <p className="text-[9.5px] text-(--showcase-muted)">Dopasowane do oferty</p>
          <p className="mt-0.5 text-[11px] leading-tight font-medium">
            Customer Success Specialist
          </p>
          <ul className="mt-2 space-y-1">
            {requirements.map((requirement) => (
              <li key={requirement} className="flex items-start gap-1 text-[9.5px] leading-tight">
                <Check size={11} className="shrink-0 text-(--feature-ink)" aria-hidden="true" />
                {requirement}
              </li>
            ))}
          </ul>
        </div>
        <p
          data-tour-reveal
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-(--showcase-ink) px-2 py-2 text-center text-[10px] leading-tight font-medium text-white"
        >
          <Download size={12} className="shrink-0" aria-hidden="true" /> Gotowe do edycji i pobrania
        </p>
      </div>
    </div>
  );
}
