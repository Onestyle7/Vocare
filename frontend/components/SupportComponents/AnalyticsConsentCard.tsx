'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  getAdsConsent,
  getAnalyticsConsent,
  updateAdsConsent,
  updateAnalyticsConsent,
} from '@/lib/utils/consent';

interface ConsentCardProps {
  className?: string;
}

interface ConsentToggleCardProps extends ConsentCardProps {
  id: string;
  label: string;
  grantedDescription: string;
  deniedDescription: string;
  getConsent: () => boolean;
  updateConsent: (granted: boolean) => void;
}

function ConsentToggleCard({
  className,
  id,
  label,
  grantedDescription,
  deniedDescription,
  getConsent,
  updateConsent,
}: ConsentToggleCardProps) {
  const [granted, setGranted] = useState<boolean>(false);

  useEffect(() => {
    setGranted(getConsent());
  }, [getConsent]);

  const onToggle = (nextValue: boolean) => {
    setGranted(nextValue);
    updateConsent(nextValue);
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
        <label htmlFor={id} className="text-foreground cursor-pointer text-sm font-medium">
          {label}
        </label>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {granted ? grantedDescription : deniedDescription}
        </p>
      </div>
      <Switch id={id} checked={granted} onCheckedChange={onToggle} />
    </div>
  );
}

export function AnalyticsConsentCard({ className }: ConsentCardProps) {
  return (
    <ConsentToggleCard
      className={className}
      id="analytics-consent-toggle"
      label="Cookies analityczne (Google Analytics)"
      grantedDescription="Pomagasz nam ulepszać Vocare, udostępniając dane o tym, jak korzystasz z serwisu."
      deniedDescription="Włącz, aby pomóc nam ulepszać Vocare na podstawie statystyk ruchu w serwisie."
      getConsent={getAnalyticsConsent}
      updateConsent={updateAnalyticsConsent}
    />
  );
}

export function AdsConsentCard({ className }: ConsentCardProps) {
  return (
    <ConsentToggleCard
      className={className}
      id="ads-consent-toggle"
      label="Cookies reklamowe (TikTok, Meta)"
      grantedDescription="TikTok i Meta otrzymują informacje o Twoich wizytach i działaniach w Vocare, dzięki czemu mierzymy skuteczność naszych reklam."
      deniedDescription="Włącz, aby pomóc nam mierzyć skuteczność reklam Vocare na TikToku, Facebooku i Instagramie."
      getConsent={getAdsConsent}
      updateConsent={updateAdsConsent}
    />
  );
}
