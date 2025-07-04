import React from 'react';

interface CustomButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  url?: string;
  disabled?: boolean;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-[#915EFF] text-white shadow-[0_2px_4px_rgba(145,94,255,0.5)]',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline:
    'border border-[#915EFF] dark:text-white hover:hover:bg-[#713ae8] shadow-[0_2px_4px_rgba(145,94,255,0.5)] text-black',
};

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  url,
  disabled = false,
}) => {
  const baseStyles =
    'px-4 py-2 rounded-lg font-medium focus:outline-none lg:w-1/2 transition-all duration-300 ease-out border-b-3 border-r-3 border-transparent hover:dark:border-neutral-300 hover:border-neutral-800 hover:-translate-y-2 cursor-none';

  const buttonStyles = `${baseStyles} ${variantStyles[variant] || ''} ${className} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  return (
    <button
      onClick={url ? () => (window.location.href = url) : onClick}
      className={buttonStyles}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default CustomButton;
