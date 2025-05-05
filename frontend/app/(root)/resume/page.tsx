'use client';

import { ResumeDetails } from '@/components/ResumeComponents/ResumeDetails';
import { ResumeFormModal } from '@/components/ResumeComponents/ResumeFormModal';
import Header from '@/components/SectionsComponents/Header';
import { CvDto } from '@/lib/types/resume';
import { useState } from 'react';

export default function ResumePage() {
  const [cv, setCv] = useState<CvDto | null>(null);

  return (
    <>
      <Header />
      <div className="mx-auto flex h-[80vh] max-w-4xl flex-col items-center justify-center p-6">
        <h1 className="mb- mb-4 text-2xl font-bold sm:text-3xl">Create your resume with AI</h1>
        <ResumeFormModal onGenerated={setCv} />
        {cv && (
          <div className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold">Twoje wygenerowane CV</h2>
            <ResumeDetails cv={cv} />
          </div>
        )}
      </div>
    </>
  );
}
