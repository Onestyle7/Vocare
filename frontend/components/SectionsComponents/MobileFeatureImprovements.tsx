import React from 'react'
import Section from '../SupportComponents/Section'
import Image from 'next/image'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'

const MobileFeatureImprovements = () => {
  return (
    <Section
          crosses
          customPaddings
          className="max-md:-mb-70 font-korbin relative overflow-hidden px-10"
          id="brain"
        >
          <div className='h-[100vh] lg:border-t relative flex flex-col items-center justify-center w-full'>
            <div className="flex w-full h-full flex-col items-center justify-start mt-6 mb-10 sm:px-4 py-8 md:py-0">
              <div className="text-center mb-4">
                <p className="mb-6 font-bold text-gray-400">Always in Your pocket.</p>
                <h2 className="text-4xl font-bold">Your advisor always with you.</h2>
              </div>
                <div className='flex flex-col sm:flex-row items-center justify-center w-full h-full mt-4 sm:px-8 gap-4'>
                  <div className='w-full md:w-1/2 md:h-full h-1/2'>
                    <div className='w-full h-full rounded-[24px] bg-[#181920] relative overflow-hidden'>
                      <div className='absolute md:-top-25 md:-right-20 -top-35 -right-35 z-10'>
                        <Image src="/images/shape-mobile-2.png" alt='phone' width={448} height={448} className='opacity-35 md:rotate-45 rotate-45'/>
                      </div>
                    <div className='w-2/3 h-full flex flex-col justify-end'>
                      <div className='w-full h-2/3 flex flex-col items-start justify-end md:px-10 px-4 md:mb-10 mb-4'>
                        <p className='text-[#818fff] font-bold mb-4'>
                          Apps
                        </p>
                        <h2 className='text-white/85 font-bold text-2xl sm:text-4xl tracking-tight z-20'>
                          Try Vocare. <br/>
                          For free.
                        </h2>
                        <Button
                    className="relative h-12 w-5/6 z-20 md:w-2/3 md:mt-16 mt-10 rounded-full font-bold bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] text-white group"
                    variant="default"
                  >
                    Download Now
                    <ArrowRight className='ml-2 group-hover:translate-x-2 transition-all ease-in-out  '/>
                  </Button>
                      </div>
                    </div>
                    </div>
                  </div>
                  <div className='w-full md:w-1/2 md:h-full h-1/3'>
                    <div className='w-full h-full rounded-[24px] bg-[#818fff] relative overflow-hidden'>
                      <div
                        aria-hidden
                        className='pointer-events-none absolute bottom-4 right-8 h-80 w-55 -translate-y-1 rounded-full blur-2xl'
                        style={{
                          background:
                            'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.18) 55%, transparent 75%)',
                          filter: 'blur(10px)'
                        }}
                      />
                      <div className='absolute md:bottom-0 right-0 z-10 -bottom-40'>
                        <Image src="/images/iphone-1.png" alt='phone' width={348} height={348}/>
                      </div>
                      <div className='absolute -bottom-8 -left-10'>
                        <Image src="/images/shape-mobile-1.png" alt='phone' width={348} height={348} className='opacity-80'/>
                      </div>
                      <div className='absolute -top-4 translate-x-1/2 rotate-x-180'>
                        <Image src="/images/shape-mobile-3.png" alt='phone' width={348} height={348} className='opacity-80'/>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
    </Section>
  )
}

export default MobileFeatureImprovements
