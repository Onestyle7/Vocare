import { ArrowUpRight, Check, Lightbulb, UserRound } from 'lucide-react';
import Link from 'next/link';

import ExampleCta from './ExampleCta';
import ExampleTabs from './ExampleTabs';

const headingClass = 'text-xl font-normal leading-tight text-[#F1F4FF] sm:text-2xl';
const tileBorderClass =
  'rounded-2xl bg-gradient-to-br from-white/20 via-white/10 via-[50%] to-white/[0.04] p-px';
const detailClass =
  'mt-5 rounded-xl border border-white/10 bg-[#111216] px-4 py-3 text-sm text-[#B5B7C4]';
const summaryClass =
  'cursor-pointer rounded-sm py-1 text-[#D4D0FF] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B2AEFF]';

function PathExample() {
  return (
    <>
      <p className="mb-2 text-xs font-medium text-[#B2AEFF]">Kierunek do rozważenia</p>
      <h3 className={headingClass}>Junior Customer Success Specialist</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#B5B7C4] sm:text-[15px]">
        Wykorzystaj doświadczenie w obsłudze klienta, by rozwijać się we wspieraniu klientów
        biznesowych.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className={tileBorderClass}>
          <div className="h-full rounded-[15px] bg-[#111216] p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-[#BAD6FF]">
              <Check size={16} aria-hidden="true" /> Masz już podstawy
            </h4>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#CDD0DC]">
              <li>Kontakt z klientami</li>
              <li>Praca w CRM</li>
              <li>Zestawienia w Excelu</li>
            </ul>
          </div>
        </div>
        <div className={tileBorderClass}>
          <div className="h-full rounded-[15px] bg-[#111216] p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-[#D9C5FF]">
              <Lightbulb size={16} aria-hidden="true" /> Co warto rozwinąć
            </h4>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#CDD0DC]">
              <li>Wdrażanie klientów B2B</li>
              <li>Podstawy retencji klientów</li>
              <li>Prezentowanie produktu</li>
            </ul>
          </div>
        </div>
      </div>
      <details className={detailClass}>
        <summary className={summaryClass}>Dlaczego ten kierunek?</summary>
        <p className="mt-3 leading-relaxed">
          Obsługa zgłoszeń i praca w CRM mogą być punktem wyjścia do wspierania klientów w
          korzystaniu z produktu. Przed wyborem ścieżki warto porównać wymagania konkretnych ofert i
          sprawdzić, które kompetencje trzeba uzupełnić.
        </p>
        <Link
          href="/assistant"
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-[#D4D0FF] underline underline-offset-4"
        >
          Poznaj doradcę zawodowego <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </details>
    </>
  );
}

function PlanExample() {
  return (
    <>
      <p className="mb-2 text-xs font-medium tracking-widest text-[#B2AEFF] uppercase">
        Od kierunku do działania
      </p>
      <h3 className={headingClass}>Wiesz, od czego zacząć</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#B5B7C4] sm:text-[15px]">
        Przykładowe kroki dla osoby, która chce przejść z obsługi klienta do Customer Success.
      </p>
      <ol className="mt-5 space-y-4">
        {[
          {
            title: 'Poznaj pracę w Customer Success',
            description:
              'Porównaj wymagania ofert juniorskich. Zapisz, co już potrafisz, a czego potrzebujesz się nauczyć.',
          },
          {
            title: 'Przećwicz wdrożenie klienta',
            description:
              'Dla wybranego produktu rozpisz plan pierwszego spotkania i checklistę wdrożenia klienta.',
          },
          {
            title: 'Przygotuj CV pod wybraną ofertę',
            description:
              'Wyeksponuj pracę z klientami, CRM i raportowanie. Sprawdź treść przed wysłaniem aplikacji.',
          },
        ].map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#B2AEFF]/20 bg-[#B2AEFF]/10 text-xs text-[#D4D0FF]"
              aria-hidden="true"
            >
              0{index + 1}
            </span>
            <div>
              <h4 className="text-sm font-medium text-[#F1F4FF]">{step.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-[#B5B7C4]">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <details className={detailClass}>
        <summary className={summaryClass}>Jak dopasować plan do siebie?</summary>
        <p className="mt-3 leading-relaxed">
          Własną roadmapę tworzysz dla wybranej ścieżki i horyzontu czasowego. Ten skrócony przykład
          pokazuje kolejność działań; tempo nauki zależy od Twojego punktu startowego i czasu, który
          możesz poświęcić.
        </p>
        <Link
          href="/roadmap"
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-[#D4D0FF] underline underline-offset-4"
        >
          Poznaj roadmapę kariery <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </details>
    </>
  );
}

function ResumeExample() {
  return (
    <>
      <p className="mb-2 text-xs font-medium tracking-widest text-[#B2AEFF] uppercase">
        Twoje doświadczenie w CV
      </p>
      <h3 className={headingClass}>Pokaż to, co pasuje do oferty</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#B5B7C4] sm:text-[15px]">
        Przykład podsumowania zawodowego dla roli Junior Customer Success Specialist.
      </p>
      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-white/10 bg-[#111216] p-4">
          <h4 className="text-xs font-medium text-[#A6A8B3]">Punkt wyjścia</h4>
          <p className="mt-2 text-sm leading-relaxed text-[#CDD0DC]">
            Dwa lata w obsłudze klienta. Rozwiązywanie zgłoszeń, praca w CRM i zestawienia w Excelu.
          </p>
        </div>
        <div className="rounded-xl border border-[#B2AEFF]/25 bg-[#B2AEFF]/5 p-4">
          <h4 className="text-xs font-medium text-[#C5BEFF]">Po uporządkowaniu pod ofertę</h4>
          <p className="mt-2 text-sm leading-relaxed text-[#F1F4FF]">
            Specjalistka obsługi klienta z dwuletnim doświadczeniem w rozwiązywaniu zgłoszeń, pracy
            z CRM i przygotowywaniu zestawień w Excelu. Chcę wykorzystać te umiejętności we
            wspieraniu klientów biznesowych jako Junior Customer Success Specialist.
          </p>
        </div>
      </div>
      <details className={detailClass}>
        <summary className={summaryClass}>Co zmieniło się w treści?</summary>
        <p className="mt-3 leading-relaxed">
          Podsumowanie łączy dotychczasowe zadania z celem zawodowym. Nie dodaje doświadczenia we
          wdrożeniach B2B ani umiejętności, których nie ma w przykładowym profilu.
        </p>
        <Link
          href="/resume-creator"
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-[#D4D0FF] underline underline-offset-4"
        >
          Poznaj kreator CV <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </details>
    </>
  );
}

export default function ProductExample() {
  return (
    <section
      id="przyklad"
      aria-labelledby="product-example-title"
      className="font-poppins scroll-mt-28 bg-[#0F1013] px-3 py-10 sm:px-5 sm:py-14 lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl">
        <h2
          id="product-example-title"
          className="mb-10 w-full px-4 text-center text-[28px] leading-[1.15] font-light text-[#F1F4FF] sm:mb-12 sm:text-[36px] lg:mb-16 lg:text-[48px] lg:leading-[1.1]"
        >
          <span className="opacity-[0.79]">Zobacz, co możesz</span>
          <br />
          <span className="bg-[linear-gradient(180deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] bg-clip-text font-normal text-transparent">
            otrzymać
          </span>
        </h2>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#16161A]">
          <div className="flex items-center border-b border-white/10 px-5 py-4 sm:px-8">
            <div aria-hidden="true" className="flex shrink-0 items-center gap-2">
              <span className="size-3 rounded-full bg-[#FF5F57] ring-1 ring-black/10" />
              <span className="size-3 rounded-full bg-[#FEBC2E] ring-1 ring-black/10" />
              <span className="size-3 rounded-full bg-[#28C840] ring-1 ring-black/10" />
            </div>
          </div>
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)] lg:gap-10 lg:p-10">
            <aside
              aria-label="Profil w przykładzie"
              className="min-w-0 rounded-2xl border border-white/10 bg-[#111216] p-5 sm:p-6 lg:self-start"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#B2AEFF]/10 text-[#C5BEFF]">
                  <UserRound size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-medium text-[#F1F4FF]">Anna</h3>
                  <p className="mt-1 text-xs text-[#A6A8B3]">2 lata w obsłudze klienta</p>
                </div>
              </div>
              <dl className="mt-6 space-y-5 text-sm">
                <div>
                  <dt className="text-xs text-[#A6A8B3]">Codzienne zadania</dt>
                  <dd className="mt-1.5 leading-relaxed text-[#CDD0DC]">
                    Rozwiązywanie zgłoszeń, praca w CRM, zestawienia w Excelu.
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#A6A8B3]">Cel zawodowy</dt>
                  <dd className="mt-1.5 leading-relaxed text-[#CDD0DC]">
                    Rozwój w pracy z klientami biznesowymi.
                  </dd>
                </div>
              </dl>
            </aside>
            <ExampleTabs
              panels={{ path: <PathExample />, plan: <PlanExample />, resume: <ResumeExample /> }}
            />
          </div>
          <div className="flex flex-col items-center justify-between gap-5 border-t border-white/10 bg-[#1B1B23] px-5 py-6 text-center sm:px-8 lg:flex-row lg:px-10 lg:text-left">
            <div>
              <p className="text-lg text-[#F1F4FF]">A jaki będzie Twój kolejny krok?</p>
              <p className="mt-1.5 text-sm text-[#B5B7C4]">
                Zacznij od własnego profilu. Bez karty płatniczej.
              </p>
            </div>
            <ExampleCta />
          </div>
        </div>
      </div>
    </section>
  );
}
