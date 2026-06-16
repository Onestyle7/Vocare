import Header from '@/components/SectionsComponents/Header';
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
      <div className="mx-auto max-w-7xl">
        <Header />
      </div>
      <div className="w-full sm:border-[0.5px]" />
      <div className="font-poppins p-4 sm:border">
        <ResumeDashboard initialCvs={cvs} initialLimits={limits} />
      </div>
    </div>
  );
};

export default page;
