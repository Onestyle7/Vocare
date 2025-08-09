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
      className={`group flex h-[50px] w-full items-center justify-center border-2 relative overflow-hidden transition-all duration-300 hover:pr-8 ${className || ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <Image src={icon} alt={label} width={24} height={24} />
      <span className="ml-2 text-gray-500 group-hover:text-gray-700 transition-colors duration-300">{label}</span>
      
      {/* Strzałka */}
      <svg 
        className="absolute right-4 w-4 h-4 text-gray-500 transform translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out" 
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