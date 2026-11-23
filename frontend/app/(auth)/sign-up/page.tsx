import { safeCallbackPath } from '@/features/auth/session-marker';

import { SignUpForm } from '../../../features/auth/components/SignUpForm';

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <>
      <SignUpForm callbackUrl={safeCallbackPath(callbackUrl)} />
    </>
  );
}
