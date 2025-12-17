'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 rounded-full border px-2 py-1 text-xs uppercase">
      {(['pl', 'en'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLanguage(value)}
          className={cn(
            'rounded-full px-3 py-1 transition-colors',
            language === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={language === value}
        >
          {value}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitch;
