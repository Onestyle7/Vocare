/* eslint-disable @typescript-eslint/no-explicit-any */
import SectionSvg from "@/public/svg/SectionSvg";

const Section = ({
  className,
  id,
  crosses,
  crossesOffset,
  customPaddings,
  children,
}: any) => {
  return (
    <div
      id={id}
      className={`
      relative 
      ${
        customPaddings ||
        `py-10 lg:py-16 xl:py-20 ${crosses ? "lg:py-32 xl:py-40" : ""}`
      } 
      ${className || ""}`}
    >
      {children}

      <div className="hidden absolute top-0 left-5 w-[0.5px] h-screen bg-stroke-1 pointer-events-none lg:block lg:left-7.5 xl:left-10 bg-gray-300 dark:bg-gray-700" />
      <div className="hidden absolute top-0 right-5 w-[0.5px] h-screen bg-stroke-1 pointer-events-none lg:block lg:right-7.5 xl:right-10 bg-gray-300 dark:bg-gray-700" />

      {crosses && (
        <>
          <div
            className={`hidden absolute top-0 left-7.5 right-7.5 h-0.25 bg-stroke-1 ${
              crossesOffset && crossesOffset
            } pointer-events-none lg:block xl:left-10 right-10`}
          />
          <SectionSvg crossesOffset={crossesOffset} />
        </>
      )}
    </div>
  );
};

export default Section;