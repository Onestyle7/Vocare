import Link from 'next/link';
import { Button } from '../ui/button';
import Image from 'next/image';
import React from 'react';

type OAuthButtonProps = {
  icon: string;
  label: string;
  url?: string;
  onClick?: () => void;
  bgColor?: string;
  className?: string;
};

const OAuthButton = ({ icon, label, url, onClick, bgColor, className }: OAuthButtonProps) => {
  const buttonContent = (
    <Button
      style={bgColor ? { backgroundColor: bgColor } : { backgroundColor: 'transparent' }}
      className={`group relative flex h-[50px] w-full items-center justify-center overflow-hidden border-2 transition-all duration-300 hover:pr-8 ${className || ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <Image src={icon} alt={label} width={24} height={24} />
      <span className="ml-2 text-gray-500 transition-colors duration-300 group-hover:text-gray-700">
        {label}
      </span>

      {/* Strzałka */}
      <svg
        className="absolute right-4 h-4 w-4 translate-x-8 transform text-gray-500 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Button>
  );

  if (url && !onClick) {
    return (
      <Link href={url} className="h-full w-full">
        {buttonContent}
      </Link>
    );
  }

  return <div className="h-full w-full">{buttonContent}</div>;
};

export default OAuthButton;
