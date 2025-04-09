import React from 'react';
import { TextAnimate } from '../magicui/text-animate-black';

const ContentPage3 = () => {
  return (
    <div className="flex h-screen w-screen flex-row bg-[#101014] max-md:flex-col">
      <div className="lgjustify-center font-poppins flex text-7xl text-[#F3F3F3] max-md:m-4 lg:h-screen lg:w-1/6 lg:items-center lg:text-[600px]">
        3
      </div>
      <div className="relative my-20 flex max-md:m-4 max-md:h-1/2 lg:w-1/2 lg:items-center lg:justify-center">
        <video muted loop autoPlay className="h-full w-full object-cover">
          <source src="/videos/video1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="flex max-md:m-4 max-md:h-1/2 max-md:flex-col md:items-center md:justify-center lg:w-1/3 lg:items-center lg:justify-center">
        <TextAnimate animation="fadeIn" className="text-3xl sm:text-6xl lg:ml-6" by="line" as="p">
          {`Fade in by line as paragraph\n\nFade in by line as paragraph\n\nFade in by line as paragraph`}
        </TextAnimate>
      </div>
    </div>
  );
};

export default ContentPage3;
