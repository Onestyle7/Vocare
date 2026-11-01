'use client';

import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

type CaptionLayout = React.ComponentProps<typeof Calendar>['captionLayout'];

interface DatePickerWithCurrentProps {
  value: string;
  onChange: (date: string) => void;
  isCurrent: boolean;
  onCurrentChange: (current: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  allowFutureDates?: boolean;
  showCurrentToggle?: boolean; // show/hide Present switch (default true)
  toggleLabel?: string;
  toggledButtonText?: string;
}

export const DatePickerWithCurrent: React.FC<DatePickerWithCurrentProps> = ({
  value,
  onChange,
  isCurrent,
  onCurrentChange,
  placeholder = 'Wybierz datę',
  disabled = false,
  allowFutureDates = false,
  showCurrentToggle = true,
  toggleLabel = 'Obecnie',
  toggledButtonText = 'Obecnie',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [captionLayout] = React.useState<CaptionLayout>('dropdown');
  const checkboxId = React.useId();
  const touchSwitchId = React.useId();
  // Local mirror to ensure immediate visual feedback on Switch
  const [currentChecked, setCurrentChecked] = React.useState<boolean>(isCurrent);
  React.useEffect(() => {
    setCurrentChecked(isCurrent);
  }, [isCurrent]);

  // Bezpieczny parser YYYY-MM-DD -> Date (lokalnie, bez przesunięć strefy)
  const parseISODate = (v?: string) => {
    if (!v) return undefined;
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) v = v.slice(0, 10);
    const [y, m, d] = v.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  };

  const selectedDate = React.useMemo(() => parseISODate(value), [value]);
  const defaultMonth = selectedDate ?? new Date();

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = parseISODate(dateString);
    if (!date) return '';
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
      setIsOpen(false);
    }
  };

  const handleCurrentToggle = (next?: boolean) => {
    const newState = typeof next === 'boolean' ? next : !currentChecked;
    setCurrentChecked(newState);
    onCurrentChange(newState);
    if (newState) onChange('');
  };

  const startMonth = React.useMemo(() => new Date(1900, 0), []);
  const endMonth = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (!allowFutureDates) return new Date();
    const maxYear = selectedDate
      ? Math.max(currentYear + 20, selectedDate.getFullYear() + 10)
      : currentYear + 20;
    return new Date(maxYear, 11);
  }, [allowFutureDates, selectedDate]);

  // Natywny input miesiąca operuje na YYYY-MM; brak przyszłych dat = najpóźniej bieżący miesiąc
  const nativeMax = allowFutureDates
    ? undefined
    : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const displayText = currentChecked
    ? toggledButtonText
    : value
      ? formatDisplayDate(value)
      : placeholder;

  return (
    <div className="force-light-theme w-full min-w-0">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`h-12 w-full min-w-0 justify-start overflow-hidden rounded-sm text-left font-normal ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${
                !value && !isCurrent ? 'text-muted-foreground' : ''
              }`}
              disabled={disabled}
              aria-label={displayText}
              title={displayText}
            >
              <CalendarIcon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{displayText}</span>
            </Button>
          </PopoverTrigger>

          {/* Na ekranach dotykowych przezroczysty natywny input przykrywa przycisk, więc tapnięcie
              otwiera systemowy wybór miesiąca (koło w iOS, okno w Androidzie) zamiast kalendarza.
              text-base, bo iOS przybliża stronę przy fokusie na polu z czcionką poniżej 16px */}
          <input
            type="month"
            value={value ? value.slice(0, 7) : ''}
            min="1900-01"
            max={nativeMax}
            onChange={(e) => onChange(e.target.value ? `${e.target.value}-01` : '')}
            disabled={disabled || currentChecked}
            aria-label={displayText}
            className="absolute inset-0 hidden h-full w-full cursor-pointer text-base opacity-0 pointer-coarse:block"
          />
        </div>

        <PopoverContent
          align="start"
          className="force-light-theme w-auto rounded-lg border bg-white p-0 shadow-sm"
        >
          {showCurrentToggle && (
            <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
              <div className="flex items-center gap-3">
                <Label htmlFor={checkboxId} className="font-korbin text-sm">
                  {toggleLabel}
                </Label>
                <Switch
                  id={checkboxId}
                  checked={currentChecked}
                  onCheckedChange={(checked) => handleCurrentToggle(checked)}
                />
              </div>
            </div>
          )}

          <div
            className={`p-3 ${currentChecked ? 'pointer-events-none opacity-60 select-none' : ''}`}
            aria-disabled={currentChecked}
          >
            <Calendar
              mode="single"
              defaultMonth={defaultMonth}
              selected={selectedDate}
              onSelect={handleDateSelect}
              captionLayout={captionLayout}
              startMonth={startMonth}
              endMonth={endMonth}
              disabled={(date) => {
                const isBefore1900 = date < new Date(1900, 0, 1);
                const isFuture = !allowFutureDates && date > new Date();
                return isBefore1900 || isFuture;
              }}
              className="font-poppins rounded-lg border shadow-sm"
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Na dotyku popover się nie otwiera, więc przełącznik ląduje pod polem */}
      {showCurrentToggle && (
        <div className="mt-2 hidden items-center gap-3 px-1 pointer-coarse:flex">
          <Label htmlFor={touchSwitchId} className="font-korbin text-sm">
            {toggleLabel}
          </Label>
          <Switch
            id={touchSwitchId}
            checked={currentChecked}
            onCheckedChange={(checked) => handleCurrentToggle(checked)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};
