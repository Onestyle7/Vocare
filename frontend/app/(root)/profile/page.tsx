import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Profile = () => {
  return (
    <div className='flex space-x-2'>
      <Link href="/" className='flex space-x-2'>
        <ArrowLeftIcon />
        <span>Go Back</span>
      </Link>
    </div>
  )
}

export default Profile