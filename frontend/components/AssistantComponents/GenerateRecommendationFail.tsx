import React from 'react'
import SpotlightCard from '../SpotlightCard/SpotlightCard'
import Link from 'next/link'
import Image from 'next/image'
import { curved1, upper_arrow } from '@/app/constants'

const GenerateRecommendationFail = () => {
  return (
    <div className='flex items-center flex-col mt-16 space-y-10'>
      <div className='flex flex-col items-center justify-center'>
        <h1 className='font-poppins text-3xl font-bold'>
          How to use Vocare?
        </h1>
        <p className='font-poppins text-md text-gray-500'>
          It&apos;s that simple.
        </p>
      </div>
      <div className='flex flex-col lg:flex-row max-lg:space-y-3 lg:space-x-4'>
      <SpotlightCard className='w-[350px] h-[300px] bg-muted'>
        <div className='flex flex-col items-center justify-center font-poppins h-full'>
          <div className='w-full items-center justify-start'>
            <p className='text-xl text-muted-foreground'>
              1. 
            </p>
          </div>
          <div className='w-full items-center justify-start h-full mt-4'>
            <p className='text-lg text-muted-foreground'>
              Start by updating <b>Your profile</b>. Simply use the <i>profile</i>{' '}button
            </p>
          </div>
          <div className='w-full'>
            <Link href="/profile" className='text-md text-muted-foreground flex flex-row'>
              Navigate to profile
              <Image src={upper_arrow} alt='arrow' width={24} height={24} className='ml-1 dark:invert opacity-50 scale-90'/>
            </Link>
          </div>
        </div>
      </SpotlightCard>
      {/* <Image src={curved1} alt='curved' width={324} height={324} className='invert opacity-30'/> */}
      <SpotlightCard className='w-[350px] h-[300px] bg-muted'>
        <div className='flex flex-col items-center justify-center font-poppins h-full'>
          <div className='w-full items-center justify-start'>
            <p className='text-xl text-muted-foreground'>
              2. 
            </p>
          </div>
          <div className='w-full items-center justify-start h-full mt-4'>
            <p className='text-lg text-muted-foreground'>
              After updating Your profile, you&apos;ll gain access to every <br /> <b>AI tool</b> that Vocare offers. 
            </p>
          </div>
          <div className='w-full'>
            <Link href="/profile" className='text-md text-muted-foreground flex flex-row'>
              Learn how we protect data
              <Image src={upper_arrow} alt='arrow' width={24} height={24} className='ml-1 dark:invert opacity-50 scale-90'/>
            </Link>
          </div>
        </div>
      </SpotlightCard>
      <SpotlightCard className='w-[350px] h-[300px] bg-muted'>
        <div className='flex flex-col items-center justify-center font-poppins h-full'>
          <div className='w-full items-center justify-start'>
            <p className='text-xl text-muted-foreground'>
              3. 
            </p>
          </div>
          <div className='w-full items-center justify-start h-full mt-4'>
            <p className='text-lg text-muted-foreground'>
              Build Your future with <b>Vocare</b>. You <b>grow</b>, we automate.
            </p>
          </div>
          <div className='w-full'>
            <Link href="/profile" className='text-md text-muted-foreground flex flex-row'>
              Visit the FAQ section
              <Image src={upper_arrow} alt='arrow' width={24} height={24} className='ml-1 dark:invert opacity-50 scale-90'/>
            </Link>
          </div>
        </div>
      </SpotlightCard>
            </div>

    </div>
  )
}

export default GenerateRecommendationFail