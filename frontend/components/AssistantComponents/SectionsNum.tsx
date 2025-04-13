import React from 'react';

const SectionsNum = ({ number, color }: { number: string; color: string }) => {
  return (
    <span color={color} className={`text-4xl font-bold md:text-6xl bg-${color}`}>
      {number}
    </span>
  );
};

export default SectionsNum;
