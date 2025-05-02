'use client';

import { GridBackgroundDemo } from '@/components/MarketComponents/GridBackgroundDemo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
import { shape3, shape4 } from '../constants';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { Confetti, ConfettiRef } from '@/components/ui/confetti';

const Page = () => {
  const isSuccess = false;

  const confettiRef = useRef<ConfettiRef>(null);

  return (
    <div className="font-poppins mx-auto flex h-screen max-w-7xl items-center justify-center px-4">
      <div className="hidden lg:block">
        <GridBackgroundDemo />
      </div>
      {isSuccess && (
        <Confetti
          ref={confettiRef}
          className="absolute top-0 left-0 z-0 size-full"
          onMouseEnter={() => {
            confettiRef.current?.fire({});
          }}
        />
      )}
      <Card className="relative w-[350px] dark:bg-[#0e0f11]">
        <CardHeader>
          <CardTitle>{isSuccess ? 'Billing succeed!' : 'Payment failed!'}</CardTitle>
          <CardDescription>
            {isSuccess
              ? 'Your tokens have been added correctly.'
              : 'You did not get charged and tokens were not added either.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Image src={isSuccess ? shape3 : shape4} alt="confirm-img" width={124} height={124} />
        </CardContent>
        <CardFooter className="flex items-center justify-center">
          <Link href="/" className="w-full">
            <Button className="group w-full rounded-full">
              Move to home
              <ArrowRight className="ml-2 text-black transition-transform duration-300 group-hover:translate-x-2" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Page;
