import { SignInFrom } from '../../../features/auth/components/SignInForm';

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; callbackUrl?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <>
      <SignInFrom reason={reason} callbackUrl={callbackUrl} />
    </>
  );
}
