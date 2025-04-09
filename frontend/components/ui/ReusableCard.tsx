import React from 'react';

interface ReusableCardProps {
  backgroundColor?: string;
  text?: string;
  iconLeft?: React.ReactNode;
  subText?: string;
  /** Opcjonalna ikona przed subtekstem */
  subTextIcon?: React.ReactNode;
  rightIcons?: React.ReactNode[];
}

export const ReusableCard: React.FC<ReusableCardProps> = ({
  backgroundColor = '#e91e63',
  text,
  iconLeft,
  subText,
  subTextIcon,
  rightIcons,
}) => {
  return (
    <div className="relative rounded-xl p-2" style={{ backgroundColor }}>
      <div className="flex items-start">
        {iconLeft && <div className="mr-0 flex-shrink-0 xl:mr-2">{iconLeft}</div>}

        <div>
          <span className="block text-xs font-bold text-white">{text}</span>

          {subText && (
            <div className="mt-1 flex items-center text-xs text-white">
              {subTextIcon && <span className="mr-1 mb-[1px]">{subTextIcon}</span>}
              {subText}
            </div>
          )}
        </div>
      </div>

      {rightIcons && rightIcons.length > 0 && (
        <div className="absolute right-2 bottom-2 flex -space-x-1">
          {rightIcons.map((icon, index) => (
            <div key={index} className="flex-shrink-0">
              {icon}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
