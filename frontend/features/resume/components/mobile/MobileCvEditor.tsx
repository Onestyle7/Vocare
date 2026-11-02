'use client';

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  Loader2,
  MoreHorizontal,
  Save,
  Sparkles,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { ResumePreviewLanguage } from '../../constants';
import { type MobileCvData, MobileCvSections, type MobileCvSetters } from './MobileCvSections';
import { BRAND_GRADIENT } from './MobileSheet';

export type MobileEditorMode = 'edit' | 'preview';

export interface MobileCvEditorProps {
  resumeName: string;
  mode: MobileEditorMode;
  onModeChange: (mode: MobileEditorMode) => void;
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  isBusy: boolean;
  isLoadingProfile: boolean;
  highlightedSection: string | null;
  data: MobileCvData;
  setters: MobileCvSetters;
  sectionOrder: string[];
  privacyTemplate: string;
  showFullDates: boolean;
  onShowFullDatesChange: (full: boolean) => void;
  previewLanguage: ResumePreviewLanguage;
  onPreviewLanguageChange: (language: ResumePreviewLanguage) => void;
  onBack: () => void;
  onSaveNow: () => void;
  onLoadFromProfile: () => void;
  onTailor: () => void;
  onAnalysis: () => void;
  onDownload: () => void;
  /** The live A4 preview (pages + measurement); kept mounted in both modes. */
  preview: ReactNode;
}

/**
 * The CV editor on phones — the web counterpart of the mobile app's creator:
 * sections as cards edited in bottom sheets, a real-page preview and the
 * three main actions in a floating bar. It edits the same state as the
 * desktop editor, so autosave, tailoring, analysis and PDF export are shared.
 */
export function MobileCvEditor(props: MobileCvEditorProps) {
  const { mode, onModeChange } = props;

  return (
    <div className="font-poppins bg-background text-foreground fixed inset-0 z-40 flex flex-col">
      <header className="relative z-20 flex shrink-0 items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <RoundButton label="Wróć do listy CV" onClick={props.onBack}>
          <ArrowLeft className="h-5 w-5" />
        </RoundButton>
        <div className="flex flex-1 justify-center">
          <ModeSwitch mode={mode} onChange={onModeChange} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Więcej opcji"
              className="bg-card border-border flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border shadow-sm active:scale-95"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="font-poppins w-60">
            <DropdownMenuItem
              disabled={props.isBusy}
              onSelect={props.onLoadFromProfile}
              className="gap-3 py-3"
            >
              <UserRound className="h-4 w-4" />
              {props.isLoadingProfile ? 'Importowanie…' : 'Zaimportuj z profilu'}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={props.isBusy}
              onSelect={props.onSaveNow}
              className="gap-3 py-3"
            >
              <Save className="h-4 w-4" />
              Zapisz teraz
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="relative min-h-0 flex-1">
        {/* Edit — kept mounted (and its scroll position) while previewing. */}
        <div
          className={cn(
            'absolute inset-0 overflow-y-auto overscroll-contain px-4 pt-2 pb-32',
            mode !== 'edit' && 'pointer-events-none invisible'
          )}
          aria-hidden={mode !== 'edit'}
        >
          <h1 className="text-[26px] leading-tight font-semibold">{props.resumeName}</h1>
          <SaveStatus status={props.autosaveStatus} onRetry={props.onSaveNow} />

          <button
            type="button"
            onClick={props.onAnalysis}
            className="bg-card border-border mt-5 mb-4 flex w-full cursor-pointer items-center gap-4 rounded-[24px] border p-4 text-left active:scale-[0.99]"
          >
            <span
              className={cn(
                BRAND_GRADIENT,
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white'
              )}
            >
              <ClipboardCheck className="h-5.5 w-5.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">Analiza jakości CV</span>
              <span className="text-muted-foreground block text-[13px] leading-snug">
                Sprawdź mocne strony CV i zobacz, co warto poprawić w pierwszej kolejności.
              </span>
            </span>
            <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />
          </button>

          <MobileCvSections
            data={props.data}
            setters={props.setters}
            sectionOrder={props.sectionOrder}
            highlightedSection={props.highlightedSection}
            privacyTemplate={props.privacyTemplate}
          />
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Zmiany zapisują się automatycznie.
          </p>
        </div>

        {/* Preview — always mounted: pagination is measured from it and the
            PDF export prints its pages. */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col',
            mode !== 'preview' && 'pointer-events-none invisible'
          )}
          aria-hidden={mode !== 'preview'}
        >
          <div className="flex shrink-0 items-center justify-center gap-2 px-4 pb-2">
            <Segmented
              options={[
                { value: 'pl', label: 'PL' },
                { value: 'en', label: 'EN' },
              ]}
              value={props.previewLanguage}
              onChange={(v) => props.onPreviewLanguageChange(v as ResumePreviewLanguage)}
              ariaLabel="Język CV"
            />
            <Segmented
              options={[
                { value: 'full', label: 'Miesiąc i rok' },
                { value: 'year', label: 'Tylko rok' },
              ]}
              value={props.showFullDates ? 'full' : 'year'}
              onChange={(v) => props.onShowFullDatesChange(v === 'full')}
              ariaLabel="Format dat"
            />
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col">{props.preview}</div>
        </div>
      </div>

      <ActionBar
        onTailor={props.onTailor}
        onAnalysis={props.onAnalysis}
        onDownload={props.onDownload}
        disabled={props.isBusy}
      />
    </div>
  );
}

function RoundButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="bg-card border-border flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border shadow-sm active:scale-95"
    >
      {children}
    </button>
  );
}

/** "Edycja | Podgląd" with the brand-gradient puck sliding between them. */
function ModeSwitch({
  mode,
  onChange,
}: {
  mode: MobileEditorMode;
  onChange: (mode: MobileEditorMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tryb edytora"
      className="bg-card border-border relative grid h-11 w-[200px] grid-cols-2 rounded-full border p-1 shadow-sm"
    >
      <span
        aria-hidden
        className={cn(
          BRAND_GRADIENT,
          'absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full shadow-[0_4px_14px_rgba(145,94,255,0.3)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]',
          mode === 'preview' && 'translate-x-full'
        )}
      />
      {(['edit', 'preview'] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={mode === value}
          onClick={() => onChange(value)}
          className={cn(
            'relative z-10 cursor-pointer rounded-full text-sm font-medium transition-colors',
            mode === value ? 'text-white' : 'text-muted-foreground'
          )}
        >
          {value === 'edit' ? 'Edycja' : 'Podgląd'}
        </button>
      ))}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="bg-card border-border flex h-10 items-center rounded-full border p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-full cursor-pointer rounded-full px-3 text-[13px] font-medium transition',
            value === option.value ? cn(BRAND_GRADIENT, 'text-white') : 'text-muted-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SaveStatus({
  status,
  onRetry,
}: {
  status: MobileCvEditorProps['autosaveStatus'];
  onRetry: () => void;
}) {
  return (
    <div
      aria-live="polite"
      className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm"
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Zapisywanie…
        </>
      )}
      {status === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          className="flex cursor-pointer items-center gap-1.5 text-red-500"
        >
          <TriangleAlert className="h-3.5 w-3.5" /> Nie udało się zapisać ·{' '}
          <span className="font-semibold text-[#915EFF]">Ponów</span>
        </button>
      )}
      {(status === 'saved' || status === 'idle') && (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" /> Zapisano
        </>
      )}
    </div>
  );
}

/** Floating bar with the three things you do with a finished CV. */
function ActionBar({
  onTailor,
  onAnalysis,
  onDownload,
  disabled,
}: {
  onTailor: () => void;
  onAnalysis: () => void;
  onDownload: () => void;
  disabled: boolean;
}) {
  const item =
    'flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full text-[11px] text-muted-foreground active:scale-95 disabled:opacity-50';
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),16px)] z-30 flex justify-center px-4">
      <div className="bg-card/85 border-border pointer-events-auto flex h-16 w-full max-w-[400px] items-center gap-1 rounded-full border p-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <button type="button" onClick={onTailor} disabled={disabled} className={item}>
          <Sparkles className="text-foreground h-5 w-5" />
          Dopasuj
        </button>
        <button type="button" onClick={onAnalysis} className={item}>
          <ClipboardCheck className="text-foreground h-5 w-5" />
          Analiza
        </button>
        <button
          type="button"
          onClick={onDownload}
          className={cn(
            BRAND_GRADIENT,
            'flex h-full cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium text-white active:scale-95'
          )}
        >
          <Download className="h-4.5 w-4.5" />
          Pobierz PDF
        </button>
      </div>
    </div>
  );
}
