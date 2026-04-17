'use client';

import { useParams } from 'next/navigation';

import RoadmapDetailsPage from '@/components/roadmap/RoadmapDetailsPage';

export default function RoadmapDetailRoute() {
  const params = useParams();
  const roadmapId = typeof params.roadmapId === 'string' ? params.roadmapId : '';

  return (
    <main className="h-[100svh] overflow-hidden bg-white text-slate-950">
      <RoadmapDetailsPage roadmapId={roadmapId} />
    </main>
  );
}
