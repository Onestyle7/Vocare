'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Separator } from '@/components/ui/separator';
import {
  logo,
  NavLinks,
  social_fb,
  social_instagram,
  social_linkedin,
} from '@/features/marketing/constants';

const Footer = () => {
  return (
    <footer className="font-poppins mx-auto flex max-w-310.25 flex-col space-y-10 rounded-tl-[20px] rounded-tr-[20px] bg-[#16171B] px-5 py-8 text-[#F1F4FF] sm:space-y-12 sm:rounded-tl-[32px] sm:rounded-tr-[32px] sm:px-8 sm:py-10 lg:space-y-16.5 lg:rounded-tl-[45px] lg:rounded-tr-[45px] lg:px-15 lg:py-12.5">
      <div className="flex w-full flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" aria-label="Go to homepage" className="shrink-0">
          <Image
            src={logo}
            alt="vocare"
            width={160}
            height={40}
            className="pointer-events-none h-8 w-auto invert sm:h-10 dark:invert-0"
            priority
          />
        </Link>

        <ul className="flex flex-row flex-wrap gap-x-4 gap-y-3 sm:gap-5">
          {NavLinks.map(({ label, url }) => (
            <li key={url}>
              <Link
                className="text-[14px] font-light opacity-90 transition-opacity hover:opacity-60 sm:text-[16px]"
                href={url}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 flex-row gap-4 sm:gap-5">
          <Link
            href="https://www.linkedin.com/company/vocarepl/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <Image
              src={social_linkedin}
              alt="linkedin"
              width={30}
              height={30}
              className="pointer-events-none h-7 w-7 sm:h-[30px] sm:w-[30px]"
            />
          </Link>
          <Link
            href="https://www.facebook.com/profile.php?id=61583477355189"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <Image
              src={social_fb}
              alt="facebook"
              width={30}
              height={30}
              className="pointer-events-none h-7 w-7 sm:h-[30px] sm:w-[30px]"
            />
          </Link>
          <Link
            href="https://www.instagram.com/vocare.pl/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <Image
              src={social_instagram}
              alt="instagram"
              width={30}
              height={30}
              className="pointer-events-none h-7 w-7 sm:h-[30px] sm:w-[30px]"
            />
          </Link>
        </div>
      </div>

      <div className="flex w-full flex-col gap-8 sm:gap-10 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-start lg:gap-4">
          <p className="flex w-fit max-w-24.25 items-center justify-center rounded-[7px] bg-[linear-gradient(90deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] px-3 py-1 text-[16px] font-medium text-black sm:px-1 sm:text-[20px]">
            Kontakt
          </p>
          <p className="font-regular text-[15px] break-all sm:text-[18px] sm:break-normal">
            kontakt@vocare.pl
          </p>
        </div>

        <div className="w-full max-w-168.25 rounded-[14px] bg-[#222327] px-5 py-8 sm:px-10 sm:py-14.5">
          <form
            className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Email (wkrótce)"
              disabled
              aria-label="Email"
              className="w-full flex-1 cursor-not-allowed rounded-[14px] border border-white/26 bg-transparent px-5 py-3.5 text-[15px] font-light text-[#F1F4FF] placeholder:text-white/40 focus:border-white/40 focus:outline-none sm:px-6 sm:py-4 sm:text-[16px]"
            />
            <button
              type="submit"
              className="w-full shrink-0 cursor-not-allowed rounded-[14px] bg-[linear-gradient(90deg,#9296FD_0%,#8491FE_50%,#9D9BFF_77%,#C7A9FE_100%)] px-6 py-3.5 text-[14px] font-medium text-black transition-opacity hover:opacity-90 sm:w-auto sm:px-8 sm:py-4 sm:text-[15px]"
            >
              Subskrybuj newsletter
            </button>
          </form>
        </div>
      </div>

      <Separator className="bg-white opacity-34" />

      <div className="flex flex-col items-start justify-start gap-2 sm:flex-row sm:gap-6">
        <p className="font-regular text-[14px] sm:text-[16px]">
          © 2026 Vocare. Wszelkie prawa zastrzeżone.
        </p>
        <Link href="privacy-policy" className="font-regular text-[14px] underline sm:text-[16px]">
          Polityka Prywatności
        </Link>
        <Link href="terms-of-service" className="font-regular text-[14px] underline sm:text-[16px]">
          Regulamin
        </Link>
      </div>

      <div
        aria-hidden
        className="relative -mt-6 -mb-8 flex h-auto w-full justify-center overflow-hidden select-none sm:-mt-8 sm:-mb-10 lg:-mt-10 lg:-mb-12.5 lg:block lg:h-[180px]"
      >
        <p className="bg-gradient-to-b from-white/50 via-white/20 via-40% to-[#16171B] to-65% bg-clip-text text-center text-[15vw] leading-none font-semibold whitespace-nowrap text-transparent lg:absolute lg:-bottom-[0.40em] lg:left-1/2 lg:-translate-x-1/2 lg:text-[260px]">
          VOCARE
        </p>
      </div>
    </footer>
  );
};

export default Footer;
