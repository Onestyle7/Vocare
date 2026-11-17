'use client';

import { useId, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/utils/tracking';

import { RATES_2026 } from '../config/rates-2026';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  AMOUNT_STEP,
  CONTRACT_META,
  DEFAULT_AMOUNT,
  LUMP_SUM_RATES,
} from '../constants';
import { calculateAll } from '../lib/calculate';
import type { ContractResult, ContractType } from '../lib/types';

const MAX_INPUT_AMOUNT = 1_000_000;

const currencyFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 2,
});
const formatCurrency = (value: number) => currencyFormatter.format(value);

const BREAKDOWN_ROWS = [
  { key: 'social', label: 'Składki ZUS', color: 'bg-sky-500' },
  { key: 'health', label: 'Składka zdrowotna', color: 'bg-emerald-500' },
  { key: 'pit', label: 'Zaliczka na PIT', color: 'bg-amber-500' },
  { key: 'net', label: 'Na rękę', color: 'bg-[#915EFF]' },
] as const;

type SalaryCalculatorProps = {
  className?: string;
};

export default function SalaryCalculator({ className }: SalaryCalculatorProps) {
  const id = useId();
  const [amountText, setAmountText] = useState(String(DEFAULT_AMOUNT));
  const [under26, setUnder26] = useState(false);
  const [student, setStudent] = useState(false);
  const [copyrightCosts, setCopyrightCosts] = useState(false);
  const [lumpSumRate, setLumpSumRate] = useState<number>(RATES_2026.b2b.defaultLumpSumRate);
  const [selectedType, setSelectedType] = useState<ContractType>('employment');
  const usageReported = useRef(false);

  const amount = Number(amountText) || 0;

  const results = useMemo(
    () => calculateAll({ monthlyGross: amount, under26, student, copyrightCosts, lumpSumRate }),
    [amount, under26, student, copyrightCosts, lumpSumRate]
  );

  const bestType = results.reduce<ContractResult | null>(
    (best, result) => (!best || result.net > best.net ? result : best),
    null
  )?.type;
  const selected = results.find((result) => result.type === selectedType);

  // Once per visit, on the first change of any setting. Only the tool's name is sent, never amounts.
  const reportUsage = () => {
    if (usageReported.current) return;
    usageReported.current = true;
    trackEvent('ToolUsed', { toolName: 'salary_calculator' });
  };

  const withUsage =
    <T,>(update: (value: T) => void) =>
    (value: T) => {
      reportUsage();
      update(value);
    };

  const handleAmountChange = (value: string) => {
    reportUsage();
    const digits = value.replace(/\D/g, '').slice(0, 7);
    setAmountText(String(Math.min(Number(digits) || 0, MAX_INPUT_AMOUNT) || ''));
  };

  return (
    <section
      aria-label="Kalkulator wynagrodzeń brutto netto"
      className={cn(
        'bg-card text-card-foreground font-poppins w-full rounded-2xl border p-4 sm:p-6',
        className
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Label htmlFor={`${id}-amount`} className="text-base">
            Wynagrodzenie brutto miesięcznie
          </Label>
          <div className="relative">
            <Input
              id={`${id}-amount`}
              inputMode="numeric"
              autoComplete="off"
              value={amountText}
              onChange={(event) => handleAmountChange(event.target.value)}
              className="rounded-xl border pr-12 text-lg font-semibold"
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm">
              zł
            </span>
          </div>
          <Slider
            aria-label="Wynagrodzenie brutto"
            min={AMOUNT_MIN}
            max={AMOUNT_MAX}
            step={AMOUNT_STEP}
            value={[Math.min(Math.max(amount, AMOUNT_MIN), AMOUNT_MAX)]}
            onValueChange={withUsage(([value]: number[]) => setAmountText(String(value)))}
          />
          <p className="text-muted-foreground text-xs">
            Dla B2B kwota jest traktowana jako wartość netto faktury.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor={`${id}-under26`}>Mam mniej niż 26 lat (ulga dla młodych)</Label>
            <Switch
              id={`${id}-under26`}
              checked={under26 || student}
              disabled={student}
              onCheckedChange={withUsage(setUnder26)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor={`${id}-student`}>
              Jestem uczniem lub studentem (zlecenie bez ZUS i zdrowotnej)
            </Label>
            <Switch
              id={`${id}-student`}
              checked={student}
              onCheckedChange={withUsage(setStudent)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor={`${id}-copyright`}>
              Umowa o dzieło z prawami autorskimi (50% kosztów)
            </Label>
            <Switch
              id={`${id}-copyright`}
              checked={copyrightCosts}
              onCheckedChange={withUsage(setCopyrightCosts)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor={`${id}-lump-sum`}>Stawka ryczałtu (B2B)</Label>
            <Select
              value={String(lumpSumRate)}
              onValueChange={withUsage((value: string) => setLumpSumRate(Number(value)))}
            >
              <SelectTrigger id={`${id}-lump-sum`} className="w-32 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LUMP_SUM_RATES.map((rate) => (
                  <SelectItem key={rate.value} value={String(rate.value)}>
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-center text-sm">
          Wpisz kwotę wynagrodzenia, aby porównać typy umów.
        </p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <ContractCard
                key={result.type}
                result={result}
                isSelected={result.type === selectedType}
                isBest={result.type === bestType}
                onSelect={() => {
                  reportUsage();
                  setSelectedType(result.type);
                }}
              />
            ))}
          </div>
          {selected && <ContractBreakdown result={selected} />}
        </>
      )}

      <p className="text-muted-foreground mt-6 text-xs leading-relaxed">
        Wyliczenia mają charakter poglądowy i nie stanowią porady podatkowej. Kalkulator uwzględnia
        stawki ZUS, NFZ i PIT obowiązujące w {RATES_2026.year} r. oraz założenia opisane przy każdym
        typie umowy. Kwoty to średnia miesięczna z całego roku; podatek pokazujemy jako zaliczki,
        bez rozliczenia rocznego.
      </p>
    </section>
  );
}

