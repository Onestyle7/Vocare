'use client';

import { ExternalLink, Briefcase, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScoredJobOffer } from '@/lib/types/jobOffers';

type Props = {
  offer: ScoredJobOffer;
  addedLabel?: string; // np. "Data dodania"
  className?: string;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function JobOfferGlassCard({
  offer,
  addedLabel = 'Data dodania',
  className,
}: Props) {
  const locations = offer.locations?.filter(Boolean) ?? [];
  const primaryLocation = locations.slice(0, 1).join(', ');
  const locationSuffix =
    locations.length > 1 ? ` +${locations.length - 1}` : locations.length === 0 ? 'Brak' : '';

  const published = offer.publishedAt ? formatDate(offer.publishedAt) : '';

  const handleOpen = () => {
    if (!offer.url) return;
    window.open(offer.url, '_blank', 'noreferrer');
  };

  return (
    <div
      className={[
        'font-grotesk relative mx-auto flex h-[360px] w-full max-w-[500px] rounded-3xl border border-white/20',
        'bg-[linear-gradient(145deg,rgba(10,13,22,0.95)_0%,rgba(10,13,22,0.6)_55%,rgba(14,20,34,0.35)_100%)]',
        'p-1 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:h-[400px]',
        className ?? '',
      ].join(' ')}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-transparent"
      />

      {/* TOP */}
      <div className="relative z-10 h-[70%] w-full overflow-hidden rounded-[24px] border border-white/20 bg-white/5 backdrop-blur-xl sm:h-[78%]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(145,94,255,0.35)_0%,rgba(145,94,255,0.18)_40%,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent"
        />

        {/* content inside the “glass” */}
        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="space-y-1">
            <p className="text-xs text-gray-200/80">{offer.companyName}</p>

            <h5 className="line-clamp-2 text-lg leading-snug text-white sm:text-xl">
              {offer.title}
            </h5>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-gray-200/80">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {primaryLocation}
                {locationSuffix}
              </span>

              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {offer.category} · {offer.seniorityLevel}
              </span>
            </div>
          </div>

          {/* badges bottom-left inside top */}
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-[10px]! px-2.5 py-1 text-[11px] whitespace-nowrap">
              {offer.matchScore}%
            </Badge>

            {offer.salaryMin != null || offer.salaryMax != null ? (
              <Badge
                variant="secondary"
                className="rounded-[10px]! bg-white/10 px-2.5 py-1 text-[11px] text-white"
              >
                Widełki dostępne
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-[10px]! bg-white/10 px-2.5 py-1 text-[11px] text-white/80"
              >
                Brak widełek
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* bottom left date */}
      <div className="absolute bottom-6 left-4 z-10 flex items-center justify-center sm:bottom-8 sm:left-6">
        <p className="text-xs text-gray-200/90 sm:text-sm">
          {addedLabel}: {published || '—'}
        </p>
      </div>

      {/* bottom right CTA */}
      <div className="absolute right-4 bottom-4 z-10 flex items-center justify-center sm:right-6 sm:bottom-[20px]">
        <button
          type="button"
          onClick={handleOpen}
          disabled={!offer.url}
          className={[
            'flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white',
            'shadow-sm backdrop-blur-md transition hover:border-white/50 hover:bg-white/20',
            'sm:px-6 sm:py-3 sm:text-base',
            !offer.url ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ].join(' ')}
        >
          Zobacz ofertę
          <ExternalLink className="ml-1 scale-75" />
        </button>
      </div>
    </div>
  );
}
