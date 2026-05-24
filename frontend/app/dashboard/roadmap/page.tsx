import { Suspense } from 'react';

import Header from '@/components/SectionsComponents/Header';
import { getLastRecommendationQuery } from '@/features/assistant/dal/queries';
import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import RoadmapDashboardPage from '@/features/roadmap/components/RoadmapDashboardPage';
import { getUserRoadmapsQuery } from '@/features/roadmap/dal/queries';

export default async function DashboardPage() {
  const [roadmapsError, roadmaps] = await getUserRoadmapsQuery();
  const [recommendationError, recommendation] = await getLastRecommendationQuery();

  if (roadmapsError?.type === 'Unauthorized' || recommendationError?.type === 'Unauthorized') {
    await forceLoginRedirect();
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl">
        <Header />
        <div className="mt-8 w-full sm:border-[0.5px]" />
        <div className="font-poppins -mt-10 p-4 sm:-mt-30 sm:border">
          <Suspense fallback={null}>
            <RoadmapDashboardPage
              initialRoadmaps={roadmaps ?? []}
              initialError={roadmapsError?.message || null}
              availableCareerPaths={recommendation?.careerPaths || []}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
