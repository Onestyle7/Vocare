import { notFound } from 'next/navigation';

import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import CVCreator from '@/features/resume/components/ResumeComponent';
import { getCvDetailsQuery } from '@/features/resume/dal/queries';

interface ResumeDetailPageProps {
  params: Promise<{ resumeId: string }>;
}

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const { resumeId } = await params;

  if (!resumeId) {
    notFound();
  }

  const [error, cv] = await getCvDetailsQuery(resumeId);

  if (error && error.type === 'Unauthorized') {
    await forceLoginRedirect();
  }

  if (!cv) {
    notFound();
  }

  return (
    <div className="font-poppins">
      <div className="relative z-10">
        <CVCreator initialCv={cv} />
      </div>
    </div>
  );
}
