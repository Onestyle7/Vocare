import { getLastRecommendationQuery } from '@/features/assistant/dal/queries';
import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import RoadmapDashboardPage from '@/features/roadmap/components/RoadmapDashboardPage';
import { getUserRoadmapsQuery } from '@/features/roadmap/dal/queries';

export default async function DashboardPage() {
  const [[roadmapsError, roadmaps], [recommendationError, recommendation]] = await Promise.all([
    getUserRoadmapsQuery(),
    getLastRecommendationQuery(),
  ]);

  if (roadmapsError?.type === 'Unauthorized' || recommendationError?.type === 'Unauthorized') {
    await forceLoginRedirect();
  }

  return (
    <div className="w-full">
      <div className="p-4">
        <RoadmapDashboardPage
          initialRoadmaps={roadmaps ?? []}
          initialError={roadmapsError?.message || null}
          availableCareerPaths={recommendation?.careerPaths || []}
        />
      </div>
    </div>
  );
}
