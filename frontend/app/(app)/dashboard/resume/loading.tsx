import ResumeDashboardSkeleton from '@/features/resume/components/ResumeDashboardSkeleton';

export default function Loading() {
  return (
    <div className="w-full">
      <div className="w-full" />
      <div className="p-4">
        <ResumeDashboardSkeleton />
      </div>
    </div>
  );
}
