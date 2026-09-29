import { Award, Briefcase, CircleCheck, Download, Mail, MapPin } from 'lucide-react';

import { cv, persona } from '../persona';

const { basics, analysis } = cv;
const RING = 2 * Math.PI * 26;

// Miniature of the CV creator: the live preview page and the CV quality audit.
export default function ResumePreview() {
  return (
    <div className="flex gap-3">
      <div
        data-tour-reveal
        className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_3px_rgb(15_23_42/0.08)]"
      >
        <p className="text-[13px] leading-tight font-bold text-gray-900">
          {basics.firstName} {basics.lastName}
        </p>
        <p className="text-[10px] text-gray-600">{cv.targetPosition}</p>
        <p className="mt-1 flex flex-wrap gap-x-2 text-[8px] text-gray-600">
          <span className="flex items-center gap-0.5">
            <Mail size={8} aria-hidden="true" /> {basics.email}
          </span>
          <span className="flex items-center gap-0.5">
            <MapPin size={8} aria-hidden="true" /> {persona.city}
          </span>
        </p>
        <p className="mt-2 border-b border-gray-300 pb-0.5 text-[9.5px] font-semibold text-gray-800">
          Profil osobisty
        </p>
        <p className="mt-1 line-clamp-2 text-[8.5px] leading-snug text-gray-700">
          {basics.summary}
        </p>
        <p className="mt-2 flex items-center gap-1 border-b border-gray-300 pb-0.5 text-[9.5px] font-semibold text-gray-800">
          <Briefcase size={9} aria-hidden="true" /> Doświadczenie zawodowe
        </p>
        <div className="mt-1 flex items-start justify-between gap-2 text-[9px]">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{cv.work.position}</p>
            <p className="text-gray-700">{cv.work.company}</p>
          </div>
          <span className="shrink-0 text-[8px] text-gray-600">{cv.work.startDate} - obecnie</span>
        </div>
        <p className="mt-2 flex items-center gap-1 border-b border-gray-300 pb-0.5 text-[9.5px] font-semibold text-gray-800">
          <Award size={9} aria-hidden="true" /> Umiejętności
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {cv.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-medium text-blue-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="font-grotesk hidden w-[38%] shrink-0 flex-col gap-1.5 @xs:flex">
        <p data-tour-reveal className="text-[9px] leading-tight text-slate-500">
          Dopasowane do oferty
          <span className="block font-medium text-slate-900">{cv.offer}</span>
        </p>
        <div data-tour-reveal className="rounded-[10px] border border-slate-200 p-2">
          <p className="text-[9px] text-slate-600">Wynik ogólny</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="relative size-10 shrink-0">
              <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#eef0f6" strokeWidth="7" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${(analysis.overallScore / 100) * RING} ${RING}`}
                />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-slate-900">
                {analysis.overallScore}
                <span className="text-[9px] font-normal text-slate-500">/100</span>
              </p>
              <p className="flex items-center gap-0.5 text-[8.5px] text-emerald-600">
                <CircleCheck size={9} aria-hidden="true" /> Bardzo mocne CV
              </p>
            </div>
          </div>
        </div>
        <div data-tour-reveal className="rounded-[10px] border border-slate-200 p-2">
          <p className="text-[8.5px] leading-tight text-slate-600">
            Dopasowanie do: {cv.targetPosition}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div style={{ width: `${analysis.targetPositionScore}%` }} className="h-full">
                <div data-tour-bar className="h-full origin-left rounded-full bg-[#915EFF]" />
              </div>
            </div>
            <span className="text-[9px] font-semibold text-slate-900">
              {analysis.targetPositionScore}/100
            </span>
          </div>
        </div>
        <p
          data-tour-reveal
          className="flex items-center justify-center gap-1 rounded-md bg-[#915EFF] px-2 py-1.5 text-[9.5px] font-medium text-white"
        >
          <Download size={10} aria-hidden="true" /> Pobierz PDF
        </p>
      </div>
    </div>
  );
}
