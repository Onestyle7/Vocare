import Image from 'next/image';
import Link from 'next/link';

import { logo } from '@/features/marketing/constants/countries';
import MobileNav from '@/components/MobileComponents/MobileNav';

export default function Header() {
  return (
    <header className="font-korbin relative z-100 border-b-2">
      <nav className="font-korbin mx-2 hidden items-center justify-between space-x-10 py-8 md:mx-0 md:flex">
        <Link href="/" aria-label="Go to homepage">
          <Image
            src={logo}
            alt="vocare"
            width={184}
            height={184}
            className="pointer-events-none invert dark:invert-0"
            priority
          />
        </Link>
        <div className="space-x-4">
          <Link className="invisible text-[18px] font-normal uppercase md:visible" href="/pricing">
            pricing
          </Link>
          <Link className="invisible text-[18px] font-normal uppercase md:visible" href="/sign-in">
            sign in
          </Link>
        </div>
      </nav>
      <nav className="relative z-100 flex items-center md:hidden">
        <MobileNav isAuthenticated={false} />
      </nav>
    </header>
  );
}
