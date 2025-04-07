import React from 'react'
import { TextAnimate } from '../magicui/text-animate-black'

const ContentPage = () => {
  return (
    <div className='w-screen h-screen bg-[#101014] flex max-xl:flex-col flex-row'>
      <div className="flex max-lg:m-4 xl:items-center xl:justify-center xl:h-screen xl:w-1/6 xl:text-[600px] font-poppins text-7xl text-[#F3F3F3]">
        1
      </div>
      <div className="flex max-lg:m-4 xl:items-center xl:justify-center max-lg:h-1/2 xl:w-1/2 relative my-20">
        <video muted loop autoPlay className="w-full h-full object-cover">
          <source src="/videos/video1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="flex max-lg:m-4 xl:items-center xl:justify-center max-lg:h-1/2 xl:w-1/3 max-lg:flex-col md:items-center md:justify-center">
        <TextAnimate animation="fadeIn" className="sm:text-6xl text-3xl lg:ml-6" by="line" as="p">
        {`Fade in by line as paragraph\n\nFade in by line as paragraph\n\nFade in by line as paragraph`}
        </TextAnimate>
      </div>
    </div>
  )
}

export default ContentPage