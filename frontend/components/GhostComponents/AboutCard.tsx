import Image from 'next/image';
import React from 'react';

const AboutCard = ({
  img,
  title,
  description,
}: {
  img: string;
  title: string;
  description: string;
}) => {
  const titleParts = title.split(' ');

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-gray-800 bg-[#e9e0ef] px-6 py-6 lg:h-[400px] min-lg:w-[280px] xl:w-[320px] dark:border-gray-700 dark:bg-[#0e0f11]">
      <div className="mb-10 flex w-full items-start justify-start lg:h-1/2">
        <Image
          src={img}
          alt="icon"
          width={90}
          height={90}
          className="transition hover:rotate-45"
        />
      </div>

      <div className="flex h-1/2 w-full flex-col items-start justify-between">
        <h3 className="mb-4 flex w-full flex-col items-start justify-start text-4xl font-medium">
          {titleParts.length === 2 ? (
            <>
              <span className="flex">{titleParts[0]} </span>
              <span className="rounded-[4px] bg-[#bda7ef] p-[0.5px] dark:bg-[#915EFF]">
                {titleParts[1]}
              </span>
            </>
          ) : (
            title
          )}
        </h3>

        <div className="flex w-full items-center justify-start">{description}</div>
      </div>
    </div>
  );
};

export default AboutCard;
