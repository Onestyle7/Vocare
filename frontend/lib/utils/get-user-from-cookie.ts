import { Cookies } from '../types/api';

export function getUserFromCookie(cookies: Pick<Cookies, 'get'>) {
  const userId = cookies.get('userId');
  return userId ? userId.value : null;
}
