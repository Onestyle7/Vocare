import AssistantPage from '@/features/assistant/components/MainPageAssisstant';
import {
  getDetailedJobMatchesQuery,
  getLastRecommendationQuery,
} from '@/features/assistant/dal/queries';
import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';

export default async function Page() {
  const [[recommendationError, recommendation], [jobMatchesError, jobMatches]] = await Promise.all([
    getLastRecommendationQuery(),
    getDetailedJobMatchesQuery(),
  ]);

  // TODO: Obsługa błędów rekomendacji
  if (recommendationError && recommendationError.type === 'Unauthorized') {
    await forceLoginRedirect();
  }

  if (jobMatchesError && jobMatchesError.type === 'Unauthorized') {
    await forceLoginRedirect();
  }

  return (
    <main>
      <AssistantPage
        initialRecommendation={recommendation}
        recommendationError={recommendationError?.message}
        initialJobMatches={jobMatches ?? []}
        jobMatchesError={jobMatchesError?.message}
      />
    </main>
  );
}
