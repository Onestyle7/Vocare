'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Błąd aplikacji:', error);
  }, [error]);

  const router = useRouter();

  const reload = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Coś poszło nie tak</h2>
        <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
          Wystąpił błąd podczas pobierania zawartości strony.
        </p>
      </div>
      <Button onClick={reload} variant="outline" className="mt-2">
        Spróbuj ponownie
      </Button>
    </div>
  );
}
