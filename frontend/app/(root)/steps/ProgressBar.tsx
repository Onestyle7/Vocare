'use client';
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

  const visibleSteps = steps.slice(0, totalSteps);

  return (
    <div className="font-poppins mb-8 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between relative">
        {visibleSteps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Circle */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`
                  relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full 
                  transition-all duration-500 ease-in-out transform
                  ${
                    step.number === currentStep
                      ? 'text-white scale-110 shadow-lg' 
                      : step.number < currentStep
                      ? 'text-white shadow-md'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }
                `}
                style={{
                  backgroundColor: step.number <= currentStep ? '#915EFF' : undefined,
                  boxShadow: step.number === currentStep ? '0 10px 25px rgba(145, 94, 255, 0.3)' : undefined
                }}
              >
                {step.number < currentStep ? (
                  <div className="relative">
                    <svg
                      className="w-4 h-4 sm:w-6 sm:h-6 animate-bounce-in"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                        className="animate-draw-check"
                      />
                    </svg>
                  </div>
                ) : (
                  <span className="text-sm sm:text-lg font-semibold">{step.number}</span>
                )}
                

              </div>
              
              {/* Step Label */}
              <span 
                className={`
                  mt-2 text-xs sm:text-sm font-medium text-center max-w-20 sm:max-w-none
                  transition-colors duration-300
                  ${
                    step.number <= currentStep
                      ? 'dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }
                `}
                style={{
                  color: step.number <= currentStep ? '#915EFF' : undefined
                }}
              >
                {step.name}
              </span>
            </div>

            {/* Connecting Line */}
            {index < visibleSteps.length - 1 && (
              <div className="flex-1 flex items-center px-2 sm:px-4 -mt-6">
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`
                      h-full rounded-full transition-all duration-700 ease-in-out
                      ${
                        step.number < currentStep
                          ? 'w-full'
                          : 'w-0'
                      }
                    `}
                    style={{
                      backgroundColor: step.number < currentStep ? '#915EFF' : undefined
                    }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes draw-check {
          0% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dasharray: 100 0;
            stroke-dashoffset: 0;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-draw-check {
          stroke-dasharray: 100;
          animation: draw-check 0.8s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}