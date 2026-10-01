import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import RoadmapDetailsPage from '@/features/roadmap/components/RoadmapDetailsPage';
import { getRoadmapByIdQuery } from '@/features/roadmap/dal/queries';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RoadmapDetailRoute({
  params,
}: {
  params: Promise<{ roadmapId: string }>;
}) {
  const { roadmapId } = await params;
  const [error, roadmap] = await getRoadmapByIdQuery(roadmapId);

  if (error?.type === 'Unauthorized') {
    await forceLoginRedirect();
  }

  if (error?.type === 'NotFound') {
    notFound();
  }

  return (
    <main className="h-[100svh] overflow-hidden bg-white text-slate-950">
      <RoadmapDetailsPage
        roadmapId={roadmapId}
        initialRoadmap={roadmap ?? null}
        initialError={error?.message || null}
      />
    </main>
  );
}
