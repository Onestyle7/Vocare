'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Maintenance() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Opóźnienie dla płynnego wejścia elementów
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#FF6B35] font-sans text-black selection:bg-black selection:text-[#FF6B35]">
      
      {/* --- TŁO: Siatka (Grid) --- */}
      {/* Używamy absolute inset-0, ale z niższym z-indexem. Usunąłem skomplikowane animacje na rzecz prostego opacity. */}
      <div className="absolute inset-0 z-0 flex justify-between px-6 md:px-12 pointer-events-none opacity-20">
        {/* Generujemy 6 pionowych linii dla struktury */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-[1px] h-full bg-black transition-transform duration-[1500ms] ease-out origin-top ${
              mounted ? 'scale-y-100' : 'scale-y-0'
            }`}
            style={{ transitionDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* --- TREŚĆ GŁÓWNA --- */}
      <div className="relative z-10 flex flex-col h-screen w-full p-6 md:p-12">
        
        {/* 1. Nawigacja (Lewy górny róg) */}
        <header className="flex-none">
          <Link
            href="/"
            className={`group flex items-center gap-4 w-fit transition-all duration-700 ease-out ${
              mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            {/* Kółko ze strzałką */}
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 border-2 border-black rounded-full transition-colors duration-300 group-hover:bg-black group-hover:text-[#FF6B35]">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5} 
                stroke="currentColor" 
                className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:-translate-x-1"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </div>
            
            {/* Tekst przycisku */}
            <span className="text-lg md:text-xl font-bold uppercase tracking-wide">
              Powrót
            </span>
          </Link>
        </header>

        {/* 2. Centrum (Maintenance Message) */}
        <main className="flex-1 flex flex-col items-center justify-center text-center">
          
          {/* Wielki Nagłówek */}
          <div className="relative overflow-hidden">
            <h1 
              className={`text-[13vw] leading-[0.8] font-black uppercase tracking-tighter transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            >
              Main<br />tenance
            </h1>
          </div>

          {/* Podtytuł */}
          <div className="mt-8 md:mt-12 overflow-hidden">
            <p 
              className={`text-lg md:text-2xl font-medium max-w-xl mx-auto border-l-2 border-black pl-6 text-left transition-all duration-1000 delay-300 ease-out font-grotesk ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              Przerwa techniczna. <br />
              System płatności przechodzi planowaną modernizację.
            </p>
          </div>

        </main>

        {/* 3. Stopka (Informacje techniczne) */}
        <footer className="flex-none w-full flex justify-between items-end border-t-2 border-black pt-4">
          <div className={`text-xs md:text-sm font-bold font-mono uppercase tracking-widest transition-opacity duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            System Status: <span className="animate-pulse">Offline</span>
          </div>
          <div className={`text-xs md:text-sm font-bold font-mono uppercase tracking-widest transition-opacity duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            ERR: 503
          </div>
        </footer>

      </div>
    </div>
  );
}