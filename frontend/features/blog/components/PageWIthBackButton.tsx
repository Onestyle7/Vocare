import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function PageWithBackButton({
  backButtonHref,
  children,
}: {
  backButtonHref: string;
  pageTitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative gap-x-4 gap-y-8">
      <Link
        href={backButtonHref}
        className="focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-accent hover:bg-accent hover:text-accent-foreground sticky top-3 z-20 my-3 mb-4 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border p-2 text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Powrót
      </Link>
      <div className="col-start-2 min-h-screen self-start">{children}</div>
    </div>
  );
}
