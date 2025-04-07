import React from 'react'
import CustomButton from '../ui/CustomButton'
import { Input } from '../ui/input'
import { contact_pages, down_links, links_pages, links_social } from '@/app/constants'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className='flex w-[100vw] h-[90vh] items-center justify-center flex-col'>
        <div className='flex h-1/2 w-full max-sm:items-center justify-center'>
            <div className='flex w-1/2 items-center justify-center'>
                <CustomButton className='uppercase'>
                    Try Vocare
                </CustomButton>
            </div>
        </div>
        <div className='flex h-full w-full xl:flex-row flex-col'>
            <div className='flex items-start justify-start flex-col xl:w-1/2 m-4 font-poppins text-4xl'>
                Never miss what&apos;s next
                <div className='xl:w-1/2 mt-10'>
                    <Input type="email" placeholder="Your email" className='outline-none border-b'/>
                </div>
                <div className='flex xl:w-1/2 text-xs text-gray-400/90 mt-4'>
                By submitting your email, you’ll be the first to know about upcoming updates for Vocare. You can unsubscribe at any time.
                </div>
            </div>  
            <div className='flex items-start justify-center flex-row xl:w-1/2 w-full m-4'>
                <div className='flex-col flex w-1/3 items-center justify-center'>
                <div>
                    <span className='text-gray-400/90 text-sm mb-2'>SOCIAL</span>
                        <div className='flex flex-col items-left justify-center mt-4'>
                            {links_social.map((link, index) => (
                                <ul className='flex text-sm' key={index}>
                                    <li>
                                        <Link href={link.url} className=''>
                                            {link.name}
                                        </Link>
                                    </li>
                                </ul>
                            ))}
                        </div>
                    </div>
                </div>
                <div className='flex-col flex w-1/3 items-center justify-center'>
                <div>
                    <span className='text-gray-400/90 text-sm mb-2'>PAGES</span>
                        <div className='flex flex-col items-left justify-center mt-4'>
                            {links_pages.map((link, index) => (
                                <ul className='flex text-sm' key={index}>
                                    <li>
                                        <Link href={link.url}>
                                            {link.name}
                                        </Link>
                                    </li>
                                </ul>
                            ))}
                        </div>
                    </div>
                </div>
                <div className='flex-col flex w-1/3 items-center justify-center'>
                <div>
                    <span className='text-gray-400/90 text-sm mb-2'>CONTACT</span>
                        <div className='flex flex-col items-left justify-center mt-4'>
                            {contact_pages.map((link, index) => (
                                <ul className='flex text-sm' key={index}>
                                    <li>
                                        <Link href={link.url}>
                                            {link.name}
                                        </Link>
                                    </li>
                                </ul>
                            ))}
                        </div>
                    </div>
                </div>
            </div>    
        </div>
        <div className="flex xl:flex-row flex-col h-1/2 border w-full justify-center items-center">
            <div className="flex items-center justify-center xl:justify-between space-x-8 w-full mx-10 max-xl:flex-col">
                <div className="flex text-sm text-gray-400/90 space-x-4">
                {down_links.map((link, index) => (
                    <Link key={index} href={link.url} className="dark:hover:text-gray-200 hover:text-gray-700">
                    {link.name}
                    </Link>
                ))}
                </div>
                <div className="xl:text-[80px] text-6xl font-semibold daek:text-[#F3F3F3] max-xl:mt-4">
                    Find Your Path
                </div>
            </div>
            </div>
    </footer>
  )
}

export default Footer