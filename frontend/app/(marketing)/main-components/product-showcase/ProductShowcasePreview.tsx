import { memo } from 'react';

import type { StepStatus } from '@/lib/types/roadmap';
import { cn } from '@/lib/utils';

import type { ProductFeature, ProductFeatureId } from './data';
import { alternativePaths, cv, market, recommendation, roadmap } from './persona';
import styles from './product-showcase.module.css';

// Always grouped, like the product's counters (pl-PL leaves 4-digit numbers ungrouped).
const formatPln = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const { salaryProgression: levels, entryDifficulty } = market;

// Same labels as the roadmap's step details.
const stepStatusLabels: Record<StepStatus, string> = {
  NotStarted: 'nie rozpoczęto',
  InProgress: 'w trakcie',
  Completed: 'ukończono',
};
const roadmapSteps = roadmap.phases.flatMap(({ steps }) => steps);
const completedSteps = roadmapSteps.filter(({ status }) => status === 'Completed').length;
const currentPhase =
  roadmap.phases.find(({ steps }) => steps.some(({ status }) => status !== 'Completed')) ??
  roadmap.phases[0];

// Every feature is shown as a recorded walkthrough of Marta's step. The poster is the video's
// last frame, shown until playback starts and instead of it for reduced motion; the transcript
// says what the video shows, for screen readers.
const videos: Record<ProductFeatureId, { src: string; poster: string; transcript: string }> = {
  direction: {
    src: '/videos/Doradca%20animacja%20-%20Motion%20design.mp4',
    poster: '/videos/doradca-kariery-poster.webp',
    transcript: [
      `Doradca kariery AI analizuje profil Marty. Główna rekomendacja: ${recommendation.primaryPath}.`,
      recommendation.justification,
      `Kolejne kroki: ${recommendation.nextSteps.join(', ')}.`,
      `Alternatywne ścieżki: ${alternativePaths
        .map(({ careerName, probability }) => `${careerName} (${probability}%)`)
        .join(', ')}.`,
    ].join(' '),
  },
  market: {
    src: '/videos/Analiza%20rynku%20Motion%20Design.mp4',
    poster: '/videos/analiza-rynku-poster.webp',
    transcript: [
      `Analiza rynkowa AI dla ścieżki ${market.careerName}.`,
      `Wynagrodzenia od ${formatPln(levels[0].minSalary)} do ${formatPln(levels.at(-1)!.maxSalary)} PLN, zatrudnienie ${market.employmentRate}%.`,
      `Progresja wynagrodzeń, średnio: ${levels
        .map(({ careerLevel, averageSalary }) => `${careerLevel} ${formatPln(averageSalary)} PLN`)
        .join(', ')}.`,
      `Trudność wejścia: ${entryDifficulty.difficultyScore}/100.`,
      `Brakujące umiejętności: ${entryDifficulty.missingSkills.join(', ')}.`,
      `Czas do gotowości: ${entryDifficulty.estimatedTimeToReady}`,
    ].join(' '),
  },
  roadmap: {
    src: '/videos/Motion%20Design%20Roadmap.mp4',
    poster: '/videos/roadmapa-poster.webp',
    transcript: [
      `Roadmapa na ${roadmap.timeHorizonMonths} mies. dla ścieżki ${roadmap.careerPathName}.`,
      `Fazy: ${roadmap.phases.map(({ title }) => title).join(', ')}.`,
      `Kroki fazy ${currentPhase.title}: ${currentPhase.steps
        .map(({ title, status }) => `${title} (${stepStatusLabels[status]})`)
        .join(', ')}.`,
      `Postęp: ${completedSteps} z ${roadmapSteps.length} kroków, ${Math.round(
        (completedSteps / roadmapSteps.length) * 100
      )}%.`,
    ].join(' '),
  },
  resume: {
    src: '/videos/Kreator%20CV%20Motion%20Design.mp4',
    poster: '/videos/kreator-cv-poster.webp',
    transcript: [
      `Kreator CV tworzy CV Marty pod ofertę ${cv.targetPosition} (${cv.offer}).`,
      `Umiejętności: ${cv.skills.join(', ')}.`,
      // The audit's tier label is "Bardzo mocne CV" from 85 points.
      `Analiza jakości CV: wynik ogólny ${cv.analysis.overallScore}/100${
        cv.analysis.overallScore >= 85 ? ', bardzo mocne CV' : ''
      }; dopasowanie do stanowiska ${cv.analysis.targetPositionScore}/100.`,
    ].join(' '),
  },
};

// Features are constants, so a tab change never re-renders the preview.
function ProductShowcasePreview({ feature }: { feature: ProductFeature }) {
  const video = videos[feature.id];

  return (
    <div
      role="group"
      aria-label={feature.screen}
      className={cn(
        styles.videoWindow,
        'relative aspect-1548/1000 w-full min-w-0 overflow-hidden rounded-[20px] bg-white'
      )}
    >
      <video
        data-tour-video
        src={video.src}
        poster={video.poster}
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />
      <p className="sr-only">{video.transcript}</p>
    </div>
  );
}

export default memo(ProductShowcasePreview);
