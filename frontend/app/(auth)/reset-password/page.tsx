import { redirect } from 'next/navigation';

import { validateResetPassword } from '@/features/auth/dal/queries';

import { ResetPasswordForm } from '../../../features/auth/components/ResetPasswordForm';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    redirect('/sign-in?error=' + encodeURIComponent('Brak poprawnego linku resetującego hasło.'));
  }

  const [error] = await validateResetPassword({ token, email });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  return (
    <>
      <ResetPasswordForm token={token} email={email} />
    </>
  );
}
