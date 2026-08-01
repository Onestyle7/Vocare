import ResumeDashboard from '@/features/resume/components/resumeDashboard';
import { getCvLimitsQuery, getUserCvsQuery } from '@/features/resume/dal/queries';

type PageProps = {
  searchParams: Promise<{ create?: string }>;
};

const page = async ({ searchParams }: PageProps) => {
  const [{ create }, [cvsError, cvsData], [limitsError, limitsData]] = await Promise.all([
    searchParams,
    getUserCvsQuery(),
    getCvLimitsQuery(),
  ]);

  const cvs = cvsError ? [] : cvsData;
  const limits = limitsError ? null : limitsData;

  return (
    <div className="w-full">
      <div className="w-full" />
      <div className="font-poppins p-4">
        <ResumeDashboard
          initialCvs={cvs}
          initialLimits={limits}
          autoOpenCreateDialog={create === '1'}
        />
      </div>
    </div>
  );
};

export default page;
