import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import DetailedMarketAnalysis from '@/features/market-analysis/components/DetailedMarketAnalysis';
import { getLatestMarketAnalysisQuery } from '@/features/market-analysis/dal/queries';

const page = async () => {
  const [analysisError, analysisData] = await getLatestMarketAnalysisQuery();

  if (analysisError && analysisError.type === 'Unauthorized') {
    await forceLoginRedirect();
  }

  return (
    <main>
      <DetailedMarketAnalysis initialAnalysis={analysisData} initialError={analysisError} />
    </main>
  );
};

export default page;
