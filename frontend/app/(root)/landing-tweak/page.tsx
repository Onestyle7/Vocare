'use client';

import { ModeToggle } from '@/components/SupportComponents/ModeToggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/auth';
import { NavLinks } from '@/app/constants';

export default function Home() {
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    router.push('/sign-in');
  };

  return (
    <div className="flex h-screen items-center justify-center space-x-4">
      <Button className="bg-red-500" onClick={handleLogout}>
        Log Out
      </Button>
      <ModeToggle />
      {NavLinks.map((item) => (
        <div className="flex" key={item.label}>
          <Link href={item.url}>{item.label}</Link>
        </div>
      ))}
    </div>
  );
}
