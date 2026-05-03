import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function forceLoginRedirect(reason?: string, callbackPath?: string) {
  if (!callbackPath) {
    const headersList = await headers();
    const referer = headersList.get('referer');
    callbackPath = '/';
    if (referer) {
      try {
        const urlObject = new URL(referer);
        callbackPath = `${urlObject.pathname}${urlObject.search}`;
      } catch {}
    }
  }

  const searchParams = new URLSearchParams();
  if (callbackPath !== '/') searchParams.set('callbackUrl', callbackPath);
  if (reason) searchParams.set('reason', reason);

  redirect(`/sign-in?${searchParams.toString()}`);
}
