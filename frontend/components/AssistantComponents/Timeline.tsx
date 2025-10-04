import { timeline_icon_1 } from '@/app/constants';
import Image from 'next/image';
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';

interface TimelineItem {
  title: string;
  description: string;
  icon?: string;
  status?: 'current' | 'upcoming' | 'completed';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  maxDescriptionLength?: number;
}

function truncateWithEllipsis(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 3)).trimEnd() + '...';
}

const Timeline: React.FC<TimelineProps> = ({
  items,
  className = '',
  maxDescriptionLength = 80,
}) => {
  return (
    <section className={`my-4 w-full sm:mx-auto sm:max-w-5xl ${className}`}>
      {/* Desktop Layout - Horizontal */}
      <div className="hidden w-full flex-row items-center justify-center px-4 sm:flex">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex h-[180px] w-1/4 flex-col items-center justify-start space-y-2"
          >
            <div className="flex flex-row items-center justify-center space-x-2">
              {/* ikona */}
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-800 bg-[#09090b] p-[6px]">
                <div className="flex h-full w-full items-center justify-center rounded-md border bg-[#27272a] text-black">
                  <Image
                    src={item.icon || timeline_icon_1}
                    alt={item.title}
                    width={20}
                    height={20}
                    className="invert"
                  />
                </div>
              </div>

              {/* pasek: dla ostatniego – fade out */}
              {index < items.length - 1 ? (
                <div className="h-[1px] w-[200px] bg-[#dde0ce]" />
              ) : (
                <div className="h-[1px] w-[200px] bg-gradient-to-r from-[#dde0ce] via-[#dde0ce]/50 to-transparent" />
              )}
            </div>

            <div className="flex w-full flex-col items-center justify-start px-2 text-center">
              <h2 className="text-md font-bold text-[#dde0ce]">{item.title}</h2>
              {item.description.length > maxDescriptionLength ? (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <p className="mt-2 cursor-help text-sm text-[#dde0ce]">
                      {truncateWithEllipsis(item.description, maxDescriptionLength)}
                    </p>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 text-left">
                    <p className="ibm-plex-mono-regular text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <h3 className="mt-2 text-sm text-[#dde0ce]">{item.description}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Layout - Vertical */}
      <div className="flex w-full flex-col items-start justify-center space-y-6 sm:hidden">
        {items.map((item, index) => (
          <div key={index} className="flex w-full flex-row items-start justify-start space-x-4">
            {/* Left side - Icon and vertical line */}
            <div className="flex flex-col items-center">
              {/* Box icon */}
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-800 bg-[#09090b] p-[6px]">
                <div className="flex h-full w-full items-center justify-center rounded-md border bg-[#27272a] text-black">
                  <Image
                    src={item.icon || timeline_icon_1}
                    alt={item.title}
                    width={20}
                    height={20}
                    className="invert"
                  />
                </div>
              </div>

              {index < items.length - 1 ? (
                <div className="mt-4 h-[80px] w-[2px] bg-[#dde0ce]" />
              ) : (
                <div className="mt-4 h-[80px] w-[2px] bg-gradient-to-b from-[#dde0ce] via-[#dde0ce]/50 to-transparent" />
              )}
            </div>

            {/* Right side - Content */}
            <div className="flex flex-1 flex-col items-start justify-start pt-2">
              <h2 className="text-lg font-bold text-[#dde0ce]">{item.title}</h2>
              {item.description.length > maxDescriptionLength ? (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <p className="mt-2 cursor-help text-sm leading-relaxed text-[#dde0ce]">
                      {truncateWithEllipsis(item.description, maxDescriptionLength)}
                    </p>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="ibm-plex-mono-regular text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <h3 className="mt-2 text-sm leading-relaxed text-[#dde0ce]">{item.description}</h3>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Timeline;
