import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function forceLoginRedirect(reason?: string, callbackPath?: string) {
  const defaultReason = 'Sesja wygasła. Zaloguj się ponownie';

  const headersList = await headers();
  const currentPath = headersList.get('x-current-path') ?? '';

  if (currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up')) {
    return;
  }

  if (!callbackPath) {
    if (currentPath && currentPath !== '/') {
      callbackPath = currentPath;
    } else {
      callbackPath = '/';
    }
  }

  const searchParams = new URLSearchParams();
  if (callbackPath !== '/') searchParams.set('callbackUrl', callbackPath);
  searchParams.set('reason', reason ? reason : defaultReason);

  redirect(`/sign-in?${searchParams.toString()}`);
}
