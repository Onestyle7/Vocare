import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useUnauthorizedToast() {
  const router = useRouter();

  const unauthorizedToast = () => {
    toast.error('Sesja wygasła', {
      description: 'Zaloguj się żeby kontynuować',
      action: {
        label: 'Przejdź do strony logowania',
        onClick: async () => {
          const reason = encodeURIComponent('Sesja wygasła. Zaloguj się ponownie');
          const callbackUrl = encodeURIComponent(window.location.pathname);

          router.replace(`/sign-in?reason=${reason}&callbackUrl=${callbackUrl}`);
        },
      },
    });
  };

  return {
    unauthorizedToast,
  };
}
