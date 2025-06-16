import Link from "next/link";
import { Button } from "../ui/button";
import Image from "next/image";
import React from "react";

type OAuthButtonProps = {
  icon: string; 
  label: string;
  url: string;
  bgColor?: string; 
  className?: string;
};

const OAuthButton = ({ icon, label, url, bgColor, className }: OAuthButtonProps) => {
  return (
    <Link href={url} className="w-full h-full">
      <Button
        style={bgColor ? { backgroundColor: bgColor } : { backgroundColor: 'transparent' }}
        className={`flex items-center justify-center w-full h-[50px] border-2 ${className || ''}`}
      >
        <Image src={icon} alt={label} width={24} height={24} />
        <span className="ml-2 text-gray-500">{label}</span>
      </Button>
    </Link>
  );
};

export default OAuthButton;
