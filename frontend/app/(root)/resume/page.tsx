'use client';

import ResumePage from '@/components/ResumeComponents/ResumePage';
import Header from '@/components/SupportComponents/SectionsComponents/Header';
import React from 'react';
import CVCreator from './ResumeComponent';

const page = () => {
  return (
    <main>
      {/* <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">In progress</h1>
      </div> */}
      {/* <ResumePage /> */}
      <CVCreator />
    </main>
  );
};

export default page;
