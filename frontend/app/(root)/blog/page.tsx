import { construction } from '@/app/constants'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const blog = () => {
  return (
    <div className=' font-korbin h-screen flex items-center justify-center max-w-7xl mx-auto mt-10'>
      <Link href='/' className='absolute top-8 left-8 text-gray-500 hover:text-gray-400'>
        &larr; Back to Home
      </Link>
      <div className='flex flex-col items-center justify-center border border-r-6 border-b-6 p-4 rounded-[24px]'>
      <h1 className='text-xl text-center mb-4'>
        We are currently working on this section. <br />Stay tuned.
      </h1>
      <Image src={construction} className='border border-r-6 border-b-6 rounded-[16px]' alt='construction' width={424} height={424}/>
    </div>
  </div>
  )
}

export default blog