import { plus } from '@/app/constants'
import Image from 'next/image'
import React from 'react'

const AboutCard = ({ img, title, description } : { img: string, title: string, description: string }) => {
  return (
    <div className='border border-gray-800 dark:border-gray-700 dark:bg-[#0e0f11] bg-[#e9e0ef]  rounded-xl flex flex-col xl:w-[320px] min-lg:w-[280px] w-full lg:h-[400px] h-full px-6 py-6'>
        <div className='flex w-full lg:h-1/2 items-start justify-start mb-10'>
            <Image src={img} alt='icon' width={90} height={90} />
        </div>
        <div className='flex flex-col w-full h-1/2 items-start justify-between'>
        <div className='flex w-full items-center justify-start text-4xl font-medium'>
            {title}
        </div>
        <div className='flex w-full items-center justify-start'>
            {description}
        </div>
        </div>
    </div>
  )
}

export default AboutCard