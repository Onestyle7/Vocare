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
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_2px_4px_rgba(59,130,246,0.5)]',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
};

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  variant = 'primary', 
  className = '',
  url,
  disabled = false,
}) => {
  // Bazowe klasy wspólne dla wszystkich wariantów
  const baseStyles = 'px-4 py-2 rounded-full font-medium focus:outline-none lg:w-1/2';

  // Łączenie stylów: bazowe + wariant + dodatkowe klasy
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