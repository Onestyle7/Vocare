'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const GenerateRecommendation = () => {
  return (
    <div className="mx-4 flex flex-col items-center justify-center rounded-[28px] border p-8 shadow-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex justify-center">
          <Image
            src="/images/no-data.svg"
            alt="No market analysis data"
            width={200}
            height={200}
            className="mb-6"
          />
        </div>

        <h3 className="mb-4 text-2xl font-semibold">No Market Analysis Available</h3>

        <p className="mb-6 max-w-2xl text-gray-600 dark:text-gray-300">
          There is currently no job market analysis data available. Generate a new analysis to see
          insights about industry trends, employment rates, and in-demand skills.
        </p>

        <div className="rounded-lg bg-purple-50 p-5 dark:bg-purple-900/20">
          <h4 className="mb-3 text-lg font-medium text-[#915EFF]">What You&apos;ll Get:</h4>
          <ul className="text-left">
            <li className="mb-2 flex items-start">
              <span className="mr-2 text-[#915EFF]">•</span>
              <span>
                Detailed industry statistics including average salaries and growth forecasts
              </span>
            </li>
            <li className="mb-2 flex items-start">
              <span className="mr-2 text-[#915EFF]">•</span>
              <span>Current market trends affecting job opportunities</span>
            </li>
            <li className="mb-2 flex items-start">
              <span className="mr-2 text-[#915EFF]">•</span>
              <span>Most in-demand skills across different industries</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#915EFF]">•</span>
              <span>Insights to help you make informed career decisions</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default GenerateRecommendation;
