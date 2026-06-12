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
      <div className="mx-auto">
        <div className="font-poppins p-4">
          <RoadmapDashboardPage
            initialRoadmaps={roadmaps ?? []}
            initialError={roadmapsError?.message || null}
            availableCareerPaths={recommendation?.careerPaths || []}
          />
        </div>
      </div>
    </main>
  );
}
