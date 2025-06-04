'use client';

import { shape2 } from '@/app/constants';
import Image from 'next/image';
import React from 'react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const steps = [
    { number: 1, name: 'Basic info' },
    { number: 2, name: 'Contact' },
    { number: 3, name: 'Experience' },
    { number: 4, name: 'Additional' },
    { number: 5, name: 'Financial' },
  ];

  return (
    <div className="font-poppins mb-8">
      <div className="mb-2 flex justify-between">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step.number === currentStep
                  ? 'bg-primary text-white dark:text-black'
                  : step.number < currentStep
                    ? 'text-white dark:text-black'
                    : 'bg-gray-200 dark:text-black'
              }`}
            >
              {step.number < currentStep ? (
                <Image src={shape2} width={36} height={36} alt="check" />
              ) : (
                step.number
              )}
            </div>
            <span className="mt-1 text-xs">{step.name}</span>
          </div>
        ))}
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="bg-primary dark:bg-secondary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
