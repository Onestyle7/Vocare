import React from 'react';
import RequireAuth from '@/components/AuthComponents/RequireAuth';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <RequireAuth>{children}</RequireAuth>;
};

export default Layout;