type ContractCardProps = {
  result: ContractResult;
  isSelected: boolean;
  isBest: boolean;
  onSelect: () => void;
};

function ContractCard({ result, isSelected, isBest, onSelect }: ContractCardProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors hover:border-[#915EFF]/60',
        isSelected && 'border-[#915EFF] bg-[#915EFF]/10'
      )}
    >
      <span className="flex w-full items-center justify-between gap-2 text-sm font-medium">
        {CONTRACT_META[result.type].label}
        {isBest && (
          <span className="rounded-full bg-[#915EFF] px-2 py-0.5 text-[10px] font-semibold text-white">
            Najwięcej
          </span>
        )}
      </span>
      <span className="text-2xl font-semibold">{formatCurrency(result.net)}</span>
      <span className="text-muted-foreground text-xs">na rękę miesięcznie</span>
    </button>
  );
}

function ContractBreakdown({ result }: { result: ContractResult }) {
  const meta = CONTRACT_META[result.type];
  const varies = result.months.some((month) => month.net !== result.months[0].net);

  return (
    <div className="mt-6 rounded-xl border p-4 sm:p-6">
      <p className="text-lg font-semibold">{meta.label}</p>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full" aria-hidden>
        {BREAKDOWN_ROWS.map(({ key, color }) => (
          <div
            key={key}
            className={color}
            style={{ width: `${(Math.max(0, result[key]) / result.gross) * 100}%` }}
          />
        ))}
      </div>

      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>{meta.isB2b ? 'Kwota netto na fakturze' : 'Wynagrodzenie brutto'}</dt>
          <dd className="font-medium">{formatCurrency(result.gross)}</dd>
        </div>
        {BREAKDOWN_ROWS.map(({ key, label, color }) => (
          <div key={key} className="flex justify-between gap-4">
            <dt className="flex items-center gap-2">
              <span className={cn('size-2.5 rounded-full', color)} aria-hidden />
              {label}
            </dt>
            <dd className={cn('font-medium', key === 'net' && 'text-base font-semibold')}>
              {key === 'net' ? '' : '− '}
              {formatCurrency(result[key])}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t pt-2">
          <dt>{meta.isB2b ? 'Koszt dla zleceniodawcy' : 'Całkowity koszt pracodawcy'}</dt>
          <dd className="font-medium">{formatCurrency(result.employerCost)}</dd>
        </div>
      </dl>

      <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
        Założenia: {meta.assumptions}
      </p>

      {varies && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">
            Zobacz wyliczenie miesiąc po miesiącu
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-xl text-right text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 text-left font-medium">Miesiąc</th>
                  <th className="py-1 font-medium">ZUS</th>
                  <th className="py-1 font-medium">Zdrowotna</th>
                  <th className="py-1 font-medium">PIT</th>
                  <th className="py-1 font-medium">Na rękę</th>
                  <th className="py-1 font-medium">Koszt pracodawcy</th>
                </tr>
              </thead>
              <tbody>
                {result.months.map((month) => (
                  <tr key={month.month} className="border-t">
                    <td className="py-1 text-left">{month.month}</td>
                    <td className="py-1">{formatCurrency(month.social)}</td>
                    <td className="py-1">{formatCurrency(month.health)}</td>
                    <td className="py-1">{formatCurrency(month.pit)}</td>
                    <td className="py-1 font-medium">{formatCurrency(month.net)}</td>
                    <td className="py-1">{formatCurrency(month.employerCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
