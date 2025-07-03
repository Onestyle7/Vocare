'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/components/SupportComponents/SectionsComponents/Header';
import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import { getUserCvs, getCvLimits } from '@/lib/api/cv';
import { CvListItemDto, CvLimits } from '@/lib/types/cv';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, FileText, Eye, MoreVertical, Calendar } from 'lucide-react';

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

  const SkeletonCard = () => (
    <div className="group backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 border border-white/20 dark:border-gray-700/30 rounded-2xl p-5 transition-all duration-300">
      <div className="mb-4 h-28 w-full animate-pulse rounded-xl bg-white/30 dark:bg-gray-800/50" />
      <div className="space-y-3">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/30 dark:bg-gray-800/50" />
        <div className="h-2 w-1/2 animate-pulse rounded-full bg-white/20 dark:bg-gray-800/30" />
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-white/20 dark:border-gray-700/30 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 text-center">
      <FileText className="mb-3 h-10 w-10 text-gray-500/70 dark:text-gray-400/70" />
      <h3 className="mb-2 text-base font-medium text-gray-800 dark:text-gray-200">
        No resumes yet
      </h3>
      <p className="mb-4 text-sm text-gray-600/80 dark:text-gray-400/80">
        Create your first resume to get started
      </p>
      <Link
        href="/resume/create"
        className="inline-flex items-center gap-2 rounded-xl backdrop-blur-sm bg-[#915EFF]/90 hover:bg-[#915EFF] px-4 py-2 text-sm font-medium text-white transition-all duration-200 border border-[#915EFF]/20"
      >
        <Plus className="h-4 w-4" />
        Create Resume
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <div className="relative font-poppins">
        <GridBackgroundDemo />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Your Resumes
              </h1>
              {limits && (
                <div className="mt-3 flex items-center gap-3 text-sm text-gray-600/80 dark:text-gray-400/80">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#915EFF]/70" />
                    <span className="font-light">
                      {limits.currentCount} of {limits.maxLimit} used
                    </span>
                  </div>
                  {limits.currentCount < limits.maxLimit && (
                    <div className="h-0.5 w-20 overflow-hidden rounded-full bg-white/30 dark:bg-gray-700/50">
                      <div
                        className="h-full bg-gradient-to-r from-[#915EFF]/70 to-[#915EFF] transition-all duration-500"
                        style={{
                          width: `${(limits.currentCount / limits.maxLimit) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {!loading && cvs.length > 0 && (
              <Link
                href="/resume/create"
                className="inline-flex items-center gap-2 rounded-xl backdrop-blur-sm bg-white/60 hover:bg-white/80 dark:bg-gray-800/60 dark:hover:bg-gray-800/80 border border-white/30 dark:border-gray-700/50 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 hover:shadow-lg shadow-black/5"
              >
                <Plus className="h-4 w-4" />
                New Resume
              </Link>
            )}
          </div>

          {/* Content Section */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : cvs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cvs.map((cv) => (
                <Link
                  key={cv.id}
                  href={`/resume/${cv.id}`}
                  className="group relative block backdrop-blur-sm bg-white/40 hover:bg-white/60 dark:bg-gray-900/40 dark:hover:bg-gray-900/60 border border-white/20 dark:border-gray-700/30 hover:border-white/40 dark:hover:border-gray-700/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm bg-gradient-to-br from-[#915EFF]/20 to-[#7c4ddb]/20 border border-[#915EFF]/20">
                      <FileText className="h-5 w-5 text-[#915EFF]/80" />
                    </div>
                    <button className="opacity-0 transition-all duration-200 group-hover:opacity-60 hover:opacity-100">
                      <MoreVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </button>
                  </div>

                  {/* Preview Area */}
                  <div className="mb-4 h-28 w-full overflow-hidden rounded-xl backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border border-white/20 dark:border-gray-700/30">
                    <div className="flex h-full items-center justify-center">
                      <Image
                        src="/svg/file.svg"
                        alt={cv.name}
                        width={40}
                        height={40}
                        className="opacity-30 invert-0 dark:invert"
                      />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 text-sm">
                      {cv.name}
                    </h3>
                    {cv.targetPosition && (
                      <p className="text-xs text-gray-600/80 dark:text-gray-400/80 line-clamp-1 font-light">
                        {cv.targetPosition}
                      </p>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500/70 dark:text-gray-500/70">
                      <Calendar className="h-3 w-3" />
                      <span className="font-light">Updated recently</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-lg backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 border border-white/30 dark:border-gray-700/40 px-3 py-1.5 text-xs font-light text-gray-700 dark:text-gray-300">
                      <Eye className="h-3 w-3" />
                      View
                    </div>
                  </div>

                  {/* Subtle Hover Glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#915EFF]/5 to-transparent" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeDashboard;