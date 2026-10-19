'use client';

import { Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const BRAND_GRADIENT =
  'bg-[linear-gradient(135deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)]';

/**
 * Inputs use 16px text: iOS Safari zooms the page into any smaller field on
 * focus, which breaks the sheet layout on phones.
 */
export const fieldClass =
  'w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-[#915EFF] focus:ring-2 focus:ring-[#915EFF]/25';

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Sticky actions under the scrollable body. */
  footer?: ReactNode;
}

/** Bottom sheet used for every edit on the phone editor. */
export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: MobileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        // Focusing the first field would pop the keyboard over the sheet.
        onOpenAutoFocus={(event) => event.preventDefault()}
        // Portalled to <body>, outside the editor's font-poppins wrapper.
        className="font-poppins bg-card text-card-foreground max-h-[92dvh] gap-0 rounded-t-[28px] border-x-0 p-0"
      >
        <div className="bg-muted-foreground/30 mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full" />
        <div className="shrink-0 px-5 pt-3 pb-2 text-center">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          <SheetDescription className={description ? 'mt-1 text-sm' : 'sr-only'}>
            {description ?? title}
          </SheetDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
          {children}
        </div>
        {footer && (
          <div className="border-border shrink-0 border-t px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="text-muted-foreground mb-1.5 block px-1 text-sm">
        {label}
        {required && <span className="ml-0.5 text-[#915EFF]">*</span>}
      </span>
      {children}
      {hint && <span className="text-muted-foreground mt-1.5 block px-1 text-xs">{hint}</span>}
    </label>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      className={cn(fieldClass, 'h-12')}
    />
  );
}

export function AreaField({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(fieldClass, 'resize-none py-3 leading-relaxed')}
    />
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClass, 'h-12 appearance-none pr-10', !value && 'text-muted-foreground')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
    </div>
  );
}

/**
 * Month + year as the editor stores dates (`YYYY-MM-DD`, day 01). A native
 * month input gives the system month/year wheel on iOS and Android.
 */
export function MonthField({
  value,
  onChange,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  /** `YYYY-MM`; future months are blocked unless given. */
  max?: string;
}) {
  return (
    <input
      type="month"
      value={value ? value.slice(0, 7) : ''}
      max={max}
      onChange={(e) => onChange(e.target.value ? `${e.target.value}-01` : '')}
      className={cn(fieldClass, 'h-12 appearance-none [&::-webkit-date-and-time-value]:text-left')}
    />
  );
}

/** A labelled switch row, e.g. "Obecnie" under an end date. */
export function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 px-1">
      <span className="text-foreground text-[15px]">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="data-[state=checked]:bg-[#915EFF]"
      />
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        BRAND_GRADIENT,
        'flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-base font-medium text-white shadow-[0_8px_24px_rgba(132,145,254,0.35)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      {children}
    </button>
  );
}

/**
 * Footer of an entry sheet: save, plus delete and reorder when editing an
 * existing item.
 */
export function EntryFooter({
  onSave,
  canSave = true,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  onSave: () => void;
  canSave?: boolean;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="space-y-2">
      <PrimaryButton onClick={onSave} disabled={!canSave}>
        <Check className="h-5 w-5" /> Zapisz
      </PrimaryButton>
      {(onDelete || onMoveUp || onMoveDown) && (
        <div className="flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-sm text-red-500 active:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> Usuń
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-1">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                aria-label="Przesuń wyżej"
                className="text-muted-foreground active:bg-muted flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                aria-label="Przesuń niżej"
                className="text-muted-foreground active:bg-muted flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
