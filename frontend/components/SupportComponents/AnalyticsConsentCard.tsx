'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getAnalyticsConsent, updateAnalyticsConsent } from '@/lib/utils/consent';

interface AnalyticsConsentCardProps {
  className?: string;
}

export function AnalyticsConsentCard({ className }: AnalyticsConsentCardProps) {
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(false);

  useEffect(() => {
    setAnalyticsConsent(getAnalyticsConsent());
  }, []);

  const onToggleAnalyticsConsent = (nextValue: boolean) => {
    setAnalyticsConsent(nextValue);
    updateAnalyticsConsent(nextValue);
    toast.success('Zaktualizowano preferencje ciasteczek');
  };

  return (
    <div
      className={cn(
        'border-border/60 bg-background/70 flex flex-col gap-3 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <label
          htmlFor="analytics-consent-toggle"
          className="text-foreground cursor-pointer text-sm font-medium"
        >
          Zgoda na korzystanie z ciasteczek analitycznych
        </label>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {analyticsConsent
            ? 'Pomagasz nam ulepszać Vocare udostępniając anonimowe dane o ruchu.'
            : 'Włącz, aby pomóc nam ulepszać aplikację na podstawie anonimowych danych analitycznych.'}
        </p>
      </div>
      <Switch
        id="analytics-consent-toggle"
        checked={analyticsConsent}
        onCheckedChange={onToggleAnalyticsConsent}
        aria-label="Toggle analytics consent"
      />
    </div>
  );
}
