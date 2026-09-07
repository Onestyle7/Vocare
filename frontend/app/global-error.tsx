'use client';

import ErrorPage from '@/components/ui/ErrorPage';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pl">
      <body>
        <ErrorPage error={error} reset={reset} />
      </body>
    </html>
  );
}
