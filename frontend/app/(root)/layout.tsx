import React from "react";

const Layout = async ({ children }: { children: React.ReactNode }) => {


  return (
    <main className="flex h-screen">
      <section className="flex h-full flex-1 flex-col">
        <div>{children}</div>
      </section>
    </main>
  );
};
export default Layout;