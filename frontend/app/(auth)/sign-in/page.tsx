import { SignInFrom } from '../_components/SignInForm';

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
