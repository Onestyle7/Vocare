'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import CollapsibleButton from './CollapsibleButton';
import { CareerPath } from '@/lib/types/recommendation';
import Image from 'next/image';
import ReusableCard from '../MarketComponents/AssistantCards';
import HorizontalCarousel from './HorizontalCarousel';
import SwotAnalysis from '../MarketComponents/SwotAnalysis';
import { CareerPathMatchResult, ConfidenceLevel, ScoredJobOffer } from '@/lib/types/jobOffers';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  ExternalLink,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface CareerPathSectionProps {
  path: CareerPath;
  index: number;
  matchResult?: CareerPathMatchResult;
  offersLoading?: boolean;
  offersError?: string | null;
}

export default function CareerPathSection({
  path,
  index,
  matchResult,
  offersLoading = false,
  offersError,
}: CareerPathSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const leftImg = `/images/cone-${3 + 2 * index}.png`;
  const rightImg = `/images/cone-${4 + 2 * index}.png`;

  const toggleCollapse = () => {
    if (!contentRef.current || !contentWrapperRef.current) return;

    if (isCollapsed) {
      gsap.set(contentWrapperRef.current, { height: 'auto', visibility: 'visible' });
      const height = contentWrapperRef.current.offsetHeight;
      gsap.fromTo(
        contentWrapperRef.current,
        { height: 0, opacity: 0 },
        {
          height,
          opacity: 1,
          duration: 0.5,
          ease: 'power4.out',
          onComplete: () => {
            if (contentWrapperRef.current) gsap.set(contentWrapperRef.current, { height: 'auto' });
          },
        }
      );
    } else {
      const height = contentWrapperRef.current.offsetHeight;
      gsap.fromTo(
        contentWrapperRef.current,
        { height, opacity: 1 },
        {
          height: 0,
          opacity: 0,
          duration: 0.5,
          ease: 'power4.in',
          onComplete: () => {
            if (contentWrapperRef.current)
              gsap.set(contentWrapperRef.current, { visibility: 'hidden' });
          },
        }
      );
    }

    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    if (contentRef.current && contentWrapperRef.current) {
      if (!isCollapsed) {
        gsap.set(contentWrapperRef.current, { height: 'auto' });
        const height = contentWrapperRef.current.offsetHeight;
        gsap.set(contentWrapperRef.current, { height });
      } else {
        gsap.set(contentWrapperRef.current, { height: 0 });
      }
    }
  }, [isCollapsed]);

  const cards = [
    {
      title: 'Wymagane umiejętności',
      items: path.requiredSkills,
      imageSrc: '/images/card-assistant-1.png',
      badgeText: 'Wymagane umiejętności',
    },
    {
      title: 'Zalecane kursy',
      items: path.recommendedCourses,
      imageSrc: '/images/card-assistant-2.png',
      badgeText: 'Zalecane kursy',
    },
    {
      title: 'Analiza rynku',
      items: path.marketAnalysis,
      imageSrc: '/images/card-assistant-3.png',
      badgeText: 'Analiza rynku',
    },
  ];

  const formatSalary = (offer: ScoredJobOffer) => {
    if (offer.salaryMin == null && offer.salaryMax == null) return 'Brak widełek';
    const formatter = new Intl.NumberFormat('pl-PL', {
      maximumFractionDigits: 0,
    });
    const min = offer.salaryMin != null ? formatter.format(offer.salaryMin) : null;
    const max = offer.salaryMax != null ? formatter.format(offer.salaryMax) : null;
    const currency = offer.salaryCurrency ? ` ${offer.salaryCurrency}` : '';

    if (min && max) return `${min}–${max}${currency}`;
    if (min) return `od ${min}${currency}`;
    if (max) return `do ${max}${currency}`;
    return 'Brak widełek';
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const stripHtml = (value?: string) => {
    if (!value) return '';
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const confidenceMeta: Record<
    ConfidenceLevel,
    {
      label: string;
      shortLabel: string;
      className: string;
      ArrowIcon: typeof ArrowUpRight;
      arrowClassName: string;
    }
  > = {
    high: {
      label: 'Wysoka pewność',
      shortLabel: 'Wysoka pewność',
      className: 'bg-primary text-black hover:bg-primary',
      ArrowIcon: ArrowUpRight,
      arrowClassName: 'text-emerald-500',
    },
    medium: {
      label: 'Średnia pewność',
      shortLabel: 'Średnia pewność',
      className: 'bg-primary text-black hover:bg-primary',
      ArrowIcon: ArrowRight,
      arrowClassName: 'text-amber-500',
    },
    low: {
      label: 'Niska pewność',
      shortLabel: 'Niska pewność',
      className: 'bg-primary text-black hover:bg-primary',
      ArrowIcon: ArrowDownRight,
      arrowClassName: 'text-orange-500',
    },
    very_low: {
      label: 'Bardzo niska pewność',
      shortLabel: 'B. niska pewność',
      className: 'bg-primary text-black hover:bg-primary',
      ArrowIcon: ArrowDown,
      arrowClassName: 'text-rose-500',
    },
  };

  const renderSkillBadge = (label: string, items: string[], tone: string) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`border-white/10 px-2 py-0.5 text-[11px] whitespace-nowrap ${tone} ${
              items.length === 0 ? 'opacity-50' : ''
            }`}
          >
            {label} {items.length}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1 text-xs">
            {items.length === 0 ? (
              <span>Brak</span>
            ) : (
              items.slice(0, 8).map((item, idx) => <div key={`${label}-${idx}`}>{item}</div>)
            )}
            {items.length > 8 && <div>+{items.length - 8} więcej</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderOfferCard = (offer: ScoredJobOffer) => {
    const locations = offer.locations?.filter(Boolean) ?? [];
    const primaryLocation = locations.slice(0, 1).join(', ');
    const locationSuffix = locations.length > 1 ? ` +${locations.length - 1}` : '';
    const confidence = confidenceMeta[offer.confidenceLevel] ?? confidenceMeta.medium;

    const bonusLabels =
      offer.matchDetails?.bonusFactors?.map((bonus) => {
        if (bonus === 'categoryMatch') return 'Kategoria';
        if (bonus === 'seniorityMatch') return 'Seniority';
        return bonus;
      }) ?? [];

    return (
      <div
        key={offer.id}
        className="font-grotesk relative flex w-full flex-col rounded-[18px] border p-1 backdrop-blur-xl transition-all hover:shadow-2xl"
      >
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden rounded-[14px] border bg-white/2 p-5 backdrop-blur-xl">
          <div className="relative mb-2 flex min-h-[56px] justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                {offer.companyName}
              </p>
              <h5 className="line-clamp-2 text-base leading-tight font-bold text-white sm:text-lg">
                {offer.title}
              </h5>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] font-bold text-gray-500">Widełki</p>
              <p className="text-xs font-bold whitespace-nowrap text-[#915EFF]">
                {formatSalary(offer)}
              </p>
            </div>
          </div>

          <div className="relative mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-300/80">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {primaryLocation}
              {locationSuffix}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {offer.category}
            </span>
          </div>

          <div className="relative mb-6">
            <p className="line-clamp-3 text-[12px] leading-relaxed text-gray-400">
              {stripHtml(offer.briefDescription) ||
                'Szczegóły oferty dostępne po przejściu do ogłoszenia.'}
            </p>
          </div>

          <div className="relative mt-auto space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/[0.85] rounded-full border-none px-2 py-0.5 text-[10px] text-black">
                {offer.matchScore}% Match
              </Badge>
              <Badge
                variant="secondary"
                className="bg-primary/[0.85] hover:bg-primary/[0.85]! rounded-full border-none px-2 py-0.5 text-[10px] text-black"
              >
                {confidence.shortLabel}
              </Badge>
            </div>

            <div className="h-[4px] w-full rounded-full bg-white/10">
              <div
                className="bg-primary/[0.8] h-full rounded-full"
                style={{ width: `${offer.matchScore}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {renderSkillBadge('Dopas.', offer.matchDetails?.matchedSkills ?? [], 'text-white')}
              {renderSkillBadge('Braki', offer.matchDetails?.missingSkills ?? [], 'text-white')}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center justify-between px-5 py-4">
          <div className="flex flex-col space-y-0.5">
            <p className="text-[10px] font-bold tracking-tight text-gray-500">Opublikowano</p>
            <p className="text-sm font-semibold text-gray-200">
              {formatDate(offer.publishedAt) || '—'}
            </p>
          </div>

          {offer.url && (
            <button
              onClick={() => window.open(offer.url, '_blank')}
              className="group flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition-all"
            >
              Zobacz ofertę
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="clip-corner-bevel mb-4 flex flex-col overflow-hidden rounded-[28px] border-t border-b border-l shadow-sm sm:border md:flex-row">
      <div className="relative flex items-center justify-center overflow-hidden p-4 md:w-1/6 md:border-r md:p-8">
        <Image
          src={leftImg}
          alt="decor"
          width={148}
          height={148}
          className="pointer-events-none absolute -top-2 -left-14 z-10"
        />
        <Image
          src={rightImg}
          alt="decor"
          width={148}
          height={148}
          className="pointer-events-none absolute -right-8 bottom-2 z-10 -rotate-12 sm:-right-14 sm:-bottom-8"
        />
        <span className="font-korbin relative z-20 rounded-xl border border-r-6 border-b-6 px-5 py-3 text-4xl font-bold text-white md:text-6xl">
          {index + 1}
        </span>
      </div>

      <div className="p-4 max-md:border-t md:w-5/6 md:p-6">
        <div className="flex flex-row items-center justify-between">
          <h2 className="font-grotesk mb-1 text-xl">Alternatywna ścieżka</h2>
          <CollapsibleButton isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        </div>

        <h3 className="text-md ibm-plex-mono-regular mb-2 font-medium text-[#915EFF] sm:text-lg">
          {path.careerName}
        </h3>
        <p className="font-grotesk text-gray-500">{path.description}</p>

        <div
          ref={contentWrapperRef}
          className="overflow-hidden"
          style={{
            height: isCollapsed ? 0 : 'auto',
            opacity: isCollapsed ? 0 : 1,
            visibility: isCollapsed ? 'hidden' : 'visible',
          }}
        >
          <div ref={contentRef} className="space-y-5">
            <p className="ibm-plex-mono-regular mt-2">
              <strong>Prawdopodobieństwo sukcesu:</strong> {path.probability}%
            </p>

            <HorizontalCarousel desktopCardsPerView={2.33}>
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className="min-w-[calc(100%/var(--cards))] shrink-0 snap-start lg:min-w-[calc(87%/var(--cards-lg))]"
                >
                  <div className="h-full">
                    <ReusableCard data={card} />
                  </div>
                </div>
              ))}
            </HorizontalCarousel>

            <div className="mt-4">
              <h4 className="mb-3 font-bold">Analiza SWOT:</h4>
              <SwotAnalysis data={path.swot} className="ibm-plex-mono-regular" />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h4 className="font-grotesk text-lg font-semibold">Dopasowane oferty pracy</h4>
                  <p className="font-grotesk text-xs text-gray-500">
                    Scoring: embeddingi, umiejętności, kategoria i seniority
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <Badge
                    variant="secondary"
                    className="bg-white/5 px-2 py-0.5 whitespace-nowrap text-gray-200"
                  >
                    Średnio {Math.round(matchResult?.averageMatchScore ?? 0)}%
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/10 px-2 py-0.5 whitespace-nowrap text-gray-300"
                  >
                    Top {matchResult?.highQualityMatches ?? 0}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/10 px-2 py-0.5 whitespace-nowrap text-gray-300"
                  >
                    {matchResult?.totalOffersInCategory ?? 0} w kategorii
                  </Badge>
                </div>
              </div>

              {offersError && <div className="mt-3 text-xs text-rose-200">{offersError}</div>}

              {!offersError && matchResult?.dataQualityWarning && (
                <div className="font-grotesk mt-3 inline-flex items-center gap-2 text-xs text-amber-200">
                  <Sparkles className="h-3 w-3" />
                  {matchResult.dataQualityWarning}
                </div>
              )}

              {offersLoading && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[0, 1].map((idx) => (
                    <Card key={`skeleton-${idx}`} className="border-white/10 bg-white/[0.03]">
                      <CardHeader className="space-y-3 pb-3">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-2 w-full" />
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-8 w-28" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!offersLoading &&
                !offersError &&
                (matchResult?.matchedOffers?.length ?? 0) === 0 && (
                  <div className="font-grotesk mt-4 text-sm text-gray-400">
                    Brak dopasowanych ofert dla tej ścieżki.
                  </div>
                )}

              {!offersLoading && !offersError && (matchResult?.matchedOffers?.length ?? 0) > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {matchResult?.matchedOffers.map(renderOfferCard)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
