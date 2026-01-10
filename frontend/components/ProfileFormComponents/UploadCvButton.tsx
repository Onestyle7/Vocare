'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { importUserProfileFromCv } from '@/lib/profile';
import { Button } from '../ui/button';
import { UserProfile } from '@/lib/types/profile';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

type UploadCvButtonProps = {
  onUploaded?: (profile: UserProfile) => void;
  className?: string;
};

const getErrorMessage = (error: unknown): string | undefined => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  const responseData = error.response?.data;
  if (typeof responseData === 'string') {
    return responseData;
  }

  if (responseData && typeof responseData === 'object' && 'message' in responseData) {
    const message = responseData.message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return error.message;
};

const getUploadErrorDetails = (
  error: unknown,
): { title: string; description?: string } | null => {
  const message = getErrorMessage(error);
  if (!message) {
    return null;
  }

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('wyodrębnić') || normalizedMessage.includes('wyodrebnic')) {
    return {
      title: 'Nie udało się odczytać treści z CV.',
      description:
        'Upewnij się, że plik PDF zawiera zaznaczalny tekst (nie jest tylko skanem obrazu).',
    };
  }

  if (normalizedMessage.includes('nie przesłano pliku')) {
    return {
      title: 'Nie przesłano pliku.',
      description: 'Wybierz plik i spróbuj ponownie.',
    };
  }

  return {
    title: 'Nie udało się przetworzyć CV.',
    description: message,
  };
};

export default function UploadCvButton({ onUploaded, className }: UploadCvButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    try {
      const profile = await importUserProfileFromCv(file);
      toast.success('Profil uzupełniony na podstawie CV.', {
        description: 'Za chwilę zobaczysz zaktualizowane dane w profilu.',
      });
      localStorage.setItem('userProfile', JSON.stringify(profile));
      onUploaded?.(profile);
    } catch (error) {
      const details = getUploadErrorDetails(error);
      if (details) {
        toast.error(details.title, { description: details.description });
      } else {
        toast.error('Nie udało się przetworzyć CV.', {
          description: 'Spróbuj ponownie za chwilę.',
        });
      }
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className={className}>
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
        onClick={handleClick}
        disabled={isUploading}
        className="rounded-md"
      >
        <UploadCloud className="mr-2 h-4 w-4" />
        {isUploading ? 'Wgrywanie CV...' : 'Uzupełnij profil z CV'}
      </Button>
    </div>
  );
}
