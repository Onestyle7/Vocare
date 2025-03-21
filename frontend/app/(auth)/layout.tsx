import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <section className="hidden w-1/2 items-center justify-center bg-black p-10 lg:flex xl:w-2/5">
        <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-12">
        <Skeleton className="h-[125px] w-[250px] rounded-xl bg-gray-200/20" />


          <div className="space-y-5 text-white">
            <h1 className="h1">Placeholder</h1>
            <p className="body-1">
              Placeholder_Description
            </p>
          </div>
          <Skeleton className="h-[342px] w-[342px] rounded-xl bg-gray-200/20" />

        </div>
      </section>

      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        <div className="mb-16 lg:hidden">
        <Skeleton className="h-[87px] w-[224px] rounded-xl bg-gray-200/80" />
        </div>
        {children}
      </section>
    </div>
  );
};

export default Layout;