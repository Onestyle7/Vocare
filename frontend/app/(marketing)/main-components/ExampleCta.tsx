'use client';

import { ChevronRight } from 'lucide-react';

import Button from '@/components/ui/assistant-button';
import { useAuthContext } from '@/features/auth/components/AuthProvider';

export default function ExampleCta() {
  const { isAuthenticated } = useAuthContext();

  return (
    <Button
      href={isAuthenticated ? '/dashboard' : '/sign-up'}
      variant="primary"
      size="md"
      icon={<ChevronRight size={18} aria-hidden="true" />}
      className="w-full max-w-sm bg-[#6563D9] whitespace-normal hover:bg-[#5754C7] active:bg-[#4A47B5] motion-reduce:transition-none sm:w-auto"
    >
      Sprawdź dla swojego profilu
    </Button>
  );
}
