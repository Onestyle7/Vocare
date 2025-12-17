'use client';

import React from 'react';
import { contact_pages, down_links, links_pages, links_social } from '@/app/constants';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import Section from '../SupportComponents/Section';
import ButtonGenerate from '../ui/ButtonGenerate';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { landingCopy } from '@/app/constants/landingCopy';

const Footer = () => {
  const reachUsEmail = 'vocare@testmail.com';
  const { language } = useLanguage();
  const copy = landingCopy[language];

  const handleReachUsClick = React.useCallback(() => {
    void navigator.clipboard
      .writeText(reachUsEmail)
      .then(() => {
        toast.success('Email copied to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy email address', error);
        toast.error('Could not copy email');
      });
  }, []);

  return (
    <Section
      className="font-korbin relative -mt-[2.25rem] pt-[7.5rem] xl:px-10"
      crossesOffset="lg:translate-y-[7.5rem]"
      crosses
      customPaddings
      id="footer"
    >
      <footer className="mb-5 flex h-[60vh] flex-col items-center justify-center border-t 2xl:h-[50vh] 2xl:border">
        <div className="flex h-1/2 w-full justify-center max-sm:items-center">
          <div className="flex w-1/2 items-center justify-center">
            <ButtonGenerate
              as="a"
              href="/profile"
              className="mb-4 uppercase max-md:w-full sm:my-20"
            >
              {copy.footer.primaryCta}
            </ButtonGenerate>
          </div>
        </div>
        <div className="flex w-full flex-col p-4 xl:flex-row">
          <div className="font-poppins flex flex-col items-start justify-start text-4xl max-md:mb-20 xl:w-1/2">
            {copy.footer.newsletterTitle}
            <div className="mt-10 xl:w-1/2">
              <Input
                type="email"
                placeholder={copy.footer.newsletterPlaceholder}
                className="border-b outline-none"
              />
            </div>
            <div className="mt-4 flex text-xs text-gray-400/90 xl:w-1/2">
              {copy.footer.newsletterCopy}
            </div>
          </div>
          <div className="flex w-full flex-row items-start justify-center xl:w-1/2">
            <div className="flex w-1/3 flex-col items-center justify-center">
              <div>
                <span className="mb-2 text-sm text-gray-400/90">{copy.footer.socialLabel}</span>
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
                <span className="mb-2 text-sm text-gray-400/90">{copy.footer.pagesLabel}</span>
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
                <span className="mb-2 text-sm text-gray-400/90">{copy.footer.contactLabel}</span>
                <div className="items-left mt-4 flex flex-col justify-center">
                  {contact_pages.map((link, index) => (
                    <ul className="flex text-sm" key={index}>
                      <li>
                        {link.name.toLowerCase() === 'reach us' ? (
                          <button
                            type="button"
                            onClick={handleReachUsClick}
                            className="cursor-pointer text-left text-current"
                          >
                            {copy.footer.reachUs}
                          </button>
                        ) : (
                          <Link href={link.url}>{link.name}</Link>
                        )}
                      </li>
                    </ul>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-[30%] w-full flex-col items-center justify-center max-lg:mt-4 lg:h-[60%] xl:flex-row 2xl:h-[30%]">
          <div className="items- mx-10 flex w-full flex-col gap-6 xl:flex-row xl:justify-between 2xl:mt-0 2xl:mb-20">
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
              {copy.footer.bottomTagline}
            </div>
          </div>
        </div>
      </footer>
    </Section>
  );
};

export default Footer;
