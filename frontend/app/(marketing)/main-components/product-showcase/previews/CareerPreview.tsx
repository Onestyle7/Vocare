import { Undo2 } from 'lucide-react';

import { alternativePaths, persona, recommendation } from '../persona';

// Miniature of the assistant page: the "Główna rekomendacja" card and alternative paths.
export default function CareerPreview() {
  return (
    <div className="font-grotesk flex gap-3">
      <div className="min-w-0 flex-1">
        <div data-tour-reveal className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[9.5px]">
            Doradca kariery AI
          </span>
          <span className="flex items-center gap-1 text-[9.5px] text-slate-500">
            <span
              aria-hidden="true"
              className="grid size-4 place-items-center rounded-full bg-[linear-gradient(180deg,#9296FD_0%,#C7A9FE_100%)] text-[7px] font-semibold text-white"
            >
              {persona.initials}
            </span>
            {persona.firstName} W.
          </span>
        </div>
        <div
          data-tour-reveal
          className="relative mt-2 rounded-[14px] bg-[linear-gradient(90deg,#9296FD_0%,#8491FE_50%,#C7A9FE_100%)] px-0.75 pt-6 pb-0.75"
        >
          <p className="absolute inset-x-0 top-1.5 flex items-center justify-center gap-1 text-[10px] font-semibold text-white">
            <Undo2 size={11} className="-rotate-90" aria-hidden="true" /> Główna rekomendacja
          </p>
          <div className="flex rounded-[11px] bg-white">
            <div className="grid w-9 shrink-0 place-items-center border-r border-slate-200">
              <span className="rounded-md border border-r-[3px] border-b-[3px] border-slate-800 px-1.5 text-[14px] leading-snug font-bold">
                1
              </span>
            </div>
            <div className="min-w-0 px-2.5 py-2">
              <p className="text-[10px] text-slate-500">Najlepsze dopasowanie</p>
              <p className="ibm-plex-mono-regular text-[12px] leading-snug font-medium text-[#915EFF]">
                {recommendation.primaryPath}
              </p>
              <p className="mt-1 text-[9.5px] leading-snug text-slate-500">
                {recommendation.justification}
              </p>
            </div>
          </div>
        </div>
        <div data-tour-reveal className="mt-2.5">
          <p className="text-[10px] font-bold">Kolejne kroki:</p>
          <ol className="mt-1 space-y-0.5">
            {recommendation.nextSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-1.5 text-[9.5px] leading-snug">
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full ${index === 0 ? 'bg-[#915EFF]' : 'border border-slate-400'}`}
                />
                <span className="shrink-0 text-slate-400">Krok {index + 1}</span>
                <span className="min-w-0 truncate">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="hidden w-[34%] shrink-0 flex-col gap-2 @xs:flex">
        <p className="text-[10px] text-slate-500">Alternatywne ścieżki</p>
        {alternativePaths.map(({ careerName, probability }) => (
          <div
            key={careerName}
            data-tour-reveal
            className="rounded-[10px] border border-slate-200 p-2"
          >
            <p className="ibm-plex-mono-regular text-[10px] leading-tight text-[#915EFF]">
              {careerName}
            </p>
            <p className="mt-1.5 flex justify-between gap-1 text-[8.5px] text-slate-500">
              Prawdopodobieństwo sukcesu
              <span className="font-semibold text-slate-800">{probability}%</span>
            </p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
              <div style={{ width: `${probability}%` }} className="h-full">
                <div data-tour-bar className="h-full origin-left rounded-full bg-[#915EFF]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
