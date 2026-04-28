import React from 'react';

import RequireAuth from '@/components/auth/RequireAuth';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <RequireAuth>{children}</RequireAuth>;
};

export default Layout;
