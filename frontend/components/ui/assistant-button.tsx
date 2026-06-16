import Link from 'next/link';
import React from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type IconPosition = 'left' | 'right';

type ButtonBaseProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  iconWrapperClassName?: string;
  iconWrapperStyle?: React.CSSProperties;
  className?: string;
};

type ButtonAsLinkProps = ButtonBaseProps & {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type ButtonAsButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonProps = ButtonAsLinkProps | ButtonAsButtonProps;

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#7B7DF5] text-white hover:bg-[#6B6DE8] active:bg-[#5B5DD8]',
  secondary: 'bg-[#1F2025] text-[#F1F4FF] hover:bg-[#26272D] hover:border-white/20',
  ghost: 'bg-transparent text-[#F1F4FF] hover:bg-white/5',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5 rounded-full',
  md: 'min-h-[52px] px-6 text-[15px] gap-2 rounded-full',
  lg: 'h-14 px-7 text-base gap-2.5 rounded-full',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  iconWrapperClassName,
  iconWrapperStyle,
  className,
  ...props
}: ButtonProps) => {
  const baseClasses = cn(
    'font-poppins inline-flex w-fit items-center justify-center font-medium',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B7DF5]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1013]',
    'disabled:pointer-events-none disabled:opacity-50',
    'whitespace-nowrap',
    variants[variant],
    sizes[size],
    className
  );

  const renderIcon = () => (
    <span
      className={cn('flex shrink-0 items-center justify-center', iconWrapperClassName)}
      style={iconWrapperStyle}
    >
      {icon}
    </span>
  );

  const content = (
    <>
      {icon && iconPosition === 'left' ? renderIcon() : null}
      <span>{children}</span>
      {icon && iconPosition === 'right' ? renderIcon() : null}
    </>
  );

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButtonProps;

  return (
    <button className={baseClasses} {...buttonProps}>
      {content}
    </button>
  );
};

export default Button;
