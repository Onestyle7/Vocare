'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type ButtonAsButton = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: 'button';
};

type ButtonAsAnchor = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  as: 'a';
  href: string;
};

type ButtonGenerateProps = ButtonAsButton | ButtonAsAnchor;

const base =
  'relative mt-auto h-12 w-1/2 rounded-full font-bold text-white inline-flex items-center justify-center ' +
  'bg-[linear-gradient(90deg,rgba(146,150,253,1)_0%,rgba(132,145,254,1)_50%,rgba(199,169,254,1)_100%,rgba(157,155,255,1)_77%)] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#915EFF]/50 disabled:opacity-50 disabled:cursor-not-allowed';

const ButtonGenerate: React.FC<ButtonGenerateProps> = ({
  as = 'button',
  className,
  children,
  ...props
}) => {
  if (as === 'a') {
    const { href, ...rest } = props as ButtonAsAnchor;
    return (
      <a href={href} className={cn(base, className)} {...rest}>
        {children}
      </a>
    );
  }

  const { type = 'button', ...rest } = props as ButtonAsButton;
  return (
    <button className={cn(base, className)} type={type} {...rest}>
      {children}
    </button>
  );
};

export default ButtonGenerate;
export { ButtonGenerate };
