import Header from '@/components/SectionsComponents/Header';
import RoadmapDashboardPage from '@/components/roadmap/RoadmapDashboardPage';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl">
        <Header />
        <div className="mt-8 w-full sm:border-[0.5px]" />
        <div className="font-poppins -mt-10 p-4 sm:-mt-30 sm:border">
          <RoadmapDashboardPage />
        </div>
      </div>
    </main>
  );
}
