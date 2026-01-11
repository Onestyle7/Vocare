'use client';

import AtsResumeBuilder from '@/components/resume-builder/ATSResumeBuilder';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const CreateResumePage = () => {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      router.replace('/resume');
    }
  }, [isMobile, router]);

  if (isMobile) {
    return null;
  }

  return (
    <div className="font-poppins">
      <AtsResumeBuilder />
    </div>
  );
};

export default CreateResumePage;
