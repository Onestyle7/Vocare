import React from 'react';

interface RulerProps {
  widthMM: number;
  heightMM: number;
}

const Ruler: React.FC<RulerProps> = ({ widthMM, heightMM }) => {
  const horizontalMarks = [];
  for (let i = 0; i <= widthMM; i += 10) {
    horizontalMarks.push(
      <div
        key={`h-${i}`}
        className="absolute top-0 text-[8px] text-gray-500 select-none pointer-events-none"
        style={{ left: `${i}mm`, transform: 'translateX(-50%) translateY(-100%)' }}
      >
        {i}
      </div>
    );
  }

  const verticalMarks = [];
  for (let i = 0; i <= heightMM; i += 10) {
    verticalMarks.push(
      <div
        key={`v-${i}`}
        className="absolute left-0 text-[8px] text-gray-500 select-none pointer-events-none"
        style={{ top: `${i}mm`, transform: 'translateX(-100%) translateY(-50%)' }}
      >
        {i}
      </div>
    );
  }

  return (
    <>
      {horizontalMarks}
      {verticalMarks}
    </>
  );
};

export default Ruler;
