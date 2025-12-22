import { construction } from '@/app/constants';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const blog = () => {
  return (
    <div className="font-korbin mx-auto mt-10 flex h-screen max-w-7xl items-center justify-center">
      <Link href="/" className="absolute top-8 left-8 text-gray-500 hover:text-gray-400">
        &larr; Back to Home
      </Link>
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-r-6 border-b-6 p-4">
        <h1 className="mb-4 text-center text-xl">
          We are currently working on this section. <br />
          Stay tuned.
        </h1>
        <Image
          src={construction}
          className="rounded-[16px] border border-r-6 border-b-6"
          alt="construction"
          width={424}
          height={424}
        />
      </div>
    </div>
  );
};

export default blog;
