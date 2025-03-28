import PlusSvg from "@/public/svg/PlusSvg";

export const BottomLine = () => {
    return (
      <>
        <div className="hidden absolute top-[55.25rem] left-10 right-10 h-0.25 dark:h-[0.5px] bg-n-6 pointer-events-none xl:block bg-gray-300 dark:bg-gray-700" />
  
        <PlusSvg className="hidden absolute top-[54.9375rem] left-[2.1875rem] z-2 pointer-events-none xl:block" />
  
        <PlusSvg className="hidden absolute top-[54.9375rem] right-[2.1875rem] z-2 pointer-events-none xl:block" />
      </>
    );
  };
    