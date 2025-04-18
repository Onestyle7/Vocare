/* eslint-disable @typescript-eslint/no-explicit-any */
import SectionSvg from '@/public/svg/SectionSvg';

const SectionGsap = ({ className, id, crosses, crossesOffset, customPaddings, children }: any) => {
  return (
    <div
      id={id}
      className={`relative ${
        customPaddings || `py-10 lg:py-16 xl:py-20 ${crosses ? 'lg:py-32 xl:py-40' : ''}`
      } ${className || ''}`}
    >
      {children}

      {crosses && (
        <>
          <div
            className={`bg-stroke-1 absolute top-0 right-7.5 left-7.5 hidden h-0.25 ${
              crossesOffset && crossesOffset
            } pointer-events-none right-10 lg:block xl:left-10`}
          />
          <SectionSvg crossesOffset={crossesOffset} />
        </>
      )}
    </div>
  );
};

export default SectionGsap;
