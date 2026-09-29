import { ArrowDown, ArrowUp, Plus } from 'lucide-react';

import { market } from '../persona';

const { salaryProgression: levels, entryDifficulty } = market;
// Always grouped, like the product's counters (pl-PL leaves 4-digit numbers ungrouped).
const formatPln = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Same series and colors as the product's salary chart: min, average (filled) and max.
const CHART = { width: 200, height: 64, floor: 5000, ceiling: 21000 };
const toPoints = (key: 'minSalary' | 'averageSalary' | 'maxSalary') =>
  levels
    .map((level, index) => {
      const x = (index / (levels.length - 1)) * CHART.width;
      const y =
        CHART.height - ((level[key] - CHART.floor) / (CHART.ceiling - CHART.floor)) * CHART.height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
const series = [
  { key: 'minSalary', color: '#0ea5e9' },
  { key: 'averageSalary', color: '#6366f1' },
  { key: 'maxSalary', color: '#a855f7' },
] as const;

const GAUGE = 2 * Math.PI * 26;

// Miniature of the market analysis card for the recommended path.
export default function MarketPreview() {
  return (
    <div className="font-grotesk flex gap-3 text-[#191A23]">
      <div className="min-w-0 flex-1">
        <div data-tour-reveal>
          <p className="w-fit rounded-[3px] bg-[#191A23] px-1 text-[9px] text-[#ecedf0]">
            Ścieżka kariery
          </p>
          <h4 className="mt-1.5 text-[13px] font-semibold">
            <span className="rounded-[5px] bg-[#F3F3F3] [box-decoration-break:clone] px-1.5">
              {market.careerName}
            </span>
          </h4>
        </div>
        <div data-tour-reveal className="mt-2 flex flex-wrap gap-1.5 text-[9.5px]">
          <span className="flex items-center gap-1 rounded-[6px] border border-slate-200 px-1.5 py-0.5">
            <ArrowDown size={10} aria-hidden="true" />
            <span className="font-semibold">{formatPln(levels[0].minSalary)}</span> PLN
          </span>
          <span className="flex items-center gap-1 rounded-[6px] border border-slate-200 px-1.5 py-0.5">
            <ArrowUp size={10} aria-hidden="true" />
            <span className="font-semibold">{formatPln(levels.at(-1)!.maxSalary)}</span> PLN
          </span>
          <span className="rounded-[6px] border border-emerald-200 px-1.5 py-0.5 text-emerald-700">
            Zatrudnienie: {market.employmentRate}%
          </span>
        </div>
        <div
          data-tour-reveal
          className="mt-2.5 rounded-[10px] border border-slate-200 px-2 pt-1.5 pb-1"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9.5px] font-medium">Progresja wynagrodzeń</p>
            <span className="rounded-[4px] bg-[#F3F3F3] px-1 text-[8px]">PLN</span>
          </div>
          <svg
            viewBox={`0 -4 ${CHART.width} ${CHART.height + 8}`}
            preserveAspectRatio="none"
            className="mt-1 h-16 w-full"
            role="img"
            aria-label={`Średnie wynagrodzenie od ${formatPln(levels[0].averageSalary)} do ${formatPln(levels.at(-1)!.averageSalary)} PLN`}
          >
            <defs>
              <linearGradient id="tour-salary-average" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            {[16, 32, 48].map((y) => (
              <line
                key={y}
                x1="0"
                x2={CHART.width}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <polygon
              points={`0,${CHART.height} ${toPoints('averageSalary')} ${CHART.width},${CHART.height}`}
              fill="url(#tour-salary-average)"
            />
            {series.map(({ key, color }) => (
              <polyline
                key={key}
                points={toPoints(key)}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="mt-0.5 flex justify-between text-[8px] text-slate-500">
            {levels.map(({ careerLevel }) => (
              <span key={careerLevel}>{careerLevel}</span>
            ))}
          </div>
        </div>
      </div>
      <div
        data-tour-reveal
        className="hidden w-[34%] shrink-0 flex-col rounded-[10px] border border-slate-200 p-2 @xs:flex"
      >
        <p className="text-[9.5px] font-medium">Trudność wejścia</p>
        <div className="relative mx-auto mt-1 size-15">
          <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#eef0f6" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#6366f1"
              strokeWidth="6"
              strokeDasharray={`${(entryDifficulty.difficultyScore / 100) * GAUGE} ${GAUGE}`}
            />
          </svg>
          <p className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-[6.5px] text-slate-500">Entry score</span>
            <span className="text-[15px] font-semibold">{entryDifficulty.difficultyScore}</span>
            <span className="text-[6.5px] text-slate-500">/100</span>
          </p>
        </div>
        <p className="mt-1.5 text-[7.5px] tracking-wide text-slate-500 uppercase">
          Brakujące umiejętności
        </p>
        <ul className="mt-0.5 space-y-0.5">
          {entryDifficulty.missingSkills.map((skill) => (
            <li key={skill} className="flex items-center gap-1 text-[9px] leading-tight">
              <Plus size={9} className="shrink-0 text-[#6366f1]" aria-hidden="true" />
              {skill}
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[7.5px] tracking-wide text-slate-500 uppercase">
          Czas do gotowości
        </p>
        <p className="text-[9.5px] font-medium">{entryDifficulty.estimatedTimeToReady}</p>
      </div>
    </div>
  );
}
