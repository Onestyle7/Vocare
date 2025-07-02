'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/SupportComponents/SectionsComponents/Header';
import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import { getUserCvs, getCvLimits } from '@/lib/api/cv';
import { CvListItemDto, CvLimits } from '@/lib/types/cv';
import Link from 'next/link';
import Image from 'next/image';

const ResumeDashboard = () => {
  const [cvs, setCvs] = useState<CvListItemDto[]>([]);
  const [limits, setLimits] = useState<CvLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cvData, limitData] = await Promise.all([
          getUserCvs(),
          getCvLimits(),
        ]);
        setCvs(cvData);
        setLimits(limitData);
      } catch (err) {
        console.error('Failed to load CV data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="font-poppins">
      <Header />
      <div className="relative">
        <GridBackgroundDemo />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-10">
          <h1 className="mb-2 text-3xl font-bold">Your resumes</h1>
          {limits && (
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {limits.currentCount} / {limits.maxLimit} used
            </p>
          )}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {cvs.map((cv) => (
                <div
                  key={cv.id}
                  className="rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div className="mb-3 h-40 w-full overflow-hidden rounded border bg-muted">
                    <Image
                      src="/svg/file.svg"
                      alt={cv.name}
                      width={300}
                      height={160}
                      className="h-full w-full object-cover p-4 invert-0 dark:invert"
                    />
                  </div>
                  <h3 className="text-lg font-semibold">{cv.name}</h3>
                  {cv.targetPosition && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cv.targetPosition}
                    </p>
                  )}
                  <Link
                    href={`/resume/${cv.id}`}
                    className="mt-2 inline-block text-sm text-[#915EFF] hover:underline"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeDashboard;
