import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { validateResetPassword } from '@/features/auth/dal/queries';
import { parseResetPasswordLink, RESET_PASSWORD_COOKIE } from '@/features/auth/reset-password-link';

import { ResetPasswordForm } from '../../../features/auth/components/ResetPasswordForm';

// The token and email arrive in a cookie set by proxy.ts, never in the address (see reset-password-link.ts)
export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const link = parseResetPasswordLink(cookieStore.get(RESET_PASSWORD_COOKIE)?.value);

  if (!link) {
    redirect('/sign-in?error=' + encodeURIComponent('Brak poprawnego linku resetującego hasło.'));
  }

  const [error] = await validateResetPassword(link);

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  return (
    <>
      <ResetPasswordForm email={link.email} />
    </>
  );
}
