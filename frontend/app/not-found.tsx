'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

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
        
        @keyframes popIn {
          0% {
            transform: scale(0) rotate(180deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.1) rotate(-10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .line-animate {
          animation: slideUpLines 1.2s ease-out forwards;
        }
        
        .text-left-animate {
          animation: slideInLeft 0.8s ease-out 0.5s forwards;
        }
        
        .text-right-animate {
          animation: slideInRight 0.8s ease-out 1.2s forwards;
        }
        
        .number-animate-1 {
          animation: popIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.8s forwards;
        }
        
        .number-animate-2 {
          animation: popIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.9s forwards;
        }
        
        .number-animate-3 {
          animation: popIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) 1s forwards;
        }
      `}</style>
      
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#915EFF' }}
      >
        <div className="absolute inset-0 flex">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 border-r-2 border-black ${isLoaded ? 'line-animate' : 'scale-y-0 origin-bottom'}`}
              style={{ 
                minWidth: '1px',
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        {/* Fine Lines for Texture */}
        <div className="absolute inset-0 flex opacity-20">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={`fine-${i}`}
              className={`flex-1 border-r border-black/30 ${isLoaded ? 'line-animate' : 'scale-y-0 origin-bottom'}`}
              style={{ 
                minWidth: '0.5px',
                animationDelay: `${i * 0.02}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full h-full">
          
          <div 
            className={`absolute top-12 left-12 ${isLoaded ? 'text-left-animate' : 'opacity-0 transform -translate-x-24'}`}
          >
            <h1 
              className="font-black leading-none select-none"
              style={{ 
                fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                color: '#000',
                letterSpacing: '-0.05em',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
            ARE YOU<br />LOST?
            </h1>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center">
              <div className={`relative ${isLoaded ? 'number-animate-1' : 'opacity-0 scale-0'}`}>
                <span 
                  className="font-black leading-none select-none block"
                  style={{ 
                    fontSize: 'clamp(10rem, 28vw, 22rem)',
                    color: '#000',
                    fontFamily: 'Arial Black, system-ui, sans-serif',
                    letterSpacing: '-0.1em'
                  }}
                >
                  4
                </span>
              </div>
              
              <div className={`relative mx-2 ${isLoaded ? 'number-animate-2' : 'opacity-0 scale-0'}`}>
                <span 
                  className="font-black leading-none select-none block"
                  style={{ 
                    fontSize: 'clamp(10rem, 28vw, 22rem)',
                    color: '#000',
                    fontFamily: 'Arial Black, system-ui, sans-serif',
                    letterSpacing: '-0.1em'
                  }}
                >
                  0
                </span>
              </div>
              
              <div className={`relative ${isLoaded ? 'number-animate-3' : 'opacity-0 scale-0'}`}>
                <span 
                  className="font-black leading-none select-none block"
                  style={{ 
                    fontSize: 'clamp(10rem, 28vw, 22rem)',
                    color: '#000',
                    fontFamily: 'Arial Black, system-ui, sans-serif',
                    letterSpacing: '-0.1em'
                  }}
                >
                  4
                </span>
              </div>
            </div>
          </div>

          <div 
            className={`absolute bottom-12 right-12 text-right ${isLoaded ? 'text-right-animate' : 'opacity-0 transform translate-x-24'}`}
          >
            <Link 
              href="/"
              className="group block transition-all duration-300 hover:scale-105"
            >
              <h2 
                className="font-black leading-none group-hover:opacity-70 transition-opacity duration-300 select-none"
                style={{ 
                  fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                  color: '#000',
                  letterSpacing: '-0.05em',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                BACK TO<br />HOME
              </h2>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}