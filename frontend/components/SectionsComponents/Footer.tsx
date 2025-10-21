import React from 'react';
import { contact_pages, down_links, links_pages, links_social } from '@/app/constants';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import Section from '../SupportComponents/Section';
import ButtonGenerate from '../ui/ButtonGenerate';

const Footer = () => {
  return (
    <Section
      className="font-korbin relative -mt-[2.25rem] pt-[7.5rem] xl:px-10"
      crossesOffset="lg:translate-y-[7.5rem]"
      crosses
      customPaddings
      id="footer"
    >
      <footer className="flex h-[60vh] 2xl:h-[50vh] flex-col items-center justify-center border-t mb-5 2xl:border">
        <div className="flex h-1/2 w-full justify-center max-sm:items-center">
          <div className="flex w-1/2 items-center justify-center">
            <ButtonGenerate className="uppercase max-md:w-full mb-4 sm:my-20">Try Vocare</ButtonGenerate>
          </div>
        </div>
        <div className="flex w-full flex-col xl:flex-row p-4">
          <div className="font-poppins flex flex-col items-start justify-start text-4xl max-md:mb-20 xl:w-1/2">
            Never miss what&apos;s next
            <div className="mt-10 xl:w-1/2">
              <Input type="email" placeholder="Your email" className="border-b outline-none" />
            </div>
            <div className="mt-4 flex text-xs text-gray-400/90 xl:w-1/2">
              By submitting your email, you’ll be the first to know about upcoming updates for
              Vocare. You can unsubscribe at any time.
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
        <div className="flex h-[30%] lg:h-[60%] 2xl:h-[30%] w-full flex-col items-center justify-center   max-lg:mt-4 xl:flex-row">
          <div className="mx-10 2xl:mb-20 2xl:mt-0 flex w-full flex-col items-   gap-6 xl:flex-row xl:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400/90">
              {down_links.map((link, i) => (
                <Link
                  key={i}
                  href={link.url}
                  className="hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="text-center text-4xl font-semibold sm:text-6xl xl:text-left xl:text-[80px] dark:text-[#F3F3F3]">
              Find Your Path
            </div>
          </div>
        </div>
      </footer>
    </Section>
  );
};

export default Footer;
