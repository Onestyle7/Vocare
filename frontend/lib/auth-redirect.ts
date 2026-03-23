export const SIGN_IN_PATH = '/sign-in';

export const protectedRoutePrefixes = [
  '/profile',
  '/assistant',
  '/market-analysis',
  '/resume',
] as const;

export const isProtectedRoute = (pathname: string) =>
  protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('token');
};

export const hasStoredToken = () => Boolean(getStoredToken());

export const clearStoredToken = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem('token');
};

export const redirectToSignIn = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname === SIGN_IN_PATH) {
    return;
  }

  window.location.replace(SIGN_IN_PATH);
};
