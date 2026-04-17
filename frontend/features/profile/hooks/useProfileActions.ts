import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { logOut } from '@/features/auth/dal/commands';
import { useUnauthorizedToast } from '@/lib/hooks/useUnauthorizedToast';

import { importProfileFromCvCommand } from '../dal/commands';

export function useProfileActions() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { unauthorizedToast } = useUnauthorizedToast();

  const handleLogout = () => {
    startTransition(async () => {
      await logOut();
      router.replace('/sign-in');
    });
  };

  const handleCvImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const [error, profile] = await importProfileFromCvCommand(formData);

    if (error) {
      if (error.type === 'Unauthorized') {
        unauthorizedToast();
      } else {
        toast.error('Nie udało się przetworzyć CV', { description: error.message });
      }
      return null;
    }

    toast.success('Profil uzupełniony na podstawie CV.', {
      description: 'Za chwilę zobaczysz zaktualizowane dane w profilu.',
    });

    return profile;
  };

  return {
    handleLogout,
    handleCvImport,
    isPending,
  };
}
