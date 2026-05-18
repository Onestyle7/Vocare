import Image, { type StaticImageData } from 'next/image';
import React from 'react';

const SocialProofCard = ({
  description,
  avatarImg,
  name,
  occupation,
  className = '',
  compact = false,
}: {
  description: string;
  avatarImg: string | StaticImageData;
  name: string;
  occupation: string;
  className?: string;
  compact?: boolean;
}) => {
  const gap = compact ? 'gap-4' : 'gap-7.25';

  return (
    <div
      className={`flex h-full flex-col items-start justify-start ${gap} rounded-3xl bg-[#191B1F] p-7.25 text-[#F1F4FF] ${className}`}
    >
      <p className="text-left font-light">{description}</p>

      <div className="mt-auto flex w-full flex-row items-center gap-4">
        <Image
          src={avatarImg}
          alt={`avatar-${name}`}
          width={75}
          height={75}
          className="pointer-events-none h-18.75 w-18.75 shrink-0 rounded-full object-cover"
        />
        <div className="flex flex-col items-start justify-center space-y-2">
          <p className="text-[14px] font-light">{name}</p>
          <p className="text-[14px] font-light opacity-43">{occupation}</p>
        </div>
      </div>
    </div>
  );
};

export default SocialProofCard;
