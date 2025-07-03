import CardSwap, { Card } from '@/components/CardSwap/CardSwap'
import { ArrowUp, FileQuestion, PencilLine } from 'lucide-react'
import React from 'react'

const CardFeature = () => {
  return (
    <div className='flex flex-col md:flex-row h-auto md:h-[600px] sm:border-r sm:border-l sm:border-b border max-md:rounded-lg font-poppins overflow-hidden mx-4 sm:mx-10 max-md:mt-[300px] max-md:-mb-[200px]'>
  <div className='w-full md:w-1/2 flex items-center justify-center py-8 md:py-0 flex-col px-4'>
  <div className='sm:text-left text-center'>
    <h2 className='text-4xl font-bold mb-6'>Compact Powerhouse.</h2>
    <p className='text-gray-400 font-normal'>
      All Your Tools Together.
    </p>
  </div>
  </div>

      <div className='relative w-full md:w-1/2 h-[400px] md:h-full overflow-hidden'>
        <div className='absolute right-20 bottom-20 md:right-0 md:bottom-0 left-1/2 md:left-auto transform -translate-x-1/2 md:translate-x-0 scale-150'>
          <CardSwap
            width={400}
            height={300}
            delay={3000}
            pauseOnHover={true}
            onCardClick={(index) => console.log(`Kliknięto kartę ${index}`)}
          >
            <Card>
              <div className='flex flex-col h-full'>
                <div className='border-b-[0.5px] border-gray-300 px-2 py-2 flex flex-row items-center bg-gradient-to-t from-purple-400/20 to-transparent'>
                  <FileQuestion className='mr-2 w-4 h-4'/>
                  <p className='text-xs font-light'>Assistant</p>
                </div>
                <div className='flex-1 p-2 overflow-hidden'>
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src="/videos/one.mp4"
                    className='w-full h-full object-cover rounded-xl'
                  ></video>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex flex-col h-full'>
                <div className='border-b-[0.5px] border-gray-300 px-2 py-2 flex flex-row items-center bg-gradient-to-t from-purple-400/20 to-transparent'>
                  <ArrowUp className='mr-2 w-4 h-4'/>
                  <p className='text-xs font-light'>Market</p>
                </div>
                <div className='flex-1 p-2 overflow-hidden'>
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src="/videos/two.mp4"
                    className='w-full h-full object-cover rounded-xl'
                  ></video>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex flex-col h-full'>
                <div className='border-b-[0.5px] border-gray-300 px-2 py-2 flex flex-row items-center bg-gradient-to-t from-purple-400/20 to-transparent'>
                  <PencilLine className='mr-2 w-4 h-4'/>
                  <p className='text-xs font-light'>Resume</p>
                </div>
                <div className='flex-1 p-2 overflow-hidden'>
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src="/videos/three.mp4"
                    className='w-full h-full object-cover rounded-xl'
                  ></video>
                </div>
              </div>
            </Card>
          </CardSwap>
        </div>
      </div>
    </div>
  )
}

export default CardFeature