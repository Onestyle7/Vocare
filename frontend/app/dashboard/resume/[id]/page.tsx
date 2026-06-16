import { notFound } from 'next/navigation';

import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import { getCvDetailsQuery } from '@/features/resume/dal/queries';

import CVCreator from '../../../../features/resume/components/ResumeComponent';

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const [error, cv] = await getCvDetailsQuery(id);

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
