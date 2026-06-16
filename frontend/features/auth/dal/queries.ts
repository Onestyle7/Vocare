import 'server-only';

import { actionErr, actionOk } from '@/lib/types/result';

import { ValidateResetPasswordCommand } from './api';
import { validateResetPasswordService } from './services';

export async function validateResetPassword(command: ValidateResetPasswordCommand) {
  const result = await validateResetPasswordService(command);

  return result.match(
    () => actionOk({ success: true }),
    (error) => actionErr(error)
  );
}
