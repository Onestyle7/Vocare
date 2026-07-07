'use client';

import { UploadCloud } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

import { Button } from '../../../components/ui/button';
import { useProfileActions } from '../hooks/useProfileActions';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

type UploadCvButtonProps = {
  className?: string;
};

export default function UploadCvButton({ className }: UploadCvButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { handleCvImport } = useProfileActions();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error('Nie wybrano pliku CV.');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error('Nieobsługiwany format pliku.', {
        description: 'Dozwolone formaty: PDF, DOC, DOCX.',
      });
      event.target.value = '';
      return;
    }

    setIsUploading(true);

    // Cała logika HTTP, komend serwerowych i obsługi błędów jest w hooku!
    await handleCvImport(file);

    setIsUploading(false);
    event.target.value = '';
  };

  return (
    <div className={cn('w-full sm:w-auto', className)}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleClick}
        disabled={isUploading}
        className="w-full justify-center gap-2 rounded-lg sm:w-auto"
      >
        <UploadCloud className="h-4 w-4" />
        {isUploading ? 'Wgrywanie CV...' : 'Uzupełnij profil z CV'}
      </Button>
    </div>
  );
}
