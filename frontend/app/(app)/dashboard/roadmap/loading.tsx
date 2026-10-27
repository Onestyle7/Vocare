import RoadmapDashboardSkeleton from '@/features/roadmap/components/RoadmapDashboardSkeleton';

export default function Loading() {
  return (
    <div className="w-full">
      <div className="p-4">
        <RoadmapDashboardSkeleton />
      </div>
    </div>
  );
}
