import React from 'react'
import { TextAnimateLight } from '../magicui/text-animate-light'

const ContentPage2 = () => {
  return (
    <div className='w-screen h-screen bg-[#F3F3F3] flex max-md:flex-col flex-row'>
      <div className="flex max-md:m-4 lg:items-center lgjustify-center lg:h-screen lg:w-1/6 lg:text-[600px] font-poppins text-7xl text-[#101014]">
        2
      </div>
      <div className="flex max-md:m-4 lg:items-center lg:justify-center max-md:h-1/2 lg:w-1/2 relative my-20">
        <video controls className="w-full h-full object-cover">
          <source src="/videos/video1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="flex max-md:m-4 lg:items-center lg:justify-center max-md:h-1/2 lg:w-1/3 max-md:flex-col md:items-center md:justify-center">
        <TextAnimateLight animation="fadeIn" className="sm:text-6xl text-3xl lg:ml-6" by="line" as="p">
        {`Fade in by line as paragraph\n\nFade in by line as paragraph\n\nFade in by line as paragraph`}
        </TextAnimateLight>
      </div>
    </div>
  )
}

export default ContentPage2