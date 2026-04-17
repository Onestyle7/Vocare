import React from 'react';

import ResumeDashboard from '@/features/resume/components/resumeDashboard';
import Header from '@/components/SectionsComponents/Header';

const page = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <Header />
      <div className="mt-8 w-full sm:border-[0.5px]" />
      <div className="font-poppins -mt-10 p-4 sm:-mt-30 sm:border">
        <ResumeDashboard />
      </div>
    </div>
  );
};

export default page;
