import React from 'react'
import Section from './Section'
import { gridTiles } from '@/app/constants'
import FeatureCard from './FeatureCard'
  

const MobileFeature = () => {
  return (
    <Section crosses
    customPaddings
    id="brain" 
    className='min-h-screen w-screen'>
        {/* <div className="mb-8 md:mx-[12%] mx-4 items-start justify-center">
            <div className='flex items-center justify-center mb-8'>
                <h2 className='text-sm uppercase md:text-[10px] mt-10'>Features</h2>
            </div>  
            <div className='dark:border-gray-700 border-[#d0d1d1] bg-white border p-2 rounded-[36px]'>
                <div className="grid md:grid-cols-2 auto-rows-[300px] border dark:bg-[#2a2e35] bg-[#d0d1d1] border-[#d0d1d1] dark:border-gray-700 rounded-[32px]"> 
                {gridTiles.map((item, i) => (
                    <div key={i} className='border-r border-b bg-white dark:bg-[#0e0f11] dark:border-gray-700 border-gray-300 rounded-[32px] p-2 flex flex-col items-center justify-center px-6 py-8 lg:px-20 lg:py-14'>
                        {i === 0 && <FeatureCard />}
                    </div>
                    ))}
                </div>
            </div>
        </div> */}
    </Section>
  )
}

export default MobileFeature;
