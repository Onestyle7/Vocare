import React from 'react';
import { TextAnimate } from '../magicui/text-animate-black';

const ContentPage = () => {
  return (
    <div className="flex h-screen w-screen flex-row bg-[#101014] max-xl:flex-col">
      <div className="font-poppins flex text-7xl text-[#F3F3F3] max-lg:m-4 xl:h-screen xl:w-1/6 xl:items-center xl:justify-center xl:text-[600px]">
        1
      </div>
      <div className="relative my-20 flex max-lg:m-4 max-lg:h-1/2 xl:w-1/2 xl:items-center xl:justify-center">
        <video muted loop autoPlay className="h-full w-full object-cover">
          <source src="/videos/video1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="flex max-lg:m-4 max-lg:h-1/2 max-lg:flex-col md:items-center md:justify-center xl:w-1/3 xl:items-center xl:justify-center">
        <TextAnimate animation="fadeIn" className="text-3xl sm:text-6xl lg:ml-6" by="line" as="p">
          {`Fade in by line as paragraph\n\nFade in by line as paragraph\n\nFade in by line as paragraph`}
        </TextAnimate>
      </div>
    </div>
  );
};

export default ContentPage;
