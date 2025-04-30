'use client';

import React from 'react';
import { Plus } from 'lucide-react';

const TokenCounter = () => {
  return (
    <div className="group relative flex flex-row items-center gap-4 py-2 px-4 border rounded-full text-md hover:cursor-pointer transition">
      <div className="flex items-center">
        Tokens:
        <span className="ml-2 text-[#915EFF] font-semibold">200</span>
      </div>

      <div className="absolute -right-8 flex h-8 w-8 items-center justify-center rounded-full border border-[#915EFF] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:right-[-2.5rem]">
        <Plus className="text-[#915EFF] transition-transform duration-300 group-hover:rotate-90" size={14} />
      </div>
    </div>
  );
};

export default TokenCounter;
