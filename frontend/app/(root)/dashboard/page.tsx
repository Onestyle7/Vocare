import Header from '@/components/SectionsComponents/Header';
import RoadmapDashboardPage from '@/components/roadmap/RoadmapDashboardPage';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <Header />
      <RoadmapDashboardPage />
    </main>
  );
}
