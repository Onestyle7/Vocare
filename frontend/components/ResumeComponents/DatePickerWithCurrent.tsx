'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';

type CaptionLayout = React.ComponentProps<typeof Calendar>['captionLayout'];

interface DatePickerWithCurrentProps {
  value: string;
  onChange: (date: string) => void;
  isCurrent: boolean;
  onCurrentChange: (current: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  showCurrentToggle?: boolean; // show/hide Present switch (default true)
}

export const DatePickerWithCurrent: React.FC<DatePickerWithCurrentProps> = ({
  value,
  onChange,
  isCurrent,
  onCurrentChange,
  placeholder = 'Wybierz datę',
  disabled = false,
  showCurrentToggle = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [captionLayout] = React.useState<CaptionLayout>('dropdown');
  const checkboxId = React.useId();
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

  return (
    <div className="force-light-theme">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`h-12 w-full justify-start rounded-sm text-left font-normal ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${
              !value && !isCurrent ? 'text-muted-foreground' : ''
            }`}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentChecked ? 'Obecnie' : value ? formatDisplayDate(value) : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="force-light-theme w-auto rounded-lg border bg-white p-0 shadow-sm"
        >
          {showCurrentToggle && (
            <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
              <div className="flex items-center gap-3">
                <Label htmlFor={checkboxId} className="font-korbin text-sm">
                  Present
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
              disabled={(date) => date > new Date() || date < new Date(1900, 0, 1)}
              className="font-poppins rounded-lg border shadow-sm"
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
