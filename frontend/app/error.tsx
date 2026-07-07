'use client';

import ErrorPage from '@/components/ui/ErrorPage';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorPage error={error} reset={reset} />;
}
