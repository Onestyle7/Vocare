import PlusSvg from '@/public/svg/PlusSvg';

export const BottomLine = () => {
  return (
    <>
      <div className="bg-n-6 pointer-events-none absolute right-10 -bottom-1.5 left-10 hidden h-0.25 bg-gray-300 xl:block dark:h-[0.5px] dark:bg-gray-700" />

      <PlusSvg className="pointer-events-none absolute left-[2.1875rem] z-12 hidden xl:block" />

      <PlusSvg className="pointer-events-none absolute right-[2.1875rem] z-12 hidden xl:block" />
    </>
  );
};
