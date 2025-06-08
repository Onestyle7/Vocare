import React from 'react';
import { TextAnimateLight } from '../magicui/text-animate-light';

const ContentPage2 = () => {
  return (
    <div className="flex h-screen w-screen flex-row bg-[#0e100f] max-md:flex-col">
      <div className="lgjustify-center font-poppins flex text-7xl text-[#F3F3F3] max-md:m-4 lg:h-screen lg:w-1/6 lg:items-center lg:text-[600px]">
        1
      </div>
      <div className="relative my-20 flex max-lg:m-4 max-lg:h-1/2 xl:w-1/2 xl:items-center xl:justify-center">
        <video muted loop autoPlay playsInline className="h-full w-full rounded-md object-cover">
          <source src="/videos/video1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="relative flex max-md:m-4 max-md:h-1/2 max-md:flex-col md:items-center md:justify-center lg:w-1/3 lg:items-center lg:justify-center">
        <TextAnimateLight
          animation="fadeIn"
          className="text-3xl text-[#101014] sm:text-6xl lg:ml-6 dark:text-[#F3F3F3]"
          by="line"
          as="p"
        >
          {`Fade in by line as paragraph\n\nFade in by line as paragraph\n\nFade in by line as paragraph`}
        </TextAnimateLight>
      </div>
    </div>
  );
};

export default ContentPage2;
