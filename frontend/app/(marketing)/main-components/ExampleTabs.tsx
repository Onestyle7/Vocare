'use client';

import { FileText, Route, Signpost } from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const tabs = [
  { id: 'path', label: 'Ścieżka', icon: Signpost },
  { id: 'plan', label: 'Plan', icon: Route },
  { id: 'resume', label: 'CV', icon: FileText },
] as const;

export default function ExampleTabs({
  panels,
}: {
  panels: Record<(typeof tabs)[number]['id'], ReactNode>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  function selectTab(index: number) {
    if (index === activeIndex) return;
    setActiveIndex(index);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index + tabs.length - 1) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectTab(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="min-w-0 flex-1">
      <div
        role="tablist"
        aria-label="Etapy przykładowej zmiany kariery"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-[#111216] p-1.5"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={`${id}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls={`${id}-panel-${tab.id}`}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => selectTab(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'flex min-h-12 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B2AEFF] motion-reduce:transition-none sm:text-[15px]',
              activeIndex === index
                ? 'bg-[#29283E] text-[#D4D0FF]'
                : 'text-[#A6A8B3] hover:bg-white/5 hover:text-[#F1F4FF]'
            )}
          >
            <tab.icon size={16} aria-hidden="true" className="hidden shrink-0 min-[360px]:block" />
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          id={`${id}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${tab.id}`}
          hidden={activeIndex !== index}
          tabIndex={0}
          className="mt-6 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B2AEFF] lg:min-h-96"
        >
          {panels[tab.id]}
        </div>
      ))}
    </div>
  );
}
