import ResumeDashboard from '@/features/resume/components/resumeDashboard';
import { getCvLimitsQuery, getUserCvsQuery } from '@/features/resume/dal/queries';

const page = async () => {
  const [[cvsError, cvsData], [limitsError, limitsData]] = await Promise.all([
    getUserCvsQuery(),
    getCvLimitsQuery(),
  ]);

  const cvs = cvsError ? [] : cvsData;
  const limits = limitsError ? null : limitsData;

  return (
    <div className="w-full">
      <div className="w-full" />
      <div className="font-poppins p-4">
        <ResumeDashboard initialCvs={cvs} initialLimits={limits} />
      </div>
    </div>
  );
};

export default page;
