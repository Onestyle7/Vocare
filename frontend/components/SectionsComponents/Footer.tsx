import React from 'react';
import CustomButton from '../ui/CustomButton';
import { Input } from '../ui/input';
import { contact_pages, down_links, links_pages, links_social } from '@/app/constants';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="flex h-[90vh] w-[100vw] flex-col items-center justify-center">
      <div className="flex h-1/2 w-full justify-center max-sm:items-center">
        <div className="flex w-1/2 items-center justify-center">
          <CustomButton className="uppercase">Try Vocare</CustomButton>
        </div>
      </div>
      <div className="flex h-full w-full flex-col xl:flex-row">
        <div className="font-poppins m-4 flex flex-col items-start justify-start text-4xl xl:w-1/2">
          Never miss what&apos;s next
          <div className="mt-10 xl:w-1/2">
            <Input type="email" placeholder="Your email" className="border-b outline-none" />
          </div>
          <div className="mt-4 flex text-xs text-gray-400/90 xl:w-1/2">
            By submitting your email, you’ll be the first to know about upcoming updates for Vocare.
            You can unsubscribe at any time.
          </div>
        </div>
        <div className="flex w-full flex-row items-start justify-center xl:w-1/2">
          <div className="flex w-1/3 flex-col items-center justify-center">
            <div>
              <span className="mb-2 text-sm text-gray-400/90">SOCIAL</span>
              <div className="items-left mt-4 flex flex-col justify-center">
                {links_social.map((link, index) => (
                  <ul className="flex text-sm" key={index}>
                    <li>
                      <Link href={link.url} className="">
                        {link.name}
                      </Link>
                    </li>
                  </ul>
                ))}
              </div>
            </div>
          </div>
          <div className="flex w-1/3 flex-col items-center justify-center">
            <div>
              <span className="mb-2 text-sm text-gray-400/90">PAGES</span>
              <div className="items-left mt-4 flex flex-col justify-center">
                {links_pages.map((link, index) => (
                  <ul className="flex text-sm" key={index}>
                    <li>
                      <Link href={link.url}>{link.name}</Link>
                    </li>
                  </ul>
                ))}
              </div>
            </div>
          </div>
          <div className="flex w-1/3 flex-col items-center justify-center">
            <div>
              <span className="mb-2 text-sm text-gray-400/90">CONTACT</span>
              <div className="items-left mt-4 flex flex-col justify-center">
                {contact_pages.map((link, index) => (
                  <ul className="flex text-sm" key={index}>
                    <li>
                      <Link href={link.url}>{link.name}</Link>
                    </li>
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-1/2 w-full flex-col items-center justify-center border xl:flex-row">
        <div className="mx-10 flex w-full items-center justify-center space-x-8 max-xl:flex-col xl:justify-between">
          <div className="flex space-x-4 text-sm text-gray-400/90">
            {down_links.map((link, index) => (
              <Link
                key={index}
                href={link.url}
                className="hover:text-gray-700 dark:hover:text-gray-200"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="daek:text-[#F3F3F3] text-6xl font-semibold max-xl:mt-4 xl:text-[80px]">
            Find Your Path
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
