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
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl">
        <Header />
        <div className="mt-8 w-full sm:border-[0.5px]" />
        <div className="font-poppins -mt-10 p-4 sm:-mt-30 sm:border">
          <ResumeDashboard initialCvs={cvs} initialLimits={limits} />
        </div>
      </div>
    </main>
  );
};

export default page;
