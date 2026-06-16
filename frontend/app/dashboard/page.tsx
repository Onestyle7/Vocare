import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <Link href={'/dashboard/profile'}>Profil</Link>
      <Link href={'/dashboard/market-analysis'}>Analiza</Link>
      <Link href={'/dashboard/assistant'}>Doradca</Link>
      <Link href={'/dashboard/roadmap'}>Roadmapa</Link>
      <Link href={'/dashboard/resume'}>Kreator</Link>
    </div>
  );
}
