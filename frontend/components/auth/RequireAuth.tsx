'use client';

import { PropsWithChildren, useEffect, useState } from 'react';

const RequireAuth = ({ children }: PropsWithChildren) => {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // if (!hasStoredToken()) {
    //   redirectToSignIn();
    //   return;
    // }

    setIsAuthorized(true);
  }, []);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
