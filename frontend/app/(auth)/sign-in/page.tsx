import { SignInFrom } from '../../../features/auth/components/SignInForm';

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string }>;
}) {
  const { oauthError } = await searchParams;
  return (
    <>
      <SignInFrom oauthError={oauthError} />
    </>
  );
}
