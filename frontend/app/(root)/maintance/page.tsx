'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Maintenance() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes slideUpLines {
          from {
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            transform: scaleY(1);
            transform-origin: bottom;
          }
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInCenter {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            text-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
          }
          50% {
            text-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
          }
        }

        @keyframes wrenchSpin {
          0% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-15deg);
          }
          75% {
            transform: rotate(15deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        .line-animate {
          animation: slideUpLines 1.2s ease-out forwards;
        }

        .text-left-animate {
          animation: slideInLeft 0.8s ease-out 0.5s forwards;
        }

        .text-right-animate {
          animation: slideInRight 0.8s ease-out 1.5s forwards;
        }

        .text-center-animate {
          animation: slideInCenter 1s ease-out 1s forwards;
        }

        .maintenance-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .wrench-icon {
          animation: wrenchSpin 2s ease-in-out infinite;
        }
      `}</style>

      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#FF6B35' }}
      >
        <div className="absolute inset-0 flex">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 border-r-2 border-black ${isLoaded ? 'line-animate' : 'origin-bottom scale-y-0'}`}
              style={{
                minWidth: '1px',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Fine Lines for Texture */}
        <div className="absolute inset-0 flex opacity-20">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={`fine-${i}`}
              className={`flex-1 border-r border-black/30 ${isLoaded ? 'line-animate' : 'origin-bottom scale-y-0'}`}
              style={{
                minWidth: '0.5px',
                animationDelay: `${i * 0.02}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 h-full w-full">
          <div
            className={`absolute top-12 left-12 ${isLoaded ? 'text-left-animate' : '-translate-x-24 transform opacity-0'}`}
          >
            <h1
              className="leading-none font-black select-none"
              style={{
                fontSize: 'clamp(2rem, 6vw, 4.5rem)',
                color: '#000',
                letterSpacing: '-0.05em',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              WE&apos;RE
              <br />
              WORKING
              <br />
              ON IT
            </h1>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div
                className={`${isLoaded ? 'text-center-animate maintenance-glow' : 'translate-y-12 opacity-0'}`}
              >
                <h2
                  className="mb-6 block leading-none font-black select-none"
                  style={{
                    fontSize: 'clamp(3rem, 8vw, 6rem)',
                    color: '#000',
                    fontFamily: 'Arial Black, system-ui, sans-serif',
                    letterSpacing: '-0.05em',
                  }}
                >
                  MAINTENANCE
                </h2>
                <p
                  className="font-bold select-none"
                  style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    color: '#000',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '-0.02em',
                  }}
                >
                  PERFORMING SERVICE FIXES{dots}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`absolute right-12 bottom-12 text-right ${isLoaded ? 'text-right-animate' : 'translate-x-24 transform opacity-0'}`}
          >
            <div className="mb-6">
              <p
                className="leading-tight font-bold select-none"
                style={{
                  fontSize: 'clamp(1.2rem, 3vw, 2rem)',
                  color: '#000',
                  letterSpacing: '-0.02em',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                ESTIMATED TIME:
                <br />
                <span className="font-black">2-4 HOURS</span>
              </p>
            </div>
            <Link href="/" className="group block transition-all duration-300 hover:scale-105">
              <h3
                className="leading-none font-black transition-opacity duration-300 select-none group-hover:opacity-70"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 4rem)',
                  color: '#000',
                  letterSpacing: '-0.05em',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                CHECK
                <br />
                LATER
              </h3>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
