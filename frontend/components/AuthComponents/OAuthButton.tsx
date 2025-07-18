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
      className={`flex h-[50px] w-full items-center justify-center border-2 ${className || ''}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <Image src={icon} alt={label} width={24} height={24} />
      <span className="ml-2 text-gray-500">{label}</span>
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